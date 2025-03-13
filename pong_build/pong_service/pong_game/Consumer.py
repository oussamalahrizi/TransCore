from channels.generic.websocket import AsyncWebsocketConsumer
import json, asyncio
from .game import GameState
from .utils import Game_Cache

class Consumer(AsyncWebsocketConsumer):
    
    actions = {}
    cache = Game_Cache

    def __init__(self, *args, **kwargs):
        self.actions = {
            'move_paddle' : self.move_paddle
        }
        super().__init__(*args, **kwargs)

    async def connect(self):
        await self.accept()
        error = self.scope.get('error_message')
        if error:
            await self.close(code=4001, reason=error)
            return
        self.user = self.scope['user']
        self.user_id = self.user['auth']['id']
        self.game_id = self.scope['game_id']
        # check if both users connected to init fresh game state
        res = self.cache.set_player(game_id=self.game_id, user_id=self.user_id)
        if not res:
            await self.close(code=4003, reason="Same user")
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
        if not self.game_id:
            return
        self.game_task.cancel()
        await self.gameover(self.Game.winner)
        await self.channel_layer.group_discard(self.game_id, self.channel_name)
        # remove from cache object
        self.cache.remove_player(self.user_id, self.game_id)
        # check if there are still players in the cache object
        players = self.cache.get_players(self.game_id)
        if len(players) == 0:
            return
        # send them close user
        await self.channel_layer.group_send(self.game_id, {
            'type' : 'close_user',
        })

    async def close_user(self, event):
        await self.close(reason='Game Over')
        
    async def receive(self, text_data=None , bytes_data=None):
        socket_data : dict = json.loads(text_data)
        '''
            {
            type : move_paddle,
            data : {
                key : 'arrow'
                }
            }
        '''
        if socket_data.get('type') not in self.actions:
            await self.send('action not supported')
            return
        await self.channel_layer.group_send(self.game_id, {
            'type' : socket_data.get('type'),
            'data' : socket_data.get('data')
        })
    

    async def move_paddle(self, event):
        pass
        # data = event['data']
        # player_id = data.get
        
    async def broadcast(self):
        try:
            while not self.Game.gameover:
                self.Game.updateBall()
                await self.channel_layer.group_send(self.game_id, {
                    'type' : 'gameState',
                    'state' : json.dumps(self.Game.to_dict())
                })
            print("game over broadcast")
            await self.gameover(self.Game.winner)
            return
        except asyncio.CancelledError :
            pass

    async def gameover(self, winner_id : str):
        print("sending game over")

        await self.channel_layer.group_send(self.game_id, {
            'type' : 'game_end',
            'winner' : winner_id 
        })
        self.game_task.cancel()


    async def game_end(self, event):
        print("sending gameEnd")
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
            'data' : event['data']
        }))
        await self.send(json.dumps({
            'type' : 'gameStart'
        }))

    async def start_game(self):
        self.Game = GameState(players=self.players_ids)
        await self.channel_layer.group_send(self.game_id, {
            'type' : 'send_init_data',
            'data' : json.dumps(self.players_ids)
        })
        self.game_task = asyncio.create_task(self.broadcast())

    async def stop_game(self):
        pass
        # if not hasattr(self, 'game_task'):
        #     return
        # self.game_task.cancel()
        # self.channel_layer.group_discard(self.game_id, self.channel_name)