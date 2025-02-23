import jwt
from rest_framework import authentication, status
import httpx
from .exceptions import InvalidToken
from .utils import _Cache
from asgiref.sync import async_to_sync
import json

JWK_URL = "http://auth-service/api/auth/jwk/"
USER_INFO = "http://auth-service/api/auth/api_users/"
SESSION_STATE = "http://auth-service/api/auth/session_state/"


"""
	TODO:
		- fetch jwk
		- fetch user info by id and store in cache
		- make a view to retrieve current access token state to provide to other services
		- fetch current access token state from auth service
		- test this middelware
"""

class ProxyUser:
	def __init__(self, user_data : dict):
		for key, value in user_data.items():
			setattr(self, key, value)
		self.is_authenticated = True
		self.is_anonymous = False
	
	def to_dict(self) -> dict:
		return self.__dict__


class JWTAuthentication(authentication.BaseAuthentication):

	cache = _Cache

	def authenticate(self, request):
		auth_header = request.headers.get('Authorization')
		if not auth_header:
			raise InvalidToken("Authentication credentials were not provided.")
		parts = auth_header.split()
		if len(parts) == 0:
			raise InvalidToken("Authentication credentials were not provided.")
		if parts[0] != 'Bearer':
			raise InvalidToken("Authentication credentials were not provided.")
		if len(parts) != 2:
			raise InvalidToken("Authentication credentials were not provided.")
		return self.authenticate_credentials(parts[1])
	
	async def fetch_jwk_data(self):
		try:
			timeout = httpx.Timeout(5.0, read=5.0)
			async with httpx.AsyncClient(timeout=timeout) as client:
				response = await client.get(JWK_URL)
				response.raise_for_status()
				return response.json()
		except httpx.ReadTimeout:
			print("Error reaching the auth service.")
			return None
		except Exception:
			return None
	
	async def get_user_data(self, user_id):
		try:
			user = self.cache.get_user_data(user_id=user_id)
			if user:
				return user["auth"]
			timeout = httpx.Timeout(5.0, read=5.0)
			async with httpx.AsyncClient(timeout=timeout) as client:
				response = await client.get(f"{USER_INFO}{user_id}/")
				response.raise_for_status()
				self.cache.set_user_data(user_id, data=response.json())
				auth_user = response.json()
				self.cache.set_user_data(auth_user["id"], auth_user, "auth")
				return {"auth" : auth_user}
		except httpx.ReadTimeout:
			print("Error reaching the auth service.")
			return None
		except Exception:
			print(f"Error get user : {response.json()}")
			return None
	
	async def get_session_state(self, user_id):
		try:
			timeout = httpx.Timeout(5.0, read=5.0)
			async with httpx.AsyncClient(timeout=timeout) as client:
				response = await client.post(SESSION_STATE, json={"user_id" : user_id})
				response.raise_for_status()
				self.cache.set_user_data(user_id, data=response.json())
				data = response.json()
				return data["session_state"]
		except httpx.ReadTimeout:
			print("Error reaching the auth service.")
			return None
		except Exception:
			print(f"Error session : {response.json()}")
			return None
	
	@async_to_sync
	async def authenticate_credentials(self, token):
		try:
			public_key = await self.fetch_jwk_data()
			if public_key is None:
				raise InvalidToken("failed to fetch public key from auth service")
			payload = jwt.decode(token, public_key["public_key"], algorithms=public_key["algorithm"])
			type = payload.get('typ')
			if type is None or type != 'Bearer':
				raise InvalidToken("Invalid token.")
			user = await self.get_user_data(user_id=payload['user_id'])
			if user is None:
				raise InvalidToken("User Not Found",)
			if not user["is_active"]:
				raise InvalidToken('User is not active.',
					   clear=True, custom_code=status.HTTP_423_LOCKED)
			"""
				verify if the session id in the token is same in the cache,
				the only source of truth for session validity is the cache 
				so if it doesnt match the current sess_id in token, that means the user 
				is logged in in another session but the current token is from an older session
				even tho the token is valid; its gonna expire soon anyway and cant be refreshed
				since the refresh token associated is blacklisted
			"""
			sess_id = payload.get("session_state")
			sess_cache = await self.get_session_state(user["id"])
			if sess_cache is None:
				raise jwt.ExpiredSignatureError
			if sess_cache != sess_id:
				raise InvalidToken("Access token revoked",
					clear=True, custom_code=status.HTTP_423_LOCKED)
		except jwt.ExpiredSignatureError:
			raise InvalidToken('Token expired.')
		except jwt.InvalidTokenError:
			raise InvalidToken('Invalid token.')
		return (ProxyUser(user), token)