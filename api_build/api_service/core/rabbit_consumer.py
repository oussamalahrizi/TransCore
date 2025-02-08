import asyncio
import aiormq
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
        self.tries = 0
        
    async def connect(self):
        while not self._closing:
            try:
                print("Attempting to connect to RabbitMQ...")
                self._connection = await connect(
                    host=self.host,
                    port=self.port,
                    loop=asyncio.get_event_loop(),
                )
                self._connection.close_callbacks.add(self.reconnect)
                self._channel = await self._connection.channel()
                await self._channel.set_qos(prefetch_count=1)
                print("Connection established.")
                self._closing = False
                await self.start_consuming()
                break
            except Exception as e:
                print(f"Connection error : {e}")
                await asyncio.sleep(2)

    async def reconnect(self, param1, param2):
        if not self._closing:
            print("reconnecting...")
            await self.connect()
            print("Done")

    async def start_consuming(self):
        try:
            queue = await self._channel.declare_queue(self.queue_name)
            await queue.consume(self.on_message)
            print("Started consuming")
        except Exception as e:
            print(f"Error while starting consuming: {e}")

    async def on_message(self, message: IncomingMessage):
            raise NotImplementedError()

    async def run(self):
        await self.connect()

    async def stop(self):
        if not self._closing:
            self._closing = True
            print("Stopping")
            if self._connection and not self._connection.is_closed:
                await self._channel.close()
                await self._connection.close()
            print("Stopped")


class APIConsumer(AsyncRabbitMQConsumer):

    cache = _Cache

    async def on_message(self, message : IncomingMessage):
        try:
            data = message.body.decode()
            print(f"received message : {data}")
            user = json.loads(message.body)
            self.cache.remove_user_data(user_id=user["id"])
            await message.ack()
            print(f"deleted cached data for user : {user["username"]}")
        except json.JSONDecodeError:
            print("invalid json data")
            await message.reject()
        except Exception as e:
            print(f"Error processing the message : {e}")