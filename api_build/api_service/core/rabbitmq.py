import asyncio
from aio_pika import connect, IncomingMessage, Connection
from api_core.utils import _Cache
import json

class AsyncRabbitMQConsumer:
    def __init__(self, host, port, queue_name):
        self.host = host
        self.port = port
        self.queue_name = queue_name
        self._connection : Connection = None
        self._channel = None
        self._closing = False
        
    async def connect(self):
        while not self._closing:
            try:
                self._connection = await connect(
                    host=self.host,
                    port=self.port,
                    loop=asyncio.get_event_loop(),
                )
                self._connection.close_callbacks.add(self.reconnect)
                self._channel = await self._connection.channel()
                await self._channel.set_qos(prefetch_count=1)
                print(f"{self.queue_name} : Connection established ")
                self._closing = False
                await self.start_consuming()
                break
            except Exception as e:
                print(f"{self.queue_name} : Connection error in queue :  {e}")
                await asyncio.sleep(2)

    async def reconnect(self, param1, param2):
        if not self._closing:
            print(f"{self.queue_name} : reconnecting...")
            await self.connect()

    async def start_consuming(self):
        try:
            queue = await self._channel.declare_queue(self.queue_name, durable=True)
            await queue.consume(self.on_message)
            print(f"{self.queue_name} : Started consuming")
        except Exception as e:
            print(f"{self.queue_name} : Error while starting consuming : {e}")

    async def on_message(self, message: IncomingMessage):
            raise NotImplementedError

    async def run(self):
        await self.connect()

    async def stop(self):
        if not self._closing:
            self._closing = True
            print(f"Stopping consumer : {self.queue_name}")
            if self._connection and not self._connection.is_closed:
                await self._channel.close()
                await self._connection.close()
            print(f"Stopped {self.queue_name}")


from pprint import pprint

class APIConsumer(AsyncRabbitMQConsumer):

    cache = _Cache

    def __init__(self, host, port, queue_name):
        self.actions = {
            "clear_cache" : self.clear_cache,
            "refresh_friends" : self.refresh_friends
        }
        super().__init__(host, port, queue_name)

    async def refresh_friends(self, data : dict):
        user_id = data.get("user_id")
        # get user data to delete his friends attrs
        user_data : dict = self.cache.get_user_data(user_id)
        print("refresh user data")
        pprint(user_data)
        auth_data = user_data.get("auth")
        if auth_data.get("friends"):
            print("AAAAAAAAAAAA", auth_data["username"], "ba7")
            auth_data.pop("friends")
        if auth_data.get("blocked"):
            auth_data.pop("blocked")
        user_data["auth"] = auth_data
        self.cache.redis.set(user_id, json.dumps(user_data))
        layer = get_channel_layer()
        group_name = f"notification_{user_id}"
        await layer.group_send(group_name, {
            "type" : "refresh_friends"
        })

    async def clear_cache(self, data : dict):
        user_id = data.get('user_id')
        old_status = self.cache.get_user_status(user_id)
        old_group_count = self.cache.get_group_count(user_id)
        self.cache.remove_user_data(user_id)
        new_data = {
            'status' : old_status,
            'group_count' : old_group_count
        }
        self.cache.redis.set(user_id, json.dumps(new_data))
        layer = get_channel_layer()
        group_name = f"notification_{user_id}"
        await layer.group_send(group_name, {
            'type' : "update_info"
        })

    async def on_message(self, message : IncomingMessage):
        try:
            body = json.loads(message.body.decode())
            print("received message :")
            pprint(body)
            type = body.get("type")
            if type not in self.actions:
                await message.ack()
                return
            await self.actions[type](body.get('data'))
            await message.ack()
        except json.JSONDecodeError:
            print("invalid json data")
            await message.reject()
        except Exception as e:
            print(f"Error processing the message : {e}")
            await message.reject()


from channels.layers import get_channel_layer

