from django.urls import path
from . import views

urlpatterns = [
    path('messages/', views.get_messages, name='get_messages'),
]