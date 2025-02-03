from django.urls import re_path
from . import Consumers

websocket_urlpatterns = [
	re_path(r'api/main/ws/', Consumers.TestConsumer.as_asgi()),
]