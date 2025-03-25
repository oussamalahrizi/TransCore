from django.urls import path

from xo_game import localConsumers, roomConsumers


websocket_urlpatterns = [
    path("api/game/tictac/ws/local", localConsumers.Consumer.as_asgi()),
    path("api/game/tictac/ws/remote", roomConsumers.Consumer.as_asgi()),
]
