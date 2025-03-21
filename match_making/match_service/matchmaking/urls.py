from django.urls import path

from .views import FindMatchPong, CheckGame, CancelQueue

urlpatterns = [
    path("findmatch/pong/", FindMatchPong.as_view(), name="find-match-pong"),
    path("cancel_queue/", CancelQueue.as_view(), name="cancel-queue"),
    path("check_game/", CheckGame.as_view(), name='check-game')
]