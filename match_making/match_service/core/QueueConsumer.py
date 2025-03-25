"""
    Consumer to listen on so we remove the player from the queue if disconnected
"""

from aio_pika import connect, Connection, IncomingMessage
import asyncio
import json

from .publishers import notifspub

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


from matchmaking.utils import Queue

from pprint import pprint

from asgiref.sync import async_to_sync

class QueueConsumer(AsyncRabbitMQConsumer):

    actions = {}
    cache = Queue

    def __init__(self, host, port, queue_name):
        self.actions = {
            'remove_pqueue' : self.remove_pqueue,
            'game_over' : self.game_over
        }
        super().__init__(host, port, queue_name)

    async def remove_pqueue(self, data : dict):
        user_id = data.get('user_id')
        self.cache.remove_player(user_id)
    
    async def game_over(self, data : dict):
        print("received game over :")
        pprint(data)
        match_type = data.get("match_type")
        game_type = data.get("game_type")
        game_id =  data.get("game_id")
        if match_type == "tournament":
            print("HANDLE TOURNAMENT RESULTS")
        # send status update to both players
        game_data = self.cache.get_game_info(game_id, game_type)
        players = game_data.get("players")
        for p in players:
            body = {
                'type' : "update_status",
                'data' : {
                    "user_id" : p,
                    "status" : "online"
                }
            }
            await notifspub.publish(body)
        ## proceed to delete
        res = self.cache.redis.delete(f"{game_type}:{game_id}")
        print("deleted ?", res)

    async def on_message(self, message):
        try:
            body : dict = json.loads(message.body.decode())
            print(f"{self.queue_name} : received message : {body}")
            type = body.get('type')
            if type not in self.actions:
                print("type is not in actions")
                await message.reject()
                return
            await self.actions[type](body.get("data"))
            await message.ack()
        except json.JSONDecodeError:
            print(f"{self.queue_name} : invalid json data")
        except Exception as e:
            print(f"{self.queue_name} : Error processing the message : {e}")
            await message.reject()
