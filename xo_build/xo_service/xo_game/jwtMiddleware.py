import jwt
from rest_framework import authentication, status
import httpx
from .exceptions import InvalidToken
from asgiref.sync import async_to_sync

JWK_URL = "http://auth-service/api/auth/jwk/"
USER_INFO = "http://auth-service/api/auth/internal/userid/"
SESSION_STATE = "http://auth-service/api/auth/session_state/"


class ProxyUser:
	def __init__(self, user_data : dict):
		for key, value in user_data.items():
			setattr(self, key, value)
		self.is_authenticated = True
		self.is_anonymous = False
	
	def to_dict(self) -> dict:
		return self.__dict__


class JWTAuthentication(authentication.BaseAuthentication):


	def authenticate(self, request):
		auth_header = request.headers.get('Authorization')
		if not auth_header:
			raise InvalidToken("Authentication credentials were not provided.", custom_code=401)
		parts = auth_header.split()
		if len(parts) == 0:
			raise InvalidToken("Authentication credentials were not provided.", custom_code=401)
		if parts[0] != 'Bearer':
			raise InvalidToken("Authentication credentials were not provided.", custom_code=401)
		if len(parts) != 2:
			raise InvalidToken("Authentication credentials were not provided.", custom_code=401)
		return self.authenticate_credentials(parts[1])
	
	async def fetch_jwk_data(self):
		try:
			timeout = httpx.Timeout(5.0, read=5.0)
			async with httpx.AsyncClient(timeout=timeout) as client:
				response = await client.get(JWK_URL)
				response.raise_for_status()
				return response.json()
		except:
			return None
	
	async def get_user_data(self, user_id):
		try:
			timeout = httpx.Timeout(5.0, read=5.0)
			async with httpx.AsyncClient(timeout=timeout) as client:
				response = await client.get(f"{USER_INFO}{user_id}/")
				response.raise_for_status()
				return response.json()
		except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError):
			raise InvalidToken(detail="Failed to get user data from Auth service",
					  custom_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
		except httpx.HTTPStatusError as e:
			if e.response.status_code == httpx._status_codes.codes.NOT_FOUND:
				return None
			raise InvalidToken("Internal Server Error",
					  custom_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
	
	async def get_session_state(self, user_id):
		try:
			timeout = httpx.Timeout(5.0, read=5.0)
			async with httpx.AsyncClient(timeout=timeout) as client:
				response = await client.post(SESSION_STATE, json={"user_id" : user_id})
				response.raise_for_status()
				data = response.json()
				return data["session_state"]
		except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError) as e:
			print("internal server error")
			raise InvalidToken(detail="Failed to get session state from Auth service",
					  custom_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
		except httpx.HTTPStatusError as e:
			print(f"Error in session : {e.response.status_code}")
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
				raise InvalidToken("Invalid token.",
					   custom_code=status.HTTP_401_UNAUTHORIZED)
			user = await self.get_user_data(user_id=payload['user_id'])
			if user is None:
				raise InvalidToken("User Not Found", custom_code=status.HTTP_404_NOT_FOUND)
			if not user["is_active"]:
				raise InvalidToken('User is not active.', custom_code=status.HTTP_423_LOCKED)
			sess_id = payload.get("session_state")
			sess_cache = await self.get_session_state(user["id"])
			if sess_cache is None:
				raise jwt.ExpiredSignatureError
			if sess_cache != sess_id:
				raise InvalidToken("Access token revoked",custom_code=status.HTTP_423_LOCKED)
		except jwt.ExpiredSignatureError:
			raise InvalidToken('Token expired.', custom_code=status.HTTP_401_UNAUTHORIZED)
		except jwt.InvalidTokenError:
			raise InvalidToken('Invalid token.', custom_code=status.HTTP_401_UNAUTHORIZED)
		
		return (ProxyUser(user), token)