from redis import Redis

"""

    uuid : in_queue | in game 
"""
from asgiref.sync import async_to_sync
import uuid, json

from core.rabbitmq import NotificationPub
from core.publishers import publishers
import asyncio

notif = publishers[1]

class Cache:

    pong_queue = "pong"
    tic_queue = "tic"

    def __init__(self):
        self.redis = Redis(host="redis-queue", decode_responses=True, retry_on_timeout=True)

    def remove_player(self, user_id):
        """
        Remove a player from the specified queue
        """
        type = [self.pong_queue, self.tic_queue]
        for t in type:
            self.redis.lrem(t, 0, user_id)
            print(f"removed {user_id} from {t} queue")

    def invite_player(self, user_id : str, other : str, type : str):
        already = self.redis.get(f"invite:{type}:{user_id}")
        if already == other:
            return "Already sent", False
        already_other = self.redis.get(f"invite:{type}:{other}")
        if already_other == user_id:
            return "User Already sent you an invite", False
        self.redis.setex(f"invite:{type}:{user_id}", value=other, time=30)
        return "Invite Sent!", True
        

    def store_player(self, user_id : str, game : str):
        """
            store the player in queue and try to find a match
        """
        type = self.pong_queue if game == "pong" else self.tic_queue
        if not self.redis.lpos(type, user_id):
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

    def handle_decline(self, game_id, type, user_id):
        game = self.get_game_info(game_id, type)
        players : list = game["players"]
        from pprint import pprint
        pprint(players)
        if user_id in players:
            players.remove(user_id)
        other = None
        if len(players):
            other = players.pop()
            self.store_player(other, type)
            print("storing other in queue again")
        self.redis.delete(f"{type}:{game_id}")
        body = {
            'type' : 'cancel_game',
            'data' : {
                'user_id' : user_id,
                'status' : "online"
            }
        }
        async_to_sync(notif.publish)(body)
        async_to_sync(asyncio.sleep)(0.3)
        if other:
            print("sending other cancel game")
            body["data"]["user_id"] = other
            body["data"]["status"] = "inqueue"
            async_to_sync(notif.publish)(body)
        
    
    

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