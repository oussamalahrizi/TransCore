from redis import Redis
import json

class Cache:
    def __init__(self):
        self.redis = Redis("game-redis", decode_responses=True, retry_on_timeout=True)

    def set_player(self, user_id: str, game_id: str):
        game_data: list = json.loads(self.redis.get(game_id))
        if not game_data:
            self.redis.set(game_id, json.dumps([user_id]))
            return
        game_data.append(user_id)
        self.redis.set(game_id, json.dumps(game_data))

    def get_player_count(self, game_id : str):
        game_data = self.redis.get(game_id)
        if not game_data:
            return 0
        return len(json.loads(game_data))
    


Game_Cache = Cache()

"""

"""