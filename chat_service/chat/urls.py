from django.urls import path
from . import views

urlpatterns = [
    path('<str:roomname>/', views.ChatRoomMessages.as_view(), name='chat_room_messages'),
]