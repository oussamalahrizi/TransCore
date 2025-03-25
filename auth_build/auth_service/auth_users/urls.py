from django.urls import path, include
from .views import (
   GetUser,
   ListUsers,
   UpdateUserInfo,
   UpdatePassword,
   GetFriends,
   SendFriendRequest,
   CheckReceivedFriend,
   CheckSentFriend,
   GetMyInfo,
   ResetPassword,
   PasswordVerify,
   CDNVerify,
   ChangeFriend,
   GetBlocked
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

from .api_urls import api_urlpatterns
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

# auth urls
urlpatterns = [
   path('register/', RegisterEmail.as_view(), name='register-email'),
   path('login/', LoginView.as_view(), name='login-email'),
   path('password_reset/', ResetPassword.as_view(), name='password-reset'),
   path('password_verify/', PasswordVerify.as_view(), name='password-verify'),
   path('google_callback/', GoogleCallback.as_view(), name='google-callback'),
   path('intra_callback/', IntraCallback.as_view(), name='intra-callback'),
   path('logout/', LogoutView.as_view(), name='logout'),
   path('jwk/', JWK.as_view(), name='jwk'),
   path('session_state/', SessionState.as_view(), name='session-state'),
   path('refresh/', RefreshToken.as_view(), name='refresh-token')
]

# internal api urls

urlpatterns += api_urlpatterns

from .views import UserImageView

# user management urls
urlpatterns += [
   path('users/', ListUsers.as_view(), name='list-users'),
   path('users/me/', GetMyInfo.as_view(), name='profile-info'),
   path('users/image/', UserImageView.as_view(), name='profile-image-post'),
   path('users/image/<str:id>/', UserImageView.as_view(), name='profile-image'),
   path('users/verify-2fa/', VerifyOTP.as_view(), name='verify-2fa'),
   path('users/enable-2fa/', EnableOTP.as_view(), name='enable-2fa'),
   path('users/disable-2fa/', DisableOTP.as_view(), name='disable-2fa'),
   path('users/update/', UpdateUserInfo.as_view(), name='update-info'),
   path('users/update_password/', UpdatePassword.as_view(), name='update-password'),
   path('users/<str:username>/', GetUser.as_view(), name='user-info'),
   path('friends/', GetFriends.as_view(), name='friend-list'),
   path('friends/blocked/', GetBlocked.as_view(), name='block-list'),
   path('friends/received/', CheckReceivedFriend.as_view(), name='recv-list'),
   path('friends/sent/', CheckSentFriend.as_view(), name='sent-list'),
   path('friends/change/<str:id>/', ChangeFriend.as_view(), name='change-friends-relations'),
   path('add_friend/<str:username>/', SendFriendRequest.as_view(), name='add-friend'),
   path('swagger/', schema_view.with_ui(), name='schema-swagger-ui'),
   path('cdn_verify/', CDNVerify.as_view(), name='cdn-nginx'),
]

