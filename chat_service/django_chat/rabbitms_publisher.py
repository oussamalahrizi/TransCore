from aio_pika import connect, Message, Connection
import asyncio
import json
import logging

logger = logging.getLogger(__name__)

class RabbitmqBase:

    def __init__(self, host, port, queue_name):
        self.connection: Connection = None
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
                logger.info(f"Connection established with queue: {self.queue_name}.")
                self.closing = False
                break
            except Exception as e:
                logger.error(f"Connection error: {e}")
                await asyncio.sleep(2)

    async def reconnect(self, *args, **kwargs):
        if not self.closing:
            logger.info("Reconnecting...")
            await self.connect()
            logger.info("Reconnection complete.")

    async def run(self):
        await self.connect()

    async def publish(self, data: dict):
        raise NotImplementedError()

    async def stop(self):
        if not self.closing:
            self.closing = True
            logger.info("Stopping...")
            if self.connection and not self.connection.is_closed:
                await self.channel.close()
                await self.connection.close()
            logger.info("Stopped.")

class APIPub(RabbitmqBase):

    async def publish(self, data: dict):
        message = Message(
            json.dumps(data).encode(),
            delivery_mode=1,
            content_type="application/json")
        await self.channel.default_exchange.publish(message=message, routing_key=self.queue.name)
        logger.info("API publisher: Published!")

class NotificationPub(RabbitmqBase):

    async def publish(self, data: dict):
        message = Message(
            json.dumps(data).encode(),
            delivery_mode=1,
            content_type="application/json")
        await self.channel.default_exchange.publish(message=message, routing_key=self.queue.name)
        logger.info("Notification publisher: Published!")
