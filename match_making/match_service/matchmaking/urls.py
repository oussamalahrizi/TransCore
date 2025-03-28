from django.urls import path

from .views import (FindMatchPong,
                    CheckGame,
                    CancelQueue,
                    AcceptMatchPong,
                    InviteGame,
                    AcceptInvite,
                    TournamentAPI,
                    FindMatchTic,
                    SingleMatch,
                    AcceptMatchTic
                    )

urlpatterns = [
    path("findmatch/pong/", FindMatchPong.as_view(), name="find-match-pong"), # check current user if on tournament or on going tournament
    path("findmatch/tic/", FindMatchTic.as_view(), name="find-match-tic"), # check current user if on tournament or on going tournament
    path("single/pong/", SingleMatch.as_view(), name="find-match-single"), # check current user if on tournament or on going tournament
    path("single/tic/", SingleMatch.as_view(), name="find-match-single"), # check current user if on tournament or on going tournament
    path("cancel_queue/", CancelQueue.as_view(), name="cancel-queue"),
    path("check_game/", CheckGame.as_view(), name='check-game'),
    path("accept/pong/", AcceptMatchPong.as_view(), name='accept-pong'),
    path("accept/tic/", AcceptMatchTic.as_view(), name='accept-tic'),
    path("invite/change/", AcceptInvite.as_view(), name='accept-invite-pong'), 
    path("invite/<str:id>/", InviteGame.as_view(), name='invite-pong'), # check current user and other if on tournament or on going tournament
    path("tournament/", TournamentAPI.as_view(), name='tournament-pong'),
]