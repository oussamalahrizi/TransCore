from redis import asyncio as aioredis, Redis
import json
from channels.layers import get_channel_layer
class Cache:
    """
        for api interaction with other services
        only store user data along side with his presence status
    """


    def __init__(self):
        self.redis = Redis(host="api-redis", decode_responses=True, retry_on_timeout=True)

    def set_user_data(self, user_id: str, data, service : str):
        status = self.get_user_status(user_id)
        json_data = json.dumps({
            service : data,
            "status" : status
        })
        self.redis.set(user_id, json_data)
    
    def get_user_data(self, user_id: str):
        value = self.redis.get(user_id)
        if value:
            return json.loads(value)
        return None

    def remove_user_data(self, user_id: str):
        status = self.get_user_status()
        self.redis.delete(user_id)
        if status == "online":
            self.redis.set(user_id, json.dumps({status : status}))

    def set_user_online(self, user_id: str):
        user_data = self.get_user_data(user_id)
        if user_data:
            user_data["status"] = "online"
            self.redis.set(user_id, json.dumps(user_data))
    
    def set_user_game(self, user_id: str):
        user_data = self.get_user_data(user_id)
        if user_data:
            user_data["status"] = "ingame"
            self.redis.set(user_id, json.dumps(user_data))
    
    def set_user_queue(self, user_id: str):
        user_data = self.get_user_data(user_id)
        if user_data:
            user_data["status"] = "inqueue"
            self.redis.set(user_id, json.dumps(user_data))
    
    def set_user_offline(self, user_id: str):
        user_data : dict = self.get_user_data(user_id)
        if user_data:
            user_data["status"] = "offline"
            if user_data["auth"]:
                self.redis.set(user_id, json.dumps(user_data))
            else:
                self.redis.delete(user_id)

    def get_user_status(self, user_id: str):
        status = "offline"
        value = self.redis.get(user_id)
        if value:
            data = json.loads(value)
            status = data.get("status")
        return status

_Cache = Cache()
