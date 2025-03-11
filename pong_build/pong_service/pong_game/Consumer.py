from channels.generic.websocket import AsyncWebsocketConsumer
import json, asyncio

from .utils import Game_Cache


"""
    /ws/game/pong/game_id=123&token=123
"""

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
        self.game_id = self.scope['game_id']
        self.channel_layer.group_add(self.game_id, self.channel_name)
        # check if both users connected to init fresh game state
        self.cache.set_player(game_id=self.game_id, user_id=self.user['id'])
        player_count = await self.cache.get_player_count(self.game_id)
        if player_count == 2:
            self.start_game()
            return
        await self.send(text_data="Waiting for other player to join")

        
    # called when user disonnects
    async def disconnect(self, code):
        await self.stop_game()

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
        pass

    async def move_paddle(self, event : dict):
        # do some calculations update game state
        pass

    async def broadcast(self):
        try:
            while True:
                await self.send(f"game state : {self.game_state}")
                self.game_state["count"] += 1
                await asyncio.sleep(0.05)
        except asyncio.CancelledError :
            pass

    async def start_game(self):
        self.game_state = {
            'count' : 0
        }
        self.game_task = asyncio.create_task(self.broadcast())

    async def stop_game(self):
        if not hasattr(self, 'game_task'):
            return
        self.game_task.cancel()
        self.channel_layer.group_discard(self.game_id, self.channel_name)
