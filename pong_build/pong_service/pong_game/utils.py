from redis import Redis
import json
import asyncio
from .game import GameState

game_task : dict[str, asyncio.Task] = {}

Game : dict[str, GameState] = {}

class Cache:
    def __init__(self):
        self.redis = Redis("game-redis", decode_responses=True, retry_on_timeout=True)

    def set_player(self, user_id: str, game_id: str):
        game_data: list = self.redis.get(game_id)
        if not game_data:
            self.redis.set(game_id, json.dumps([user_id]))
            return True
        game_data = json.loads(game_data)
        if user_id in game_data:
            return False
        game_data.append(user_id)
        self.redis.set(game_id, json.dumps(game_data))
        return True

    def get_player_count(self, game_id : str):
        game_data = self.redis.get(game_id)
        if not game_data:
            return 0
        return len(json.loads(game_data))
    
    def get_players(self, game_id):
        game_data = self.redis.get(game_id)
        if not game_data:
            return []
        return json.loads(game_data)
    
    def remove_player(self, user_id, game_id):
        game_data = self.redis.get(game_id)
        if not game_data:
            return
        game_data : list = json.loads(game_data)
        if user_id in game_data:
            game_data.remove(user_id)
        if len(game_data) == 0:
            self.redis.delete(game_id)
            return
        self.redis.set(game_id, json.dumps(game_data))

Game_Cache = Cache()

"""

"""