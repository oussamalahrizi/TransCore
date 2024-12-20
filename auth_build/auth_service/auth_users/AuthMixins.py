
from .utils import _AuthCache, GenerateTokenPair
from rest_framework.response import Response
from rest_framework import status
from django.urls import reverse
from .models import User

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

	def _handle_logged_user(self, username, refresh_cookie=None, force_logout=False):
		"""Handle already logged in user scenarios"""
		if self.cache.isUserLogged(username):
			cache_token = self.cache.get_user_token(username=username)
			
			if refresh_cookie:
				if cache_token != refresh_cookie:
					response = Response(status=status.HTTP_403_FORBIDDEN,
						data={"detail": "User already logged in on another device",
								"action": "deleted refresh_cookie"})
					response.delete_cookie("refresh_token")
					return response
				return Response("You are already logged in")

			if not force_logout:
				return Response(data={"detail": "User already logged in from another device"})
				
			self.cache.blacklist_token(cache_token, username)
		return None

	def _handle_2fa(self, user : User):
		"""Handle 2FA verification"""
		if user.two_factor_enabled:
			self.cache.execution_2fa_action(user.username, "set")
			response = Response(status=status.HTTP_302_FOUND)
			response["Location"] = reverse("verify-2fa", kwargs={'username': user.username})
			return response 
		return None

	def Helper(self, user : User) -> Response:
		token_pair = GenerateTokenPair(str(user.id))
		self.cache.store_token(user.username, token_pair['refresh'], token_pair["exp_refresh"])
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