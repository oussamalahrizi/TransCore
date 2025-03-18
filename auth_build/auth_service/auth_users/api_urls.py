

from django.urls import path

from .api_views import (
    GetFriendsAPI,
    GetUserServiceID,
    GetUserServiceName
)
api_urlpatterns = [
    path("internal/friends/<str:id>/", GetFriendsAPI.as_view(), name="api-get-friends"),
    path('internal/userid/<str:id>/', GetUserServiceID.as_view(), name='api-user-id'),
    path('internal/username/<str:username>/', GetUserServiceName.as_view(), name='api-user-name'),
]   