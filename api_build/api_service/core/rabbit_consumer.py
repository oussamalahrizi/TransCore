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


class APIConsumer(AsyncRabbitMQConsumer):

    cache = _Cache

    async def on_message(self, message : IncomingMessage):
        try:
            data = message.body.decode()
            print(f"{self.queue_name} : received message : {data}")
            await message.ack()
        except json.JSONDecodeError:
            print(f"{self.queue_name} : invalid json data")
        except Exception as e:
            print(f"{self.queue_name} : Error processing the message : {e}")
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
            'match_found' : self.set_ingame
        }
        super().__init__(host, port, queue_name)

    async def send_notification(self, data : dict):
        group_name = f"notification_{data.get('user_id')}"
        layer = get_channel_layer()

        await layer.group_send(group_name, {
            'type' : 'send_notification',
            'message' : data.get('message')
        })
        
    async def disconnect_user(self, data : dict):
        group_name = f"notification_{data.get('user_id')}"
        layer = get_channel_layer()
        await layer.group_send(group_name, {
            'type' : 'disconnect_user',
            'code' : 4003,
            'message' : f"""You have been forcibly disconnected.
                {data.get('reason') if data.get('reason') else ""}."""
        })
    
    async def set_inqueue(self, data : dict):
        self.cache.set_user_queue(data.get('user_id'))
        group_name = f"notification_{data.get('user_id')}"
        layer = get_channel_layer()
        await layer.group_send(group_name, {
            'type' : "set_user_queue",
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
