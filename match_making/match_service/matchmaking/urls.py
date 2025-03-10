from django.urls import path

from .views import FindMatchPong, CheckGame

urlpatterns = [
    path("findmatch/pong/", FindMatchPong.as_view(), name="find-match-pong"),
    path("check_game/", CheckGame.as_view(), name='check-game')
]