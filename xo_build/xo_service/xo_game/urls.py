from django.urls import path, include
from xo_game import views


# class TstView(View):
#     def get(self, request):
#         return JsonResponse({"message": "TstView is working!"})
    

urlpatterns = [
    path('players/', views.GetData.as_view(), name='get-player'),  # Retrieve all players
    path('players/<str:player_id>/', views.GetDataID.as_view(), name='get-player-id'),  # Retrieve a specific player by ID
    path('matches/', views.GetMatchHistory.as_view(), name='get-matches'),  # Retrieve a specific player by ID
    path('matches/<str:player_id>/', views.GetMatchHistory.as_view(), name='get-matches-id'),  # Retrieve a specific player by ID
]
