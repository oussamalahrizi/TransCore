from django.urls import path

from xo_game import localConsumers, roomConsumers, remoteConsumers


websocket_urlpatterns = [
    path("api/game/tictac/ws/local", localConsumers.Consumer.as_asgi()), # ignore it in middleware
    path("api/game/tictac/ws/game", remoteConsumers.Consumer.as_asgi()),
    path("api/game/tictac/ws/room/<str:room_id>", roomConsumers.Consumer.as_asgi()),
]
