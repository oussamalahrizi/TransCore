from django.conf import settings
from rest_framework.generics import (
	CreateAPIView,
	RetrieveAPIView)
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.urls import reverse
from .utils import (
	_AuthCache,
	RefreshBearer)
from rest_framework.views import APIView
from rest_framework import serializers
from .serializers import (
	UserLogin,
	InputSerializer,
	SessionSerializer)
from .models import User
from .views import IsSameUser
from django.shortcuts import get_object_or_404
from django.http.response import Http404
import pyotp, qrcode
from io import BytesIO
from base64 import b64encode
from .AuthMixins import (
	LoginMixin,
	GoogleMixin,
	IntraMixin)
from httpx import AsyncClient
from asgiref.sync import async_to_sync, sync_to_async
from .permissions import IsAllowedHost
from rest_framework.exceptions import PermissionDenied


class RegisterEmail(LoginMixin, CreateAPIView):
	permission_classes = [AllowAny]
	authentication_classes = []
	cache = _AuthCache
	serializer_class = InputSerializer
	queryset = User.objects.all()

	def post(self, request: Request):
		refresh_cookie = request.COOKIES.get("refresh_token")
		cookie_response = self._handle_refresh_cookie(refresh_cookie)
		if cookie_response:
			return cookie_response


		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		self.perform_create(serializer)
		response = Response(status=status.HTTP_201_CREATED, data={"detail : User created successfully"})
		response["Location"] = reverse("login-email")
		return response


class LoginView(LoginMixin, CreateAPIView):
	serializer_class = UserLogin
	permission_classes = [AllowAny]
	authentication_classes = []

	def get(self, request : Request):
		execution = request.query_params.get("execution")
		username = request.query_params.get("username")
		if execution is None or username is None:
			return Response(data={"detail : missing query params"})
		token = self.cache.execution_2fa_action(username, action="get")
		if token is None:
			return Response(data={"detail : invalid request"}, status=status.HTTP_400_BAD_REQUEST)
		try:
			user = get_object_or_404(User, username=username)
			self.cache.execution_2fa_action(user.username, action="delete")
			if self.cache.isUserLogged(user.username):
				self.cache.BlacklistUserToken(user.username)
			return self.Helper(user)
		except Http404:
			return Response(status=status.HTTP_400_BAD_REQUEST)

	def post(self, request: Request):
		# Check refresh cookie
		refresh_cookie = request.COOKIES.get("refresh_token")
		cookie_response = self._handle_refresh_cookie(refresh_cookie)
		if cookie_response:
			return cookie_response

		# Validate credentials
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.validated_data['user']
		force_logout = serializer.validated_data["force_logout"]

		# Handle logged in user
		logged_response = self._handle_logged_user(user, refresh_cookie, force_logout)
		if logged_response:
			return logged_response

		# Handle 2FA
		twofa_response = self._handle_2fa(user)
		if twofa_response:
			return twofa_response

		return self.Helper(user)

class LogoutView(APIView):
	permission_classes = [IsAuthenticated]
	cache = _AuthCache

	@property
	def allowed_methods(self):
		return ['GET']

	def get(self, request: Request):
		refresh_token = request.COOKIES.get('refresh_token')
		if not refresh_token:
			return Response({"detail": "Refresh token not found."}, status=status.HTTP_400_BAD_REQUEST)
		
		# Blacklist the refresh token
		self.cache.blacklist_token(refresh_token, request.user.username)
		self.cache.delete_access_session(request.user.id)
		# Delete from cookies
		response = Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)
		response.delete_cookie('refresh_token')
		return response


class RefreshToken(APIView):
	cache = _AuthCache
	permission_classes = [AllowAny]
	authentication_classes = []

	@property
	def allowed_methods(self):
		return ['GET']
	def get(self, request: Request, *args, **kwargs):
		refresh = request.COOKIES.get('refresh_token')
		if refresh is None:
			response = Response({"detail" : "Missing refresh token."}, status=status.HTTP_400_BAD_REQUEST)
			return response
		if self.cache.isTokenBlacklisted(refresh):
			response = Response(status=status.HTTP_403_FORBIDDEN,
				data={
						"detail: Cookie token is blacklisted.",
						"action: Deleted cookie."
					})
			response.delete_cookie("refresh_token")
			return response
		response = RefreshBearer(refresh)
		return response

