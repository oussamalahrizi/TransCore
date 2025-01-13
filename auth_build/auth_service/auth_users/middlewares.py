import jwt
from django.conf import settings
from rest_framework import authentication
from django.shortcuts import get_object_or_404
from django.http import Http404
from .utils import _AuthCache
from .models import User
from .exceptions import InvalidToken


class JWTAuthentication(authentication.BaseAuthentication):

	cache = _AuthCache

	def authenticate(self, request):
		auth_header = authentication.get_authorization_header(request)
		if not auth_header:
			return None
		parts = auth_header.split()
		if len(parts) == 0:
			return None
		if parts[0].decode('utf-8') != 'Bearer':
			return None
		if len(parts) != 2:
			return None
		return self.authenticate_credentials(parts[1])

	def authenticate_credentials(self, token):
		try:
			payload = jwt.decode(token, settings.JWT_PUBLIC_KEY, algorithms=settings.JWT_ALGORITHM)
			type = payload.get('typ')
			if type is None or type != 'Bearer':
				raise InvalidToken("Invalid token. ahbibi")
			user = get_object_or_404(User, id=payload['user_id'])
			if not user.is_active:
				raise InvalidToken('User is not active.')
			"""
				verify if the session id in the token is same in the cache,
				the only source of truth for session validity is the cache 
				so if it doesnt match the current sess_id in token, that means the user 
				is logged in in another session but the current token is from an older session
				even tho the token is valid; its gonna expire soon anyway and cant be refreshed
				since the refresh token associated is blacklisted
			"""
			sess_id = payload.get("session_state")
			sess_cache = self.cache.get_access_session(user.id)
			if sess_cache is None:
				raise jwt.ExpiredSignatureError
			if sess_cache != sess_id:
				raise InvalidToken("Access token revoked")
		except jwt.ExpiredSignatureError:
			raise InvalidToken('Token expired.')
		except jwt.InvalidTokenError:
			raise InvalidToken('Invalid token.')
		except Http404:
			raise InvalidToken('User not found')
		return (user, token)
