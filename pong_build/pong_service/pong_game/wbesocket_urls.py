from django.urls import path

from rest_framework.views import APIView
from rest_framework.response import Response
from .Consumer import Consumer
from .Singleconsumer import SingleConsumer


websocket_patterns = [
    path('api/game/pong/ws/', Consumer.as_asgi()),
    path('api/game/pong-single/ws/', SingleConsumer.as_asgi())
]
