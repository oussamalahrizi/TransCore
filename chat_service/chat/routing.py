from django.urls import re_path, path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    # re_path(r"^api/chat/ws/chat/(?P<username>[^/]+)/$", ChatConsumer.as_asgi())
    path("api/chat/ws/chat/<str:username>/", ChatConsumer.as_asgi())
    # re_path(r'api/chat/ws/notifications/$', NotificationConsumer.as_asgi()),
]

