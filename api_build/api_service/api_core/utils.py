from redis import Redis
import json

class Cache:
    """
        for api interaction with other services
        only store user data along side with his presence status
    """


    def __init__(self):
        self.redis = Redis(host="api-redis", port=6380, decode_responses=True, db=0)
    

    def set_user_data(self, user_id: str, data):
        status = self.get_user_status(user_id)
        data["status"] = status
        json_data = json.dumps(data)
        self.redis.set(user_id, json_data)
    
    def get_user_data(self, user_id: str):
        value = self.redis.get(user_id)
        if value:
            return json.loads(value)
        return None

    
    def remove_user_data(self, user_id: str):
        self.redis.delete(user_id)

    def set_user_online(self, user_id: str):
        user_data = self.get_user_data(user_id)
        if user_data:
            user_data["status"] = "online"
            self.redis.set(user_id, json.dumps(user_data))
    
    def set_user_offline(self, user_id: str):
        user_data = self.get_user_data(user_id)
        if user_data:
            user_data["status"] = "offline"
            self.redis.set(user_id, json.dumps(user_data))

    def get_user_status(self, user_id: str):
        value = self.redis.get(user_id)
        status = "offline"
        if value:
            data = json.loads(value)
            status = data.get("status")
        return status

    

_Cache = Cache()