class JWK(APIView):
	permission_classes = [AllowAny]
	authentication_classes = []
	
	@property
	def allowed_methods(self):
		return ["GET"]
	def get(self, request):
		data = {
			"public_key" : str(settings.JWT_PUBLIC_KEY).replace("\n", ""),
			"algorithm" : settings.JWT_ALGORITHM
		}
		return Response(data=data)

class SessionState(APIView):
	permission_classes = [IsAllowedHost]
	authentication_classes = []
	cache = _AuthCache

	def permission_denied(self, request, message=None, code=None):
		raise PermissionDenied(detail="Host not allowed.")

	def post(self, request, *args, **kwargs):
		try:
			print(request.data)
			serializer = SessionSerializer(data=request.data)
			print("before")
			serializer.is_valid(raise_exception=True)
			print(f"user id after: {serializer.data["user_id"]}")
			session = self.cache.get_access_session(serializer.data["user_id"])
			if session is None:
				raise serializers.ValidationError
			return Response(data={"session_state" : session})
		except serializers.ValidationError as e:
			print(f"reason : {e}")
			return Response(status=status.HTTP_404_NOT_FOUND, data={"detail" : "user not found or not logged in"})


class EnableOTP(APIView):
	permission_classes = [IsSameUser]

	def _generate_url(self, user : User):
		""" Generate base64 image data """
		url = pyotp.totp.TOTP(user.two_factor_secret) \
			.provisioning_uri(name=user.username, issuer_name="Auth Service")
		qr = qrcode.QRCode(
        	version=1,
        	error_correction=qrcode.constants.ERROR_CORRECT_L,
        	box_size=10,
        	border=4
    	)
		qr.add_data(url)
		qr.make(fit=True)
		img = qr.make_image(fill="black", back_color="white")
		buffer = BytesIO()
		img.save(buffer, format="PNG")
		img_str = b64encode(buffer.getvalue()).decode()
		return Response(img_str)

	def get(self, request, *args, **kwargs):
		try:
			user = get_object_or_404(User, username=kwargs.get("username"))
			if user.two_factor_enabled is True:
				return Response(data={f"detail : {user.username} already enabled 2FA."})
			# generate secret and update attributes
			secret = pyotp.random_base32()
			data = {
				"two_factor_enabled": True,
				"two_factor_secret": secret
			}
			for key, value in data.items():
				setattr(user, key, value)
			user.save()
			# generate url
			return self._generate_url(user)
		except Http404:
			return Response(data={"detail" : "User Not Found."}, status=status.HTTP_404_NOT_FOUND)

class DisableOTP(APIView):
	permission_classes = [IsSameUser]

	def get(self, request, *args, **kwargs):
		try:
			user = get_object_or_404(User, username=kwargs.get("username"))
			if not user.two_factor_enabled:
				return Response(data={f"detail : {user.username} already disabled."})
			data = {
				"two_factor_enabled": False,
				"two_factor_secret": ""
			}
			for key, value in data.items():
				setattr(user, key, value)
			user.save()
			return Response(data={"detail : Updated successfully."})
		except Http404:
			return Response(data={"detail" : "User Not Found."}, status=status.HTTP_404_NOT_FOUND)


class VerifyOTP(CreateAPIView):

	class OTPSerializer(serializers.Serializer):
		code = serializers.IntegerField(required=True)

	lookup_field = "username"
	queryset = User.objects.all()
	cache = _AuthCache
	serializer_class = OTPSerializer
	authentication_classes = []

	def post(self, request, *args, **kwargs):
		user : User = self.get_object()
		if self.cache.didUserRequest(user.username) is False:
			return Response({f"detail : {user.username} did not request a code; the incident will be reported."},
				   				status=status.HTTP_403_FORBIDDEN)
		instance = self.get_serializer(data=request.data)
		secret = user.two_factor_secret
		if not instance.is_valid():
			return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		val = pyotp.TOTP(secret).verify(instance.validated_data["code"])
		if not val :
			return Response(data={"detail : invalid OTP code."}, status=status.HTTP_403_FORBIDDEN)
		sec = self.cache.execution_2fa_action(user.username, "get")
		response = Response(status=status.HTTP_302_FOUND)
		response["Location"] = f"/api/auth/login/?username={user.username}&execution={sec}"
		return response


