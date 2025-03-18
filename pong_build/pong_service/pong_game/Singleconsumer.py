from channels.generic.websocket import AsyncWebsocketConsumer
import json, asyncio
from core.asgi import GameState
from .utils import Game_Cache
from asgiref.sync import sync_to_async
from core.asgi import game_task, Game
import time
from channels.layers import get_channel_layer

layer = get_channel_layer()
async def broadcastSingle(instance: GameState):
    try:
        lasttime = time.time()
        print("gameover ? :", instance.gameover)
        while not instance.gameover:
            current = time.time()
            delta = current - lasttime
            # if bdelta >= 1:
                # bdelta = current - lasttime
            instance.updateBall()
            instance.updateBot()
            await layer.group_send(instance.game_id, {
                'type' : 'gameState',
                'state' : json.dumps(instance.to_dict())
            })
            if delta < 0.0083:
                await asyncio.sleep(0.0083 - delta) # 120 frames
            lasttime = current

    except Exception as e:
        print(e)
    finally:
        await layer.group_send(instance.game_id, {
            'type' : 'game_end',
            'winner' : instance.winner
        })


class SingleConsumer(AsyncWebsocketConsumer):
    
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
        self.players_ids = self.cache.get_players(self.game_id)
        await self.send(json.dumps({
            'type' : 'waiting',
            'player_id' : self.user_id
        }))
        await self.start_game()

    async def disconnect(self, code):
        # in case middleware error
        if self.username:
            print(f"{self.username} disconnected, code : ", code)
        if code == 4001:
            return
        winner = self.cache.get_players(self.game_id)
        Game.get(self.game_id).winner = winner
        self.cache.remove_player(self.user_id, self.game_id)
        if code == 4003:
            return
        # first send result if not game over
        await self.channel_layer.group_discard(self.game_id, self.channel_name)
        print(f"{self.username} removed")
        if Game.get(self.game_id):
            # players = self.cache.get_player_count(self.game_id);
            # print(players)
            Game.get(self.game_id).winner = winner
            print(Game.get(self.game_id).winner)
            Game.get(self.game_id).gameover = True
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
        instance.singleplayer = True
        Game[self.game_id] = instance
        await self.channel_layer.group_send(self.game_id, {
            'type' : 'send_init_data',
        })
        game_task[self.game_id] = asyncio.create_task(broadcastSingle(instance))