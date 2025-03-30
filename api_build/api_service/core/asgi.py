"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from .rabbitmq import NotifConsumer, AsyncRabbitMQConsumer, QueuePublisher
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from .Middleware import jwtmiddleware
import asyncio

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

notifs_consumer = NotifConsumer(host='rabbitmq', port=5672, queue_name='notifications')
queue_publisher = QueuePublisher(host='rabbitmq', port=5672, queue_name='match_queue')

consumers : list[AsyncRabbitMQConsumer] = [notifs_consumer, queue_publisher]

async def app(scope, receive, send):
    if scope['type'] == 'lifespan':
        tasks = []
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                for con in consumers:
                    tasks.append({
                        "consumer" : con,
                        'task' : asyncio.create_task(con.run())
                        })
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                if len(tasks):
                    for task in tasks:
                        await task["consumer"].stop()
                        task["task"].cancel()
                await send({'type': 'lifespan.shutdown.complete'})
                return


django_asgi = get_asgi_application()

from api_core.urls_sockets import websocket_urlpatterns


application = ProtocolTypeRouter({
    "http": django_asgi,
    "websocket": jwtmiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
    "lifespan": app,
})
