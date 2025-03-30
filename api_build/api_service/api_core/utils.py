from redis import asyncio as aioredis, Redis
import json
from channels.layers import get_channel_layer

from pprint import pprint

class Cache:
    """
        for api interaction with other services
        only store user data along side with his presence status
    """

    """
        user id : {
            auth : {},
            status : online
            group_count : 1
        }
    """

    def __init__(self):
        self.redis = Redis(host="api-redis", decode_responses=True, retry_on_timeout=True)
    
    def get_user_data(self, user_id: str):
        value = self.redis.get(user_id)
        if value:
            return json.loads(value)
        return None

    def get_tournament_id(self, user_id : str):
        user_data = self.get_user_data(user_id)
        if not user_data or not user_data.get("tournament_id"):
            return None
        return user_data['tournament_id']

    def set_user_online(self, user_id: str):
        user_data = self.get_user_data(user_id)
        if user_data:
            if user_data["status"] == "offline":
                user_data["status"] = "online"
            if user_data.get("group_count"):
                user_data["group_count"] += 1
            else:
                user_data["group_count"] = 1
            self.redis.set(user_id, json.dumps(user_data))
    
    def set_user_status(self, user_id : str, status : str):
        user_data = self.get_user_data(user_id)
        if user_data:
            user_data["status"] = status
            self.redis.set(user_id, json.dumps(user_data))
            
    
    def set_user_offline(self, user_id: str):
        user_data : dict = self.get_user_data(user_id)
        if user_data:
            group_count = user_data.get("group_count")
            if group_count:
                user_data["group_count"] -= 1
                if user_data["group_count"] <= 0:
                    user_data["status"] = "offline"
                    self.redis.delete(user_id)
                else:
                    self.redis.set(user_id, json.dumps(user_data))

    def get_user_status(self, user_id: str):
        status = "offline"
        value = self.redis.get(user_id)
        if value:
            data = json.loads(value)
            status = data.get("status")
        return status

    def get_group_count(self, user_id : str):
        data : dict = self.get_user_data(user_id)
        if data:
            return data.get("group_count")
        return 0

_Cache = Cache()
