import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
import asyncio
from .rabbitms_publisher import NotificationPub, RabbitmqBase

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_chat.settings')

notifspub = NotificationPub(host="rabbitmq", port=5672, queue_name="notifications")

publishers: list[RabbitmqBase] = [notifspub]

async def lifespan(scope, receive, send):
    if scope['type'] == 'lifespan':
        tasks = []
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                print("Starting publishers...")
                for pub in publishers:
                    tasks.append({
                        "publisher": pub,
                        "task": asyncio.create_task(pub.run())
                    })
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                if tasks:
                    for task in tasks:
                        await task["publisher"].stop()
                        task["task"].cancel()
                await send({'type': 'lifespan.shutdown.complete'})
                return

app = get_asgi_application()

from chat.routing import websocket_urlpatterns
from chat.middleware import JWTMiddleware

application = ProtocolTypeRouter({
    "http": app,
    "websocket": JWTMiddleware(
        URLRouter(
            websocket_urlpatterns
        ),
        notifspub=notifspub  
    ),
    'lifespan': lifespan
})