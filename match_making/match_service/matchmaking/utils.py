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
        self.redis.setex(f"invite:{type}:{user_id}", value=other, time=12)
        return "Invite Sent!", True
    
    def check_invite(self, user_id, other, type : str):
        other = self.redis.get(f"invite:{type}:{user_id}")
        return other != None

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
                    'game_id' : str(id),
                    'type' : game
                }
            }
            async_to_sync(notif.publish)(body)
    
    def get_game_info(self, game_id : str, type : str):
        data = self.redis.get(f'{type}:{game_id}')
        if data:
            return json.loads(data)
        return None

    def handle_decline(self, game_id, type, user_id, tr_id=None):
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


from random import shuffle
from pprint import pprint



class Tournament:
    
    def __init__(self):
        self.redis = Redis(host="redis-queue", decode_responses=True, retry_on_timeout=True)

    def generate_game(self, players : list[str], tr_id): 
        id = str(uuid.uuid4())
        data = {
            'players' : players,
            'match_type' : "tournament",
            'tournament_id' : tr_id
        }
        self.redis.set(f"pong:{id}", json.dumps(data))
        for p in players:
            body = {
                'type' : "match_found",
                'data' : {
                    "user_id" : p,
                    'game_id' : id
                }
            }
            async_to_sync(notif.publish)(body)
        return id


    def store_player(self, user_id : str):
        tr = self.set_tournament(user_id)
        players : list[str] = tr.get('players')
        if  user_id in players:
            return players
        players.append(user_id)
        self.redis.set("tournament", json.dumps({'players' : players}))
        # update user status in notification
        # care to update playe button as well
        if len(players) == 4:
            return self.match()
        others = list(filter(lambda x : x != user_id, players))
        body = {
            'type' : 'tr_update',
            'data' : {
                'players' : others
            }
        }
        async_to_sync(notif.publish)(body)
        return players

    def send_tournament_status(self, players : list[str], tr_id : str):
        for p in players:
            body = {
                'type' : 'set_tournament',
                'data' : {
                    'user_id' : p,
                    'tournament_id' : tr_id
                }
            }
            async_to_sync(notif.publish)(body)

    def match(self):
        tr = self.redis.get("tournament")
        if not tr:
            return
        tr = json.loads(tr)
        players : list[str] = tr.get("players")
        # Split players into two groups for tournament matches
        shuffle(players)
        half1 = players[:len(players)//2]
        half2 = players[len(players)//2:]
        
        # generate tournament id
        id = str(uuid.uuid4())
        # Create tournament matches with each half
        game1 = self.generate_game(half1, id)
        game2 = self.generate_game(half2, id) # stop generating for now to debug
        games = [game1, game2]
        halfs = [half1, half2]
        self.redis.delete('tournament')
        semis = []
        for i in range(0, len(games)):
            semis.append({
                'game_id' : games[i],
                'players' : halfs[i],
                'result' : [ 0, 0 ]
            })
        tr_data = {
            'semis' : semis,
            'final' : {
                'game_id' : None,
                'players' : [],
                'result' : [ 0, 0 ]
            },
            'winner' : None,
            'status' : 'semis',
            'tournament_id' : id
        }
        self.redis.set(f"ongoing:{id}", json.dumps(tr_data))
        # handle set tournament id in api
        self.send_tournament_status(players, id)
        body = {
            'type' : 'tr_update',
            'data' : {
                'players' : players
            }
        }
        async_to_sync(notif.publish)(body)
        return tr_data


    def set_tournament(self, user_id):
        tr = self.redis.get("tournament")
        if not tr:
           self.redis.set("tournament", json.dumps({
               "players" : [user_id]
           }))
           tr = self.redis.get('tournament')
        return json.loads(tr)

    def fetch_ongoing(self, tournament_id : str):
        tr = self.redis.get(f'ongoing:{tournament_id}')
        return json.loads(tr)
    
    def handle_decline(self, game_id, id, tr_id):
        game = Queue.get_game_info(game_id, 'pong')
        players : list = game["players"]
        other = players[0]
        if other == id:
            other = players[1]
        tr_data = self.fetch_ongoing(tr_id)
        if tr_data['status'] == 'semis':

            semis = tr_data['semis']
            which = 0 if semis[0]['game_id'] == game_id else 1
            semis[which]['result'] = [5, 0]
            final : dict = tr_data['final']
            if other not in final['players']:
                final['players'].append(other)
            self.redis.set(f"ongoing:{tr_id}",
                                    json.dumps(tr_data))
            Queue.redis.delete(f'pong:{game_id}')
            return
        final = tr_data['final']
        final['result'] = [5, 0]
        final['winner'] = id
        final['loser'] = id
        tr_data['final'] = final
        tr_data['status'] = 'final'
        self.redis.set(f"ongoing:{tr_id}",
                                    json.dumps(tr_data))
        # loser = id
        # body = {
        #     'type' : 'remove_tournament',
        #     'data' : {
        #         'user_id' : loser,
        #         'tr_id' : tr_id
        #     }
        # }
        # async_to_sync(notif.publish)(body)



tournament = Tournament()