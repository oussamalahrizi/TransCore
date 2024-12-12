from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import AllowAny, IsAuthenticated
from .utils import GenerateTokenPair, _AuthCache, RefreshBearer
from rest_framework.views import APIView
from rest_framework import serializers
from django.urls import reverse 
from .serializers import (
	UserLogin,
	InputSerializer,
	UserTwoFactorSerial)
from .models import User

class RegisterEmail(CreateAPIView):
	serializer_class = InputSerializer
	permission_classes = [AllowAny]
	cache = _AuthCache

	def post(self, request: Request):
		refresh_cookie = request.COOKIES.get("refresh_token")
		if refresh_cookie:
			if self.cache.isTokenBlacklisted(refresh_cookie):
				response = Response(status=status.HTTP_403_FORBIDDEN,
					data={"Cookie token is blacklisted"})
				response.delete_cookie("refresh_cookie")
				return response
			else:
				return Response(data={"detail: you are already logged in"})
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		self.perform_create(serializer)
		response = Response(status=status.HTTP_201_CREATED, data={"detail : User created successfully"})
		response["Location"] = reverse("login-email")
		return response

class LoginView(CreateAPIView):
	serializer_class = UserLogin
	permission_classes = [AllowAny]
	cache = _AuthCache

	def Helper(self, user: User) -> Response:
		res = GenerateTokenPair(str(user.id))
		access = res['access']
		refresh = res['refresh']
		# store user and token in cache 
		self.cache.store_token(user.username, refresh, res["exp_refresh"])
		# generate response with refresh in cookies http only
		response = Response(status=status.HTTP_202_ACCEPTED)
		response.data = {"access_token" : access, "refresh_token" : refresh}
		response.set_cookie("refresh_token", refresh,
					  httponly=True,
					  expires=res["exp_refresh"])			
		return response

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
		"""
		first if request has refresh cookie check if its blacklisted to revoke access
		if not blacklisted

		"""
		refresh_cookie = request.COOKIES.get("refresh_token")
		if refresh_cookie:
			if self.cache.isTokenBlacklisted(refresh_cookie):
				response = Response(status=status.HTTP_403_FORBIDDEN,
					data={"token is blacklisted, user forced login from another device.",
		   					"action : deleted refresh_cookie"})
				response.delete_cookie("refresh_token")
				return response
		# check user creds
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user: User = serializer.validated_data['user']
		force_logout = serializer.validated_data["force_logout"]
		"""
			- go fetch user data and refresh in cache
			- if already there prevent login from another device
				unless the refresh from cache is same as the refresh in cookies
				should redirect to profile
			- user is held in cache until his refresh token expires
			- users logged in from a device and want to login from a new device
				can automatically logout from that device by simply removing the user data from cache
				and move their refresh token to the blacklist cache until it expires
		"""
		# see if user logged in
		user_logged = False
		if self.cache.isUserLogged(user.username):
			user_logged = True
			cache_token = self.cache.get_user_token(username=user.username)
			"""
				we dont care if force logout is there if the refresh cookie is present
				- if its same as in cache just say you are logged in
				- if its not then delete it from cookies and return user logged in from another device
			"""
			if refresh_cookie:
				if cache_token != refresh_cookie:
					response = Response(status=status.HTTP_403_FORBIDDEN,
						data={"detail : user already logged in on another device",
							"action : deleted refresh_cookie"})
					response.delete_cookie("refresh_token")
					return response
				return Response("you are already logged in")

			if not force_logout:
				return Response(data={"detail : user already logged in from another device"})

		# check two factor auth
		
		if user.two_factor_enabled is True:
			self.cache.execution_2fa_action(user.username, "set")
			response = Response(status=status.HTTP_302_FOUND)
			response["Location"] = reverse("verify-2fa", kwargs={'username': user.username})
			return response
		if user_logged:
			self.cache.blacklist_token(cache_token, user.username)
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
		
		# Delete from cookies
		response = Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)
		response.delete_cookie('refresh_token')
		return response


class RefreshToken(APIView):
	cache = _AuthCache
	permission_classes = [AllowAny]

	@property
	def allowed_methods(self):
		return ['GET']
	def get(self, request: Request, *args, **kwargs):
		refresh = request.COOKIES.get('refresh_token')
		if refresh is None:
			return Response({"detail" : "Missing refresh token."}, status=status.HTTP_400_BAD_REQUEST)
		if self.cache.isTokenBlacklisted(refresh):
				return Response(status=status.HTTP_403_FORBIDDEN,
					data={"detail: Cookie token is blacklisted."})
		response = RefreshBearer(refresh)
		return response

from django.conf import settings

class JWK(APIView):
	permission_classes = [AllowAny]
	
	@property
	def allowed_methods(self):
		return ["GET"]
	def get(self, request):
		data = {
			"public_key" : settings.JWT_PUBLIC_KEY,
			"algorithm" : settings.JWT_ALGORITHM
		}
		return Response(data=data)

from .views import IsSameUser
from django.shortcuts import get_object_or_404
from django.http.response import Http404
import pyotp, qrcode
from io import BytesIO
from base64 import b64encode

class EnableOTP(RetrieveAPIView):
	lookup_field = "username"
	queryset = User.objects.all()
	permission_classes = [IsSameUser]

	def get(self, request, *args, **kwargs):
		user = self.get_object()
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
		url = pyotp.totp.TOTP(user.two_factor_secret) \
			.provisioning_uri(name=user.username, issuer_name="auth service transcore")
		qr = qrcode.QRCode(
        	version=1,
        	error_correction=qrcode.constants.ERROR_CORRECT_L,
        	box_size=10,
        	border=4,
    	)
		qr.add_data(url)
		qr.make(fit=True)
		img = qr.make_image(fill="black", back_color="white")
		buffer = BytesIO()
		img.save(buffer, format="PNG")
		img_str = b64encode(buffer.getvalue()).decode()
		return Response(img_str)

class VerifyOTP(CreateAPIView):

	class OTPSerializer(serializers.Serializer):
		code = serializers.IntegerField(required=True)

	lookup_field = "username"
	queryset = User.objects.all()
	cache = _AuthCache
	serializer_class = OTPSerializer

	def post(self, request, *args, **kwargs):
		user = self.get_object()
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
		response["Location"] = f"/auth/login/?username={user.username}&execution={sec}"
		return response

