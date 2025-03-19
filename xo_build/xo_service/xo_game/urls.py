from django.urls import path
from .views import create_room, check_room

urlpatterns = [
    path("create_room", create_room, name="create_room"),
    path("check_room/<str:room_id>", check_room, name="check_room"),
]
