"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter
import asyncio

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

djang_app = get_asgi_application()

from .publishers import publishers
from .QueueConsumer import QueueConsumer

# Create QueueConsumer instance here to break circular import
queue_consumer = QueueConsumer(host='rabbitmq', port=5672, queue_name='match_queue')

# Add queue_consumer to the publishers list
all_publishers = publishers + [queue_consumer]

async def app(scope, receive, send):
    if scope['type'] == 'lifespan':
        tasks = []
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                print("started publisher")
                for pub in all_publishers:
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


application = ProtocolTypeRouter({
    "http" : djang_app,
    "lifespan" : app
})