class NotifConsumer(AsyncRabbitMQConsumer):

    cache = _Cache
    actions = {}

    def __init__(self, host, port, queue_name):
        self.actions = {
            "send_notification" : self.send_notification,
            'disconnect_user' : self.disconnect_user,
            'set_inqueue' : self.set_inqueue,
            'match_found' : self.set_ingame,
            'cancel_queue' : self.cancel_queue
        }
        super().__init__(host, port, queue_name)

    async def send_notification(self, data : dict):
        group_name = f"notification_{data.get('user_id')}"
        layer = get_channel_layer()
        body = {
            'type' : 'send_notification',
            'message' : data.get('message')
        }
        if data.get("color"):
            body["color"] = data["color"]
        await layer.group_send(group_name, body)
        
    async def disconnect_user(self, data : dict):
        group_name = f"notification_{data.get('user_id')}"
        layer = get_channel_layer()
        await layer.group_send(group_name, {
            'type' : 'disconnect_user',
            'code' : 4242,
            'message' : f"""You have been forcibly disconnected.
                {data.get('reason') if data.get('reason') else ""}."""
        })
    
    async def set_inqueue(self, data : dict):
        self.cache.set_user_queue(data.get('user_id'))
        group_name = f"notification_{data.get('user_id')}"
        layer = get_channel_layer()
        await layer.group_send(group_name, {
            'type' : "status_update",
            'status' : 'inqueue'
        })
    
    async def set_ingame(self, data : dict):
        self.cache.set_user_game(data.get('user1'))
        self.cache.set_user_game(data.get('user2'))
        groups = [f"notification_{data.get('user1')}", f"notification_{data.get('user2')}"]
        layer = get_channel_layer()
        for group in groups:
            await layer.group_send(group, {
                'type' : "set_user_game",
                'game_id' : data.get("game_id")
            })
    
    async def cancel_queue(self, data : dict):
        user_id = data.get("user_id")
        user_data =  self.cache.get_user_data(user_id)
        user_data["status"] = "online"
        self.cache.redis.set(user_id, json.dumps(user_data))
        print(f"user : {user_id} back online")
        layer = get_channel_layer()
        group = f"notification_{user_id}"
        await layer.group_send(group, {
            'type' : "status_update",
            "status" : 'online'
        })

    async def on_message(self, message : IncomingMessage):
        try:
            body : dict = json.loads(message.body.decode())
            print(f"{self.queue_name} : received message : {body}")
            type = body.get("type")
            if type not in self.actions:
                print("type is not in avalaible actions")
                await message.reject()
                return
            print("body in notification", body)
            await self.actions[type](body.get('data'))
            await message.ack()
        except json.JSONDecodeError:
            print(f"{self.queue_name} : invalid json data")
            await message.reject()
        except Exception as e:
            print(f"{self.queue_name} : Error processing the message : {e}")
            await message.reject()


class RabbitmqBase:

    def __init__(self, host, port, queue_name):
        self.connection : Connection = None
        self.channel = None
        self.queue = None
        self.closing = False
        self.host = host
        self.port = port
        self.queue_name = queue_name
            
    async def connect(self):
        while not self.closing:
            try:
                self.connection = await connect(
                    host=self.host,
                    port=self.port,
                    loop=asyncio.get_event_loop()
                )
                self.connection.close_callbacks.add(self.reconnect)
                self.channel = await self.connection.channel()
                await self.channel.set_qos(prefetch_count=1)
                self.queue = await self.channel.declare_queue(self.queue_name, durable=True)
                print(f"Connection established with queue : {self.queue_name}.")
                self.closing = False
                break
            except Exception as e:
                print(f"Connection error : {e}")
                await asyncio.sleep(2)
    
    async def reconnect(self, *args, **kwargs):
        if not self.closing:
            print("reconnecting...")
            await self.connect()
            print("Done")

    async def run(self):
        await self.connect()
    
    async def publish(self, data : dict):
        raise NotImplementedError()

    async def stop(self):
        if not self.closing:
            self.closing = True
            print("Stopping")
            if self.connection and not self.connection.is_closed:
                await self.channel.close()
                await self.connection.close()
            print("Stopped")

from aio_pika import Message

class QueuePublisher(RabbitmqBase):
    
    async def publish(self, data : dict):
        try:
            message = Message(
                json.dumps(data).encode(),
                delivery_mode=1,
                content_type="application/json")
            await self.channel.default_exchange.publish(message=message, routing_key=self.queue.name)
            print("queue publisher : pusblished!")
        except BaseException as e:
            print(f"error publishing to queue : {e}")