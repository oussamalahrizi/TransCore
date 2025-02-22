from aio_pika import connect, Message
import asyncio
import json

class RabbitmqBase:
    connection = None
    channel = None
    queue = None
    closing = False

    async def __init__(self, host, port, queue_name):
        while not self.closing:
            try:
                self.connection = await connect(
                    host=host,
                    port=port,
                    loop=asyncio.get_event_loop()
                )
                self.connection.close_callbacks.add(self.reconnect)
                self.channel = await self.connection.channel()
                await self.channel.set_qos(prefetch_count=1)
                self.queue = await self.channel.declare_queue(queue_name, durable=True)
                print("Connection established.")
                self.closing = False
            except Exception as e:
                print(f"Connection error : {e}")
                await asyncio.sleep(2)
    

    async def reconnect(self):
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

class APIPub(RabbitmqBase):
    
    def publish(self, data : dict):
        message = Message(
            json.dumps(data).encode(),
            delivery_mode=1,
            content_type="application/json")
        self.channel.default_exchange.publish(message=message, routing_key=self.queue.name)
        print("api publisher : pusblished!")

class NotificationPub(RabbitmqBase):
    
    async def publish(self, data : dict):
        message = Message(
            json.dumps(data).encode(),
            delivery_mode=1,
            content_type="application/json")
        await self.channel.default_exchange.publish(message=message, routing_key=self.queue.name)
        print("notification publisher : pusblished!")