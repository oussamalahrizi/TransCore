
from .utils import _AuthCache, GenerateTokenPair
from rest_framework.response import Response
from rest_framework import status
from django.urls import reverse
from .models import User, AuthProvider
from django.http.response import Http404
from django.shortcuts import get_object_or_404
import datetime

from core.asgi import publishers
from asgiref.sync import async_to_sync

class LoginMixin:
	cache = _AuthCache

	def _handle_refresh_cookie(self, refresh_cookie):
		"""Handle refresh cookie validation"""
		if refresh_cookie and self.cache.isTokenBlacklisted(refresh_cookie):
			response = Response(status=status.HTTP_403_FORBIDDEN,
				data={"detail": "Token is blacklisted.",
						"action": "Deleted refresh_cookie"})
			response.delete_cookie("refresh_token")
			return response
		return None

	def _handle_logged_user(self, user : User, refresh_cookie=None):
		"""Handle already logged in user scenarios"""
		if self.cache.isUserLogged(user.username):
			print("User logged in already")
			print("there is refresh" if refresh_cookie else "no refresh")
			cache_token = self.cache.get_user_token(username=user.username)
			if refresh_cookie:
				if cache_token != refresh_cookie:
					response = Response(status=status.HTTP_403_FORBIDDEN,
						data={"detail": "User already logged in on another device",
								"action": "deleted refresh_cookie"})
					response.delete_cookie("refresh_token")
					return response
				return Response("You are already logged in")
			
			if user.two_factor_enabled == False:
				return Response(data={"detail": "User already logged in from another device"}, status=status.HTTP_403_FORBIDDEN)
			self.cache.blacklist_token(cache_token, user.username)
		return None

	def _handle_2fa(self, user : User):
		"""Handle 2FA verification"""
		if user.two_factor_enabled:
			self.cache.execution_2fa_action(user.username, "set")
			return Response(data={
				"detail" : "Please verify 2fa.",
				"2fa" : True,
				"username" : user.username
				})
		return None

	@async_to_sync
	async def disconnect_user(self, username : str):
		notif_queue = publishers[1]
		data = {
			'type' : "disconnect_user",
			'data' : {
				'username' : username,
				'reason' : "Logged in from a new device"
			}
		}
		print("sending notification disconnect")
		await notif_queue.publish(data)

	def Helper(self, user : User) -> Response:
		token_pair = GenerateTokenPair(str(user.id))
		self.cache.store_token(user.username, token_pair['refresh'], token_pair["exp_refresh"])
		user.last_login = datetime.datetime.now(datetime.timezone.utc)
		user.save()
		response = Response(
			status=status.HTTP_202_ACCEPTED,
			data={"access_token": token_pair['access'], "refresh_token": token_pair['refresh']}
		)
		response.set_cookie(
			"refresh_token", 
			token_pair['refresh'],
			httponly=True,
			expires=token_pair["exp_refresh"]
		)
		return response

class GoogleMixin(LoginMixin):

	def getUser(self, user_data) -> User :
		username = user_data["given_name"]
		email = user_data["email"]

		try:
			user = get_object_or_404(User, email=email)
			provider = user.auth_provider.filter(name="Google").exists()
			if provider is False:
				obj, created = AuthProvider.objects.get_or_create(name="Google")
				user.auth_provider.add(obj)
				user.save()
			return user
		except Http404:
			user = User.objects.create_user(email=email, username=username, auth_provider="Google")
			return user


class IntraMixin(LoginMixin):

	def getUser(self, user_data) -> User :
		username = user_data["login"]
		email = user_data["email"]

		try:
			user = get_object_or_404(User, email=email)
			provider = user.auth_provider.filter(name="Intra").exists()
			if provider is False:
				obj, created = AuthProvider.objects.get_or_create(name="Intra")
				user.auth_provider.add(obj)
				user.save()
			return user
		except Http404:
			user = User.objects.create_user(email=email, username=username, auth_provider="Intra")
			return user
