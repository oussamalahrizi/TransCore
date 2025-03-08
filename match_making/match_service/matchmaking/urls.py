from django.urls import path

from .views import FindMatchPong

urlpatterns = [
    path("findmatch/pong/", FindMatchPong.as_view(), name="find-match-pong")
]