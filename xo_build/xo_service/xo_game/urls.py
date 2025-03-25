from django.urls import path, include
from xo_game import views


# class TstView(View):
#     def get(self, request):
#         return JsonResponse({"message": "TstView is working!"})
    

urlpatterns = [
    path('matches/', views.get_matches, name='get_matches'),  # Retrieve all matches
    path('players/', views.get_players, name='get_players'),  # Retrieve all players
    path('players/<str:player_id>/', views.get_player, name='get_player'),  # Retrieve a specific player by ID
    path('matches/<int:match_id>/', views.get_match, name='get_match'),  # Retrieve a specific match by ID
]
