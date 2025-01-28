from django.urls import path, include
from .views import (
   GetUser,
   ListUsers,
   UpdateUserInfo,
   GetUserService,
   UpdatePassword,
   GetFriends,
   SendFriendRequest,
   CheckReceivedFriend,
   CheckSentFriend,
   GetMyInfo
)

from .AuthViews import (
	RegisterEmail,
	LoginView,
	LogoutView,
	RefreshToken,
	JWK,
   SessionState,
	EnableOTP,
	DisableOTP,
	VerifyOTP,
	GoogleCallback,
	IntraCallback
)
from django.urls import path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="Auth Service API",
      default_version='v1',
      description="Docs for api interaction with Auth-Service",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
   authentication_classes=[]
)
urlpatterns = [
   path('register/', RegisterEmail.as_view(), name='register-email'),
   path('login/', LoginView.as_view(), name='login-email'),
   path('google_callback/', GoogleCallback.as_view(), name='google-callback'),
   path('intra_callback/', IntraCallback.as_view(), name='intra-callback'),
   path('logout/', LogoutView.as_view(), name='logout'),
   path('jwk/', JWK.as_view(), name='jwk'),
   path('session_state/', SessionState.as_view(), name='session-state'),
   path('refresh/', RefreshToken.as_view(), name='refresh-token'),
   path('users/', ListUsers.as_view(), name='list-users'),
   path('users/me/', GetMyInfo.as_view(), name='profile-info'),
   path('users/<str:username>/', GetUser.as_view(), name='user-info'),
   path('api_users/<str:id>/', GetUserService.as_view(), name='user-info-service'),
   path('users/<str:username>/update/', UpdateUserInfo.as_view(), name='update'),
   path('users/<str:username>/update_password/', UpdatePassword.as_view(), name='update'),
   path('users/<str:username>/enable-2fa/', EnableOTP.as_view(), name='enable-2fa'),
   path('users/<str:username>/disable-2fa/', DisableOTP.as_view(), name='disable-2fa'),
   path('users/<str:username>/verify-2fa/', VerifyOTP.as_view(), name='verify-2fa'),
   path('friends/', GetFriends.as_view(), name='friend-list'),
   path('friends/received/', CheckReceivedFriend.as_view(), name='recv-list'),
   path('friends/sent/', CheckSentFriend.as_view(), name='sent-list'),
   path('add_friend/<str:username>', SendFriendRequest.as_view(), name='add-friend'),
   path('swagger/', schema_view.with_ui(), name='schema-swagger-ui'),
]
