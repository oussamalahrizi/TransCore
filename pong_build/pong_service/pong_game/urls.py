from django.urls import path, include
# from rest_framework.routers import DefaultRouter
from . import views

# router = DefaultRouter()
# router.register(r'players', views.PlayerViewSet)
# router.register(r'matches', views.MatchViewSet)
# router.register(r'singleplayer-matches', views.MatchSingleViewSet)

urlpatterns = [
    # path('matches/', views.get_matches, name='get_matches'),  # Retrieve all matches
    path('players/', views.GetData.as_view(), name='get-player'),
    path('players/<str:player_id>/', views.GetDataID.as_view(), name='get-player-id'),  # Retrieve a specific player by ID
    path('matches/', views.GetMatchHistory.as_view(), name='get-matches'),  # Retrieve a specific player by ID
    path('matches/<str:player_id>/', views.GetMatchHistory.as_view(), name='get-matches-id'),  # Retrieve a specific player by ID
    path('leaderboard/', views.LeaderBoard.as_view(), name='leaders')
    # path('api/', include(router.urls)),
    # path('api/leaderboard/', views.leaderboard, name='leaderboard'),
    # path('api/player-stats/', views.player_stats, name='player-stats'),
    # path('api/player-stats/<str:player_id>/', views.player_stats, name='player-stats-detail'),
    # path('api/match-history/', views.match_history, name='match-history'),
    # path('api/match-history/<str:player_id>/', views.match_history, name='match-history-detail'),
    # path('api/save-match/', views.save_match_result, name='save-match'),
]