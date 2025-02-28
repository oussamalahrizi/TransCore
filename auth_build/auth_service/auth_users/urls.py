from django.urls import path, include
from .views import (
   GetUser,
   ListUsers,
   UpdateUserInfo,
   GetUserServiceID,
   GetUserServiceName,
   UpdatePassword,
   GetFriends,
   SendFriendRequest,
   CheckReceivedFriend,
   CheckSentFriend,
   GetMyInfo,
   BanSelf,
   ResetPassword,
   PasswordVerify,
   CDNVerify,
   sendNotif
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
   path('password_reset/', ResetPassword.as_view(), name='password-reset'),
   path('password_verify/', PasswordVerify.as_view(), name='password-verify'),
   path('google_callback/', GoogleCallback.as_view(), name='google-callback'),
   path('intra_callback/', IntraCallback.as_view(), name='intra-callback'),
   path('logout/', LogoutView.as_view(), name='logout'),
   path('jwk/', JWK.as_view(), name='jwk'),
   path('session_state/', SessionState.as_view(), name='session-state'),
   path('refresh/', RefreshToken.as_view(), name='refresh-token'),
   path('users/', ListUsers.as_view(), name='list-users'),
   path('users/ban_me/', BanSelf.as_view(), name='ban-self'),
   path('users/me/', GetMyInfo.as_view(), name='profile-info'),
   path('users/verify-2fa/', VerifyOTP.as_view(), name='verify-2fa'),
   path('users/enable-2fa/', EnableOTP.as_view(), name='enable-2fa'),
   path('users/disable-2fa/', DisableOTP.as_view(), name='disable-2fa'),
   path('users/<str:username>/', GetUser.as_view(), name='user-info'),
   path('api_user_id/<str:id>/', GetUserServiceID.as_view(), name='user-id-service'),
   path('api_user_name/<str:username>/', GetUserServiceName.as_view(), name='user-name-service'),
   path('users/<str:username>/update/', UpdateUserInfo.as_view(), name='update'),
   path('users/<str:username>/update_password/', UpdatePassword.as_view(), name='update'),
   path('friends/', GetFriends.as_view(), name='friend-list'),
   path('friends/received/', CheckReceivedFriend.as_view(), name='recv-list'),
   path('friends/sent/', CheckSentFriend.as_view(), name='sent-list'),
   path('add_friend/<str:username>/', SendFriendRequest.as_view(), name='add-friend'),
   path('swagger/', schema_view.with_ui(), name='schema-swagger-ui'),
   path('cdn_verify/', CDNVerify.as_view(), name='cdn-nginx'),
   path('send_notif/', sendNotif.as_view(), name='send-notif'),

]
