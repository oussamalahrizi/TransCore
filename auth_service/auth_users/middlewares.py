import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from django.contrib.auth.models import  auth
from django.contrib.auth import get_user_model

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
				raise exceptions.AuthenticationFailed("bad token payload")
		except jwt.ExpiredSignatureError:
			raise exceptions.AuthenticationFailed('token expired')
		except jwt.InvalidTokenError:
			raise exceptions.AuthenticationFailed('invalid token')
		user = User.objects.get(id=payload['user_id'])
		if user is None:
			raise exceptions.AuthenticationFailed("user not found")
		if not user.is_active:
			raise exceptions.AuthenticationFailed('user is banned')
		return (user, token)
