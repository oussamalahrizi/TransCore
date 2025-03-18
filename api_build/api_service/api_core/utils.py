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

    def set_user_data(self, user_id: str, data, service : str):
        status = self.get_user_status(user_id)
        group_count = self.get_group_count(user_id)
        if not group_count:
            group_count = 0
        json_data = json.dumps({
            service : data,
            "status" : status,
            "group_count" : group_count
        })
        self.redis.set(user_id, json_data)
    
    def get_user_data(self, user_id: str):
        value = self.redis.get(user_id)
        if value:
            return json.loads(value)
        return None

    def remove_user_data(self, user_id: str):
        status = self.get_user_status(user_id)
        count = self.get_group_count(user_id)
        self.redis.delete(user_id)
        if status == "online":
            self.redis.set(user_id, json.dumps({'status' : status, 'group_count' : count}))

    def set_user_online(self, user_id: str):
        user_data = self.get_user_data(user_id)
        if user_data:
            print('set user online : ', user_data)
            user_data["status"] = "online"
            if user_data.get("group_count"):
                user_data["group_count"] += 1
            else:
                user_data["group_count"] = 1
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
            user_data["group_count"] -= 1
            if user_data["group_count"] <= 0 and user_data["status"] == 'online':
                user_data["status"] = "offline"
                user_data.pop('group_count')
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

    def get_group_count(self, user_id : str):
        data : dict = self.get_user_data(user_id)
        if data:
            return data.get("group_count")
        return 0

    """
        {
            auth:{
                id : 123,
                username : oussama,
                email : oussama@email.com,
                friends : [
                    'uuid1', 'uuid2', 'uuid3', 'uuid4'
                ]
            },
            status : online,
            group_count : 1
        }
        {
            auth:{
                id : uuid2,
                username : user2,
                email : user2@email.com,
                friends : [
                    '123', 'uuid2', 'uuid3', 'uuid4'
                ]
            },
            status : online,
            group_count : 1
        }

    """

    def append_user_friends(self, user_id : str, friend_id : str):
        user_data = self.get_user_data(user_id)
        auth_data = user_data.get('auth')
        if not auth_data.get('friends'):
            auth_data['friends'] = [friend_id]
        else:
            auth_data['friends'].append(friend_id)
        user_data["auth"] = auth_data
        self.redis.set(user_id, json.dumps(user_data))
        

_Cache = Cache()
