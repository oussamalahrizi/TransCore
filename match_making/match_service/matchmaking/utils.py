from redis import Redis

"""

    uuid : in_queue | in game 
"""
from asgiref.sync import async_to_sync
import uuid, json

from core.rabbitmq import NotificationPub
from core.publishers import publishers

notif = publishers[1]

class Cache:

    pong_queue = "pong"
    tic_queue = "tic"

    def __init__(self):
        self.redis = Redis(host="redis-queue", decode_responses=True, retry_on_timeout=True)

    def remove_player(self, user_id, type=None):
        """
        Remove a player from the specified queue
        """
        if not type:
            type = [self.pong_queue, self.tic_queue]
        else:
            type = [type]
        for t in type:
            self.redis.lrem(t, 0, user_id)
            print(f"removed {user_id} from {t} queue")

    def store_player(self, user_id : str, game : str):
        """
            store the player in queue and try to find a match
        """
        type = self.pong_queue if game == "pong" else self.tic_queue
        self.redis.rpush(type, user_id)
        self.match(type, user_id, notif)

    def match(self, type : str, user_id : str, notif : NotificationPub):
        if self.redis.llen(type) >= 2:
            player1 = self.redis.lpop(type)
            player2 = self.redis.lpop(type)
            self.generate_game([player1, player2], match_type="regular", game=type)
            return
        body = {
            'type' : "update_status",
            'data' : {
                'user_id' : user_id,
                'status' : 'inqueue'
            }
        }
        async_to_sync(notif.publish)(body)

    def generate_game(self, players : list[str], match_type : str, game : str):
        """
        `match_type` is either regular or tournament
        
        `game` is either pong or tic
        
        Generate a game id and store in cache for 120 seconds
        and notify both players matched.
        
        Example:

            pong:game_id : {
                players : [user1_id, user2_id], 
                match_type : regular | tournament | singleplayer
            }
        """
        id = uuid.uuid4()
        data = {
            'players' : players,
            'match_type' : match_type
        }
        self.redis.set(f"{game}:{id}", json.dumps(data))
        for p in players:
            body = {
                'type' : "match_found",
                'data' : {
                    "user_id" : p,
                    'game_id' : str(id)
                }
            }
            async_to_sync(notif.publish)(body)
    
    def get_game_info(self, game_id : str, type : str):
        data = self.redis.get(f'{type}:{game_id}')
        if data:
            return json.loads(data)
        return None
    
    

Queue = Cache()


class Tournament:
    
    def __init__(self):
        self.redis = Redis(host="redis-queue", decode_responses=True, retry_on_timeout=True)

    def generate_game(self, players : list[str], match_type : str, game : str):
        id = uuid.uuid4()
        data = {
            'players' : players,
            'match_type' : "tournament"
        }
        self.redis.set(f"{game}:{id}", json.dumps(data))
        for p in players:
            body = {
                'type' : "match_found",
                'data' : {
                    "user_id" : p,
                    'game_id' : str(id)
                }
            }
            async_to_sync(notif.publish)(body)