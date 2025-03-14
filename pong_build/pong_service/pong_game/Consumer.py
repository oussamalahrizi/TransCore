from channels.generic.websocket import AsyncWebsocketConsumer
import json, asyncio
from .game import GameState
from .utils import Game_Cache
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from channels.db import aclose_old_connections
from channels.exceptions import StopConsumer


game_task : dict[str, asyncio.Task] = {}

Game : dict[str, GameState] = {}

layer = get_channel_layer()


async def broadcast(Game : GameState):
    try:
        while not Game.gameover:
            Game.updateBall()
            await layer.group_send(Game.game_id, {
                'type' : 'gameState',
                'state' : json.dumps(Game.to_dict())
            })
        # print("broad cast over")
    except asyncio.CancelledError:
        # print("task was cancelled success")
        pass
    finally:
        # print("sending game end finally")
        await layer.group_send(Game.game_id, {
            'type' : 'game_end',
            'winner' : Game.winner
        })



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
        self.user_id = self.user['auth']['id']
        self.username = self.user['auth']['username']
        self.game_id = self.scope['game_id']
        # check if both users connected to init fresh game state
        
        res = self.cache.set_player(game_id=self.game_id, user_id=self.user_id)
        if not res:
            await self.close(code=4003, reason="You are already in game")
            return
        await self.channel_layer.group_add(self.game_id, self.channel_name)
        player_count =  self.cache.get_player_count(self.game_id)
        self.players_ids = self.cache.get_players(self.game_id)
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

    async def disconnect(self, code):
        # in case middleware error
        print(f"{self.username} disconnected, code : ", code)
        if code == 4001:
            return
        self.cache.remove_player(self.user_id, self.game_id)
        if code == 4003:
            return
        # first send result if not game over
        await self.channel_layer.group_discard(self.game_id, self.channel_name)
        print(f"{self.username} removed")
        if Game.get(self.game_id):
            Game.get(self.game_id).winner = self.cache.get_players(self.game_id)[0]
            Game.get(self.game_id).gameover = True
            # print(f'{self.username} game over ? ', Game.get(self.game_id).gameover)
            game_task.get(self.game_id).cancel()
            game_task.pop(self.game_id)
        if game_task.get(self.game_id):
            game_task.pop(self.game_id)
        if Game.get(self.game_id):
            Game.pop(self.game_id)
     


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
        data = json.loads(text_data)
        key = data.get('key')
        player_id = data.get('player_id')
        instance =  Game.get(self.game_id)
        instance.update_player_move(player_id, key)
        print("data: ", json.loads(text_data))
        # pass
    

    
    async def game_end(self, event):
        print("sending gameEnd to : " ,self.username)
        winner = 'You Win!'
        if self.user_id != event['winner']:
            winner = 'You Lost!'
        await self.send(json.dumps({
            'type' : 'gameEnd',
            'winner' : winner
            }))
        await self.channel_layer.group_send(self.game_id, {
            'type' : 'close_user'
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
        instance = GameState(players=self.players_ids, game_id=self.game_id)
        Game[self.game_id] = instance
        await self.channel_layer.group_send(self.game_id, {
            'type' : 'send_init_data',
        })
        game_task[self.game_id] = asyncio.create_task(broadcast(instance))