from redis import Redis
import json


class Cache:
    def __init__(self):
        self.redis = Redis("xo-redis", decode_responses=True, retry_on_timeout=True)

    def set(self, key, data):
        self.redis.set(key, json.dumps(data))
    
    def get(self, key):
        data = self.redis.get(key)
        if not data:
            return None 
        return json.loads(data)
    # def set_player(self, user_id: str, game_id: str):
    #     game_data: list = self.redis.get(game_id)
    #     if not game_data:
    #         self.redis.set(game_id, json.dumps([user_id]))
    #         return True
    #     game_data = json.loads(game_data)
    #     if user_id in game_data:
    #         return False
    #     game_data.append(user_id)
    #     self.redis.set(game_id, json.dumps(game_data))
    #     return True

    # def get_player_count(self, game_id : str):
    #     game_data = self.redis.get(game_id)
    #     if not game_data:
    #         return 0
    #     return len(json.loads(game_data))
    
    # def get_players(self, game_id):
    #     game_data = self.redis.get(game_id)
    #     if not game_data:
    #         return []
    #     return json.loads(game_data)
    
    def delete(self, key):
        if self.redis.exists(key):
            self.redis.delete(key)

Game_Cache = Cache()

"""

"""