class GoogleCallback(GoogleMixin, APIView):

	permission_classes = [AllowAny]
	authentication_classes = []
	cache = _AuthCache

	@sync_to_async
	def cleanup(self, user_data, request):
		user : User = self.getUser(user_data)
		refresh_cookie = request.COOKIES.get("refresh_token")
		cookie_response = self._handle_refresh_cookie(refresh_cookie)
		if cookie_response:
			return cookie_response
		logged_response = self._handle_logged_user(user.	username, refresh_cookie, force_logout=False)
		if logged_response:
			return logged_response
		twofa_response = self._handle_2fa(user)
		if twofa_response:
			return twofa_response
		return self.Helper(user)


	@async_to_sync
	async def get(self, request : Request):
		
		code = request.query_params.get("code")
		# force_logout = request.query_params.get("force_logout")
		# if force_logout not in ["True", "False"]:
		# 	return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail : Invalid force_logout value."})
		if code is None:
			return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail : Missing code."})
		# Exchange code for access token
		token_url = "https://oauth2.googleapis.com/token"
		token_data = {
			"code": code,
			"client_id": settings.GOOGLE_CLIENT_ID,
			"client_secret": settings.GOOGLE_CLIENT_SECRET,
			"redirect_uri": settings.GOOGLE_REDIRECT_URI,
			"grant_type": "authorization_code"
		}
		async with AsyncClient() as client:
			# Exchange code for access token
			token_response = await client.post(token_url, data=token_data)
			if token_response.status_code != 200:
				return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail": "Failed to get access token"})
			access_token = token_response.json()["access_token"]

			# Get user info using access token 
			userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
			headers = {"Authorization": f"Bearer {access_token}"}
			userinfo_response = await client.get(userinfo_url, headers=headers)
			if userinfo_response.status_code != 200:
				return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail": "Failed to get user info"})

			user_data = userinfo_response.json()
			response = await self.cleanup(user_data, request)
			return response

class IntraCallback(IntraMixin, APIView):
	permission_classes = [AllowAny]
	authentication_classes = []

	@sync_to_async
	def cleanup(self, user_data, request):
		user : User = self.getUser(user_data)
		refresh_cookie = request.COOKIES.get("refresh_token")
		cookie_response = self._handle_refresh_cookie(refresh_cookie)
		if cookie_response:
			return cookie_response
		logged_response = self._handle_logged_user(user.username, refresh_cookie, force_logout=False)
		if logged_response:
			return logged_response
		twofa_response = self._handle_2fa(user)
		if twofa_response:
			return twofa_response
		return self.Helper(user)

	@async_to_sync
	async def get(self, request : Request):
		code = request.query_params.get("code")
		if code is None:
			return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail : Missing code."})
		# Exchange code for access token
		token_url = "https://api.intra.42.fr/oauth/token"
		token_data = {
			"code": code,
			"client_id": settings.INTRA_CLIENT_ID,
			"client_secret": settings.INTRA_CLIENT_SECRET,
			"redirect_uri": settings.INTRA_REDIRECT_URI,
			"grant_type": "authorization_code",
			"state" : pyotp.random_base32()
		}
		async with AsyncClient() as client:

			token_response = await client.post(token_url, data=token_data)
			if token_response.status_code != 200:
				return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail": "Failed to get access token"})
			access_token = token_response.json()["access_token"]

			# Get user info using access token
			userinfo_url = "https://api.intra.42.fr/v2/me"
			headers = {"Authorization": f"Bearer {access_token}"}
			userinfo_response = await client.get(userinfo_url, headers=headers)
			if userinfo_response.status_code != 200:
				return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail": "Failed to get user info"})
			user_data = userinfo_response.json()
			response = await self.cleanup(user_data, request)
			return response