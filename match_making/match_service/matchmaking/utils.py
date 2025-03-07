from redis import Redis

"""

    uuid : in_queue | in game 
"""


class Cache:

    pong_queue = "pong"
    tic_queue = "tic"
    def __init__(self):
        self.redis = Redis(host="queue_redis", decode_responses=True, retry_on_timeout=True)

    def store_player(self, user_id : str, game : str):
        """
            check player already in queue or in game
        """
        type = self.pong_queue if game == "pong" else self.tic_queue
        self.redis.set(f"{type}{user_id}", "in_queue")

    def check_player(self, user_id : str, game : str):
        type = self.pong_queue if game == "pong" else self.tic_queue
        return self.redis.get(f"{type}{user_id}")
    
    def set_player_ingame(self, user_id : str, game : str):
        type = self.pong_queue if game == "pong" else self.tic_queue
        self.redis.set(f"{type}{user_id}", "in_game")
    


Queue = Cache()
    