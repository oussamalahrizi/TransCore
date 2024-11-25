from django.urls import path, include
from .views import RegisterGeneric, GetUser, ListUsers, UpdateUserInfo
from django.urls import path, re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="Auth API",
      default_version='v1',
      description="ara ma testi m3a krek",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)
urlpatterns = [
    path('register/', RegisterGeneric.as_view(), name='register-email'),
    path('users/', ListUsers.as_view(), name='list-users'),
    path('users/<str:username>/', GetUser.as_view(), name='user-info'),
    path('users/<str:username>/update/', UpdateUserInfo.as_view(), name='update'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
]
