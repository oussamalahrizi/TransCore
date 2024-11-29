import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from django.contrib.auth.models import  auth
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.http import Http404

User  = get_user_model()

class JWTAuthentication(authentication.BaseAuthentication):

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
			raise exceptions.AuthenticationFailed('bad authorization value')
		return self.authenticate_credentials(parts[1])

	def authenticate_credentials(self, token):
		try:
			payload = jwt.decode(token, settings.JWT_PUBLIC_KEY, algorithms=settings.JWT_ALGORITHM)
			type = payload.get('typ')
			if type is None or type != 'Bearer':
				raise exceptions.AuthenticationFailed("Invalid token.", code=401)
			user = get_object_or_404(User, id=payload['user_id'])
			if not user.is_active:
				raise exceptions.AuthenticationFailed('User is not active.', code=401)
		except jwt.ExpiredSignatureError:
			raise exceptions.AuthenticationFailed('Token expired.', code=401)
		except jwt.InvalidTokenError:
			raise exceptions.AuthenticationFailed('Invalid token.', code=401)
		except Http404:
			raise exceptions.AuthenticationFailed('User not found', code=401)
		return (user, token)
