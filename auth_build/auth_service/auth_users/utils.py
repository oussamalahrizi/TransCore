import jwt
from django.conf import settings
import datetime
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from redis import Redis
import random
import uuid

class Logger:
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"

    def __init__(self):
        self.log_format = "[{time}] {level}: {message}"
        
    def log(self, level, message):
        """
        Log a message with the specified level
        Args:
            level: The log level (DEBUG, INFO, WARNING, ERROR)
            message: The message to log
        """
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        formatted_log = self.log_format.format(
            time=current_time,
            level=level,
            message=message
        )
        print(formatted_log)

_logger = Logger()

def RefreshBearer(refresh):
	response = None
	cache = _AuthCache
	try:
		payload = jwt.decode(refresh, settings.JWT_PUBLIC_KEY, algorithms=settings.JWT_ALGORITHM)
		type = payload.get('typ')
		if type is None or type != 'Refresh':
			response = Response({"detail" : "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
		exp_access = datetime.datetime.now(datetime.timezone.utc) + settings.JWT_ACCESS_TOKEN_LIFETIME
		user_id = payload.get('user_id')
		if user_id is None:
			response = Response({"detail" : "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
		# store new session id in cache
		sess_id = cache.store_access_session(user_id=user_id, exp=exp_access)
		payload = {
			'user_id' : str(user_id),
			'exp' : exp_access,
			'iat' : datetime.datetime.now(datetime.timezone.utc),
			'typ' : 'Bearer',
			'session_state' : sess_id
		}
		access = jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
		response = Response({"access_token" : access})
	except jwt.ExpiredSignatureError:
		response = Response({"detail" : "Refresh token expired."}, status=status.HTTP_400_BAD_REQUEST)
	except jwt.InvalidTokenError:
		response = Response({"detail" : "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
	return response


def GenerateTokenPair(user_id):

	"""
		Generate a fresh token pair (refresh and access tokens) for user_id
	"""
	cache = _AuthCache
	exp_refresh = datetime.datetime.now(datetime.timezone.utc) + settings.JWT_REFRESH_TOKEN_LIFETIME
	exp_access = datetime.datetime.now(datetime.timezone.utc) + settings.JWT_ACCESS_TOKEN_LIFETIME
	# generate session id and store in cache
	sess_id = cache.store_access_session(user_id=user_id, exp=exp_access)
	payload = {
		'user_id' : str(user_id),
		'exp' : exp_access,
		'iat' : datetime.datetime.now(datetime.timezone.utc),
		'typ' : 'Bearer',
		'session_state' : sess_id
	}
	access = jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
	payload['exp'] = exp_refresh
	payload['typ'] = 'Refresh'
	del payload["session_state"]
	refresh = jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
	res = {
		"access" : access,
		"refresh" : refresh,
		"exp_refresh" : exp_refresh
	}
	return res
	
def ValidateToken(token, token_type) -> bool:
	try:
		payload = jwt.decode(token, settings.JWT_PUBLIC_KEY, algorithms=settings.JWT_ALGORITHM)
		type = payload.get('typ')
		if type is None or type != token_type:
			return False
	except jwt.ExpiredSignatureError:
		return False
	except jwt.InvalidTokenError:
		return False
	return True
	
import pyotp, json

class AuthCache:
	"""
		Class for managing user auth in auth-redis
		Features :
			- single device login by tracking refresh token of the user by username
			- handling 2fa logging for storing verification code for a short time during the demand
	"""
	redis = None
	logger = _logger

	def __init__(self):
		self.redis = Redis(host="auth-redis", decode_responses=True, db=0)

	#AUTH
	def store_token(self, username: str, token: str, exp):
		now = datetime.datetime.now(datetime.timezone.utc)
		ttl = exp - now
		ttl_seconds = int(ttl.total_seconds())
		if ttl_seconds > 0:
			self.redis.setex(f"auth:{username}:refresh", ttl_seconds, token)
		else:
			raise Exception("token already expired")
	
	def get_user_token(self, username: str):
		value = self.redis.get(f"auth:{username}:refresh")
		if value is None:
			raise Exception(f"token for {username} not found")
		return value
	
	def blacklist_token(self, token: str, username: str):
		payload = jwt.decode(token, options={"verify_signature" : False})
		exp = datetime.datetime.fromtimestamp(payload["exp"], tz=datetime.timezone.utc)
		now = datetime.datetime.now(datetime.timezone.utc)
		ttl = exp - now
		ttl_seconds = int(ttl.total_seconds())
		if ttl_seconds > 0:
			res = self.redis.delete(f"auth:{username}:refresh")
			self.redis.setex(token, ttl_seconds, "blacklisted")
			self.logger.log(Logger.DEBUG, message=f"deleted key {username} with return status : {res}")
			self.logger.log(Logger.DEBUG, message=f"black listed token for {username}")
		else:
			raise Exception("token already expired")
	
	def BlacklistUserToken(self, username: str):
		token = self.get_user_token(username)
		self.blacklist_token(token, username)

	def isUserLogged(self, username) -> bool:
		try:
			self.get_user_token(username)
			return True
		except:
			return False

	def isTokenBlacklisted(self, token: str) -> bool:
		value = self.redis.get(token)
		if value is not None:
			return True
		return False

	#2FA
	def didUserRequest(self, username: str) -> bool:
		value = self.redis.get(f"execution:{username}")
		return True if value is not None else False
	
	def set_2fa_execution(self, username):
		secret = pyotp.random_base32()
		self.redis.setex(f"execution:{username}", value=secret, time=120)
		return secret

	def get_2fa_execution(self, username):
		value = self.redis.get(f"execution:{username}")
		return value

	def delete_2fa_execution(self, username):
		return self.redis.delete(f"execution:{username}")	
	
	def execution_2fa_action(self, username, action):
		actions = {
            'set': self.set_2fa_execution,
            'get': self.get_2fa_execution,
            'delete': self.delete_2fa_execution
        }
		if action in actions:
			return actions[action](username)
		else:
			raise Exception("invalid action")
	
	def store_access_session(self, user_id: str, exp):
		sess_id = uuid.uuid4().__str__()
		now = datetime.datetime.now(datetime.timezone.utc)
		ttl = exp - now
		ttl_seconds = int(ttl.total_seconds())
		self.redis.setex(f"auth:{user_id}:access", value=sess_id, time=ttl_seconds)
		return sess_id
	
	def remove_access_session(self, user_id: str):
		self.redis.delete(f"auth:{user_id}:access")
	
	def get_access_session(self, user_id):
		value = self.redis.get(f"auth:{user_id}:access")
		return value
	def delete_access_session(self, user_id):
		value = self.redis.delete(f"auth:{user_id}:access")
		return value
	# reset password utils
	def store_reset_code(self, email : str):
		totp = pyotp.TOTP(pyotp.random_base32())
		code = totp.now()
		self.redis.setex(f"auth:reset:{email}", value=code, time=300)
		return code
	
	def get_reset_code(self, email: str) :
		value = self.redis.get(f"auth:reset:{email}")
		return value

	def delete_reset_code(self, email: str):
		self.redis.delete(f"auth:reset:{email}")

	def reset_code_action(self, email: str, action: str):
		actions = {
            'set': self.store_reset_code,
            'get': self.get_reset_code,
            'delete': self.delete_reset_code
        }
		if action in actions.keys():
			return actions[action](email)
		else:
			raise Exception("invalid action")
	# enable 2fa
	def store_2fa(self, username: str) -> str:
		secret = pyotp.random_base32()
		self.redis.setex(f"2fa:{username}", time=60, value=secret)
		return secret

	def get_2fa(self, username: str) -> None:
		secret = self.redis.get(f"2fa:{username}")
		return secret if secret else None

	def delete_2fa(self, username: str) -> None:
		self.redis.delete(f"2fa:{username}")

	def enable_2fa_action(self, action: str, username: str):
		actions = {
            'set': self.store_2fa,
            'get': self.get_2fa,
            'delete': self.delete_2fa
        }
		if action in actions.keys():
			return actions[action](username)
		else:
			raise Exception("invalid action")

_AuthCache = AuthCache()
