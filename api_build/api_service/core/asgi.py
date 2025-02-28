"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from .rabbit_consumer import APIConsumer, NotifConsumer, AsyncRabbitMQConsumer
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from .Middleware import jwtmiddleware
import asyncio

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

api_consumer = APIConsumer(host='rabbitmq', port=5672, queue_name='api')
notifs_consumer = NotifConsumer(host='rabbitmq', port=5672, queue_name='notifications')

consumers : list[AsyncRabbitMQConsumer] = [api_consumer, notifs_consumer]

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


"""
    chat websockets, 
    chat db,
    message broker publisher intergated with asgi event loop
    middleware jwt
    fetch user data from api-service only (optimized)
    any other data can be requested directly from auth if necessary
    
"""