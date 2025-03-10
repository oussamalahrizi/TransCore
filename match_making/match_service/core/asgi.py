"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter
from .rabbitmq import APIPub, NotificationPub, RabbitmqBase, QueueConsumer
import asyncio
from matchmaking.utils import Cache


apipub = APIPub(host='rabbitmq', port=5672, queue_name="api")
notifspub = NotificationPub(host='rabbitmq', port=5672, queue_name="notifications")
queue_consumer = QueueConsumer(host='rabbitmq', port=5672, queue_name='match_queue')

publishers : list[RabbitmqBase] = [apipub, notifspub, queue_consumer]

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')


async def app(scope, receive, send):
    if scope['type'] == 'lifespan':
        tasks = []
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                print("started publisher")
                for pub in publishers:
                    tasks.append({
                        "publisher" : pub,
                        "task" : asyncio.create_task(pub.run())
                    })
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                if len(tasks):
                    for task in tasks:
                        await task["publisher"].stop()
                        task["task"].cancel()
                await send({'type': 'lifespan.shutdown.complete'})
                return

djang_app = get_asgi_application()


application = ProtocolTypeRouter({
    "http" : djang_app,
    "lifespan" : app
})