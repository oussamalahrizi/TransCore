from channels.generic.websocket import AsyncWebsocketConsumer
import json, asyncio
from .utils import GameState, Game, game_task
from .utils import Game_Cache
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
import time


from .services import GameService
from core.publisher import publishers

# game_task : dict[str, asyncio.Task] = {}

# Game : dict[str, GameState] = {}

queue = publishers[0]

async def publishQueue(data : dict):
    await queue.publish(data)

layer = get_channel_layer()

@database_sync_to_async
def record_match_async(player1_id, player2_id, winner_id, p1_score, p2_score):
    return GameService.record_match(player1_id, player2_id, winner_id, p1_score, p2_score)


async def send_game_over(instance, tr_id=None):
    result = [instance.p1_score, instance.p2_score]
    if instance.winner == instance.players[1]:
        result.reverse()
    body = {
            'type' : "game_over",
            'data' : {
                'game_id' : instance.game_id,
                'match_type' :instance.match_type,
                'game_type' : "pong",
                'winner' : instance.winner,
                'result' : result
            }
        }
    if tr_id:
        body['data']['tournament_id'] = tr_id
        await asyncio.sleep(1.5)
    await publishQueue(body)
    print("GAME SENT GAME OVER")

async def broadcast(Game : GameState, tr_id=None):
    try:
        lasttime = time.time()
        while not Game.gameover:
            current = time.time()
            delta = current - lasttime
            Game.updateBall()
            await layer.group_send(Game.game_id, {
                'type' : 'gameState',
                'state' : json.dumps(Game.to_dict())
            })
            if delta < 0.0083:
                await asyncio.sleep(0.0083 - delta) # 120 frames
            lasttime = current
        # print("broad cast over")
    except asyncio.CancelledError:
        # print("task was cancelled success")
        pass
    finally:
        print("FINALLY ")
        p1_score = Game.p1_score
        p2_score = Game.p2_score
        player1_id = Game.players[0]
        player2_id = Game.players[1]
        winner_id = Game.winner
        
        await record_match_async(player1_id, player2_id, winner_id, p1_score, p2_score)
        
        await layer.group_send(Game.game_id, {
            'type' : 'game_end',
            'winner' : Game.winner
        })
        asyncio.create_task(send_game_over(Game, tr_id))

        
        
from pprint import pprint

class Consumer(AsyncWebsocketConsumer):
    
    cache = Game_Cache
    game_id = None
    user = None
    user_id = None
    players_ids = []

    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    async def connect(self):
        await self.accept()
        error = self.scope.get('error_message')
        if error:
            await self.close(code=4001, reason=error)
            return
        
        self.user = self.scope['user']
        self.user_id = self.user['id']
        self.username = self.user['username']
        self.game_id = self.scope['game_id']
        # check if both users connected to init fresh game state
        
        res = self.cache.set_player(game_id=self.game_id, user_id=self.user_id)
        if not res:
            await self.close(code=4003, reason="You are already in game")
            return
        await self.channel_layer.group_add(self.game_id, self.channel_name)
        player_count =  self.cache.get_player_count(self.game_id)
        self.players_ids = self.cache.get_players(self.game_id)
        self.game_info = self.scope["game_info"]
        if player_count == 2:
            await self.send(json.dumps({
                'type' : 'waiting',
                'player_id' : self.user_id
            }))
            await self.start_game()
            return
        await self.send(json.dumps({
            'type' : 'waiting',
            'player_id' : self.user_id
        }))
        await asyncio.sleep(3)
        player_count =  self.cache.get_player_count(self.game_id)
        if player_count < 2:
            instance = GameState([self.user_id, self.user_id], self.game_id, self.game_info['match_type'])
            await self.game_end({'winner' : self.user_id})
            tr_id = None
            if self.game_info.get('tournament_id'):
                tr_id = self.game_info.get('tournament_id')
            instance.winner = self.user_id
            instance.game_id = self.game_id
            instance.match_type = self.game_info['match_type']
            instance.p1_score = 5
            instance.p2_score = 0
            asyncio.create_task(send_game_over(instance, tr_id))

    async def disconnect(self, code):
        # in case middleware error
        if hasattr(self, 'username'):
            print(f"{self.username} disconnected, code : ", code)
        if code == 4001:
            return
        self.cache.remove_player(self.user_id, self.game_id)
        if code == 4003:
            return
        # first send result if not game over
        print(f"{self.username} removed")
        if Game.get(self.game_id):
            print("setting winner")
            pprint(self.cache.get_players(self.game_id))
            players= self.cache.get_players(self.game_id)
            if len(players):
                Game.get(self.game_id).winner = self.cache.get_players(self.game_id)[0] ## work around
            Game.get(self.game_id).gameover = True
            game_task.get(self.game_id).cancel()
            game_task.pop(self.game_id)
            Game.pop(self.game_id)

        await self.channel_layer.group_discard(self.game_id, self.channel_name)


    async def close_user(self, event):
        await self.close(reason='Game Over')
        
    async def receive(self, text_data=None , bytes_data=None):
        '''
            {
            type : move_paddle,
            data : {
                key : 'arrow'
                }
            }
        '''
        body = json.loads(text_data)
        data = body.get("data")
        await self.move_paddle(data)
        
    
    async def move_paddle(self, data):
        key = data.get('key')
        player_id = data.get('player_id')
        instance =  Game.get(self.game_id)
        if instance:
            instance.update_player_move(player_id, key)

    
    async def game_end(self, event):
        print("sending gameEnd to : ", self.username)
        winner = 'You Win!'
        winner_id = event['winner']
        
        if self.user_id != winner_id:
            winner = 'You Lost!'
        
        await self.send(json.dumps({
            'type': 'gameEnd',
            'winner': winner
        }))

        await self.channel_layer.group_send(self.game_id, {
            'type': 'close_user'
        })

    async def gameState(self, event):
        state = event['state']
        await self.send(json.dumps({
            'type' : 'gameState',
            'state' : state
        }))

    async def send_init_data(self, event):
        await self.send(json.dumps({
            'type' : 'send_init_data',
            'user_id' : self.user_id
        }))
        await self.send(json.dumps({
            'type' : 'gameStart'
        }))

    async def start_game(self):
        instance = GameState(players=self.players_ids, game_id=self.game_id, match_type=self.game_info['match_type'])
        Game[self.game_id] = instance
        await self.channel_layer.group_send(self.game_id, {
            'type' : 'send_init_data',
        })
        tr_id = None
        if self.game_info.get('tournament_id'):
            tr_id = self.game_info.get('tournament_id')
        game_task[self.game_id] = asyncio.create_task(broadcast(instance, tr_id=tr_id))