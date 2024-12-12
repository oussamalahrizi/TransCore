from django.urls import path, include
from .views import (
   GetUser,
   ListUsers,
   UpdateUserInfo,
)

from .authViews import (
	RegisterEmail,
	LoginView,
	LogoutView,
	RefreshToken,
	JWK,
	EnableOTP,
	VerifyOTP
)
from django.urls import path
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
   permission_classes=(permissions.AllowAny,)
)
urlpatterns = [
   path('register/', RegisterEmail.as_view(), name='register-email'),
   path('login/', LoginView.as_view(), name='login-email'),
   path('logout/', LogoutView.as_view(), name='logout'),
   path('refresh/', RefreshToken.as_view(), name='refresh-token'),
   path('jwk/', JWK.as_view(), name='jwk'),
   path('users/', ListUsers.as_view(), name='list-users'),
   path('users/<str:username>/', GetUser.as_view(), name='user-info'),
   path('users/<str:username>/update/', UpdateUserInfo.as_view(), name='update'),
   path('users/<str:username>/enable-2fa/', EnableOTP.as_view(), name='enable-2fa'),
   path('users/<str:username>/verify-2fa/', VerifyOTP.as_view(), name='verify-2fa'),
   path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
]
