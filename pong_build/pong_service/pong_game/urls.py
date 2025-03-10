from .Consumer import Consumer
from django.urls import path


websocket_patterns = [
    path('ws/pong/', Consumer.as_asgi())
]