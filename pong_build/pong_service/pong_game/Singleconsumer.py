from channels.generic.websocket import AsyncWebsocketConsumer
import json, asyncio
from .utils import GameState
from .utils import Game_Cache
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from .utils import game_task, Game
import time
from channels.layers import get_channel_layer
from .services import GameService

layer = get_channel_layer()


@database_sync_to_async
def record_single_match_async(player_id, is_win, player_score, cpu_score):
    return GameService.record_single_match(player_id, is_win, player_score, cpu_score)


async def broadcastSingle(instance: GameState):
    try:
        lasttime = time.time()
        while not instance.gameover:
            current = time.time()
            delta = current - lasttime
            instance.updateBot()
            instance.updateBall()
            await layer.group_send(instance.game_id, {
                'type' : 'gameState',
                'state' : json.dumps(instance.to_dict())
            })
            if delta < 0.0083:
                await asyncio.sleep(0.0083 - delta) # 120 frames
            lasttime = current

    except asyncio.exceptions.CancelledError:
        print("Task was canceled")
    except BaseException as e:
        print(e)
    finally:
        print("finally")
        await layer.group_send(instance.game_id, {
            'type' : 'game_end',
            'winner' : instance.winner
        })
        # For single player games, record the match in the database
        if instance.singleplayer and instance.players:
            player_id = instance.players[0]
            p1_score = instance.p1_score
            p2_score = instance.p2_score
            
            # Check if the player won (winner is not "loser")
            is_win = instance.winner != "CPU"

            # Record the single player match in the database
            await record_single_match_async(player_id, is_win, p1_score, p2_score)
            


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
        self.user_id = self.user['id']
        self.username = self.user['username']
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

    async def disconnect(self, code):
        # in case middleware error
    
        if code == 4001:
            return
        if self.username:
            print(f"{self.username} disconnected, code : ", code)
        # winner = self.cache.get_players(self.game_id)
        # Game.get(self.game_id).winner = winner
        self.cache.remove_player(self.user_id, self.game_id)
        if code == 4003:
            return
        # first send result if not game over
        print(f"{self.username} removed")
        instance = Game.get(self.game_id)
        if instance:
            if not instance.gameover:
                instance.gameover = True
                instance.winner = "CPU"
            game_task.get(self.game_id).cancel()
            await game_task.get(self.game_id)
            game_task.pop(self.game_id)
        await self.channel_layer.group_discard(self.game_id, self.channel_name)

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
        body = json.loads(text_data)
        type = body.get('type')
        await self.channel_layer.group_send(self.game_id, {
            'type' : type,
            'data' : body.get('data')
        })

    async def move_paddle(self, event):
        data = event['data']
        key = data.get('key')
        player_id = data.get('player_id')
        instance =  Game.get(self.game_id)
        instance.update_player_move(player_id, key)
    
    async def init_game(self, event):
        await self.start_game()

    async def game_end(self, event):
        print("sending gameEnd to : " ,self.username)
        winner = 'You Win!'
        winner_id = event['winner']
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