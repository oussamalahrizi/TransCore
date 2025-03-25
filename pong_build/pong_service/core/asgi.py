"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django_app = get_asgi_application()

import asyncio
from .publisher import QueuePublisher, RabbitmqBase


from pong_game.wbesocket_urls import websocket_patterns
from pong_game.Middleware import jwtMiddleware

from .publisher import publishers

async def app(scope, receive, send):
    if scope['type'] == 'lifespan':
        tasks = []
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                for pub in publishers:
                    tasks.append({
                        "publisher" : pub,
                        'task' : asyncio.create_task(pub.run())
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
    'http' : django_app,
    'websocket' : jwtMiddleware(
        URLRouter(
            websocket_patterns
        )
    ),
    'lifespan' : app
})


