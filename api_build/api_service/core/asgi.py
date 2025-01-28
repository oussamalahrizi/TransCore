"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from .rabbit_consumer import APIConsumer
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from .Middleware import jwtmiddleware
from api_core.urls_sockets import websocket_urlpatterns
import asyncio

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

rabbitmq_consumer = APIConsumer(host='rabbitmq', port=5672, queue_name='api')
rabbitmq_consumer = APIConsumer(host='rabbitmq', port=5672, queue_name='notifications')

async def app(scope, receive, send):
    if scope['type'] == 'lifespan':
        task = None
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                print("started consumer")
                task = asyncio.create_task(rabbitmq_consumer.run())
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                if task:
                    task.cancel()
                await rabbitmq_consumer.stop()
                await send({'type': 'lifespan.shutdown.complete'})
                return
            

django_asgi = get_asgi_application()

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