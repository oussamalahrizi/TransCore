
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
		if self.cache.isUserLogged(user.id):
			print("User logged in already")
			print("there is refresh" if refresh_cookie else "no refresh")
			cache_token = self.cache.get_user_token(user_id=user.id)
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
		return None

	def _handle_2fa(self, user : User):
		"""Handle 2FA verification"""
		if user.two_factor_enabled:
			self.cache.execution_2fa_action(user.id, "set")
			return Response(data={
				"detail" : "Please verify 2fa.",
				"2fa" : True,
				"user_id" : user.id
				})
		return None

	@async_to_sync
	async def disconnect_user(self, user_id):
		notif_queue = publishers[0]
		data = {
			'type' : "disconnect_user",
			'data' : {
				'user_id' : str(user_id),
				'reason' : "Logged in from a new device"
			}
		}
		print("sending notification disconnect")
		await notif_queue.publish(data)

	def Helper(self, user : User) -> Response:
		token_pair = GenerateTokenPair(str(user.id))
		self.cache.store_token(user.id, token_pair['refresh'], token_pair["exp_refresh"])
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
		icon_url = user_data["picture"]

		try:
			user = get_object_or_404(User, email=email)
			provider = user.auth_provider.filter(name="Google").exists()
			if provider is False:
				obj, created = AuthProvider.objects.get_or_create(name="Google")
				user.auth_provider.add(obj)
				user.save()
			return user, None
		except Http404:
			try:
				# try create a user , avoid making same username different email
				original_username = get_object_or_404(User, username=username)
				raise Exception("Another user have the same username.")
			except Http404:
				user : User = User.objects.create_user(
					email=email,
					username=username,
					icon_url=icon_url,
					auth_provider="Google")
				pw = generate_password()
				user.set_password(pw)
				user.save()
				return user, pw

import secrets
import string	
				
def generate_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(characters) for _ in range(length))

class IntraMixin(LoginMixin):

	def getUser(self, user_data) -> User :
		username = user_data["login"]
		email = user_data["email"]
		icon_url = user_data["image"]["versions"]["medium"]

		try:
			user = get_object_or_404(User, email=email)
			provider = user.auth_provider.filter(name="Intra").exists()
			if provider is False:
				obj, created = AuthProvider.objects.get_or_create(name="Intra")
				user.auth_provider.add(obj)
				user.save()
			return user, None
		except Http404:
			try:
				# try create a user , avoid making same username different email
				original_username = get_object_or_404(User, username=username)
				raise Exception("Another user have the same username or email.")
			except Http404:
				user : User = User.objects.create_user(
					email=email,
					username=username,
					auth_provider="Intra",
					icon_url = icon_url
					)
				pw = generate_password()
				user.set_password(pw)
				user.save()
				return user, pw
