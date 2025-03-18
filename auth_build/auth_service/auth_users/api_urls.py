

from django.urls import path

from .api_views import (
    GetFriendsAPI,
    GetUserServiceID,
    GetUserServiceName,
    GetRelation
)
api_urlpatterns = [
    path('internal/friends/relation/', GetRelation.as_view(), name='api-friends-relation'),
    path("internal/friends/<str:id>/", GetFriendsAPI.as_view(), name="api-get-friends"),
    path('internal/userid/<str:id>/', GetUserServiceID.as_view(), name='api-user-id'),
    path('internal/username/<str:username>/', GetUserServiceName.as_view(), name='api-user-name'),
]   