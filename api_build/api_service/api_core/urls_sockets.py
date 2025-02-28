from django.urls import re_path
from .Consumers import OnlineConsumer

websocket_urlpatterns = [
	re_path(r'api/main/ws/', OnlineConsumer.as_asgi()),
]