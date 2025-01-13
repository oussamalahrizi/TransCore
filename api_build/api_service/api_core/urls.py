from django.urls import re_path
from . import Consumers

websocket_urlpatterns = [
	re_path(r'ws/', Consumers.TestConsumer.as_asgi()),
]