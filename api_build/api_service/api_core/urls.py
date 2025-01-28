from django.urls import path

from .views import GetUserData, Debug

urlpatterns = [
    path("user/", GetUserData.as_view(), name='user-data'),
    path("user/<str:username>/<int:some_id>/update/", Debug.as_view(), name='debug')
]