import jwt
from django.conf import settings
import datetime
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from redis import Redis
import random


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
	try:
		payload = jwt.decode(refresh, settings.JWT_PUBLIC_KEY, algorithms=settings.JWT_ALGORITHM)
		type = payload.get('typ')
		if type is None or type != 'Refresh':
			response = Response({"detail" : "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
		exp_access = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=5)
		user_id = payload.get('user_id')
		if user_id is None:
			response = Response({"detail" : "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
		payload = {
			'user_id' : str(user_id),
			'exp' : exp_access,
			'iat' : datetime.datetime.now(datetime.timezone.utc),
			'typ' : 'Bearer'
		}
		access = jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
		response = Response({"acess_token" : access})
	except jwt.ExpiredSignatureError:
		response = Response({"detail" : "Refresh token expired."}, status=status.HTTP_400_BAD_REQUEST)
	except jwt.InvalidTokenError:
		response = Response({"detail" : "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)
	return response


def GenerateTokenPair(user_id):
	exp_refresh = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)
	exp_access = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=5)

	payload = {
		'user_id' : str(user_id),
		'exp' : exp_access,
		'iat' : datetime.datetime.now(datetime.timezone.utc),
		'typ' : 'Bearer'
	}
	access = jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
	payload['exp'] = exp_refresh
	payload['typ'] = 'Refresh'
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
	
import pyotp

class AuthCache:
	redis = None
	logger = _logger

	def __init__(self):
		self.redis = Redis(host="redis-cache1", port=6380, decode_responses=True, db=0)


	#AUTH
	def store_token(self, username: str, token: str, exp):
		now = datetime.datetime.now(datetime.timezone.utc)
		ttl = exp - now
		ttl_seconds = int(ttl.total_seconds())
		if ttl_seconds > 0:
			self.redis.setex(f"auth:{username}", ttl_seconds, token)
		else:
			raise Exception("token already expired")
	
	
	def get_user_token(self, username: str):
		value = self.redis.get(f"auth:{username}")
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
			res = self.redis.delete(f"auth:{username}")
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

_AuthCache = AuthCache()
