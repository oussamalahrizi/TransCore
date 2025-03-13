from django.urls import path

from .views import GetUserData, GetNotification, GetUserService, GetFriends

urlpatterns = [
    path("user/me/", GetUserData.as_view(), name='user-data'),
    path("user/notifications/", GetNotification.as_view(), name='user-data'),
    path("user/<str:id>/", GetUserService.as_view(), name='user-data-service'),
    path("friends/", GetFriends.as_view(), name='user-friends')
]