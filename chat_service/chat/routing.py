from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"^api/chat/ws/chat/(?P<username>[^/]+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r'api/chat/ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]