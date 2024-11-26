import jwt
from django.conf import settings
import datetime
from rest_framework.response import Response
from rest_framework import status

def RefreshBearer(refresh):
	response = None
	try:
		payload = jwt.decode(refresh, settings.JWT_PUBLIC_KEY, algorithms=settings.JWT_ALGORITHM)
		type = payload.get('typ')
		if type is None or type != 'Refresh':
			response = Response({"detail" : "Invalid refresh token."})
		exp_access = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
		user_id = payload.get('user_id')
		if user_id is None:
			response = Response({"detail" : "Invalid refresh token."})
		payload = {
			'user_id' : str(user_id),
			'exp' : exp_access,
			'iat' : datetime.datetime.utcnow(),
			'typ' : 'Bearer'
		}
		access = jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
		response = Response({"acess_token" : access})
	except jwt.ExpiredSignatureError:
		response = Response({"detail" : "Refresh token expired."})
	except jwt.InvalidTokenError:
		response = Response({"detail" : "Invalid refresh token."})
	return response


def GenerateTokenPair(user_id):
	exp_refresh = datetime.datetime.utcnow() + datetime.timedelta(days=1)
	exp_access = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)

	payload = {
		'user_id' : str(user_id),
		'exp' : exp_access,
		'iat' : datetime.datetime.utcnow(),
		'typ' : 'Bearer'
	}
	access = jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
	payload['exp'] = exp_refresh
	payload['typ'] = 'Refresh'
	refresh = jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
	return access, refresh


def CheckUserAauthenticated(request):
	if request.user.is_authenticated:
		response = Response(
			data={"detail" : "already logged in redirecting..."},
			status=status.HTTP_302_FOUND,
		)
		response['Location'] = "f'/auth/users/{request.user.username}/"
		return response
	return None