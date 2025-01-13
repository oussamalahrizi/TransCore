from redis import Redis

class Cache:
	redis = None

	def __init__(self):
		self.redis = Redis(host="api-redis", port=6380, decode_responses=True, db=0)


	# #AUTH
	# def store_token(self, username: str, token: str, exp):
	# 	now = datetime.datetime.now(datetime.timezone.utc)
	# 	ttl = exp - now
	# 	ttl_seconds = int(ttl.total_seconds())
	# 	if ttl_seconds > 0:
	# 		self.redis.setex(f"auth:{username}", ttl_seconds, token)
	# 	else:
	# 		raise Exception("token already expired")
	
	
	# def get_user_token(self, username: str):
	# 	value = self.redis.get(f"auth:{username}")
	# 	if value is None:
	# 		raise Exception(f"token for {username} not found")
	# 	return value

	def set_user_online(self, username : str):
		self.redis.set(username, "online")
	
	def get_user_status(self, username : str):
		value = self.redis.get(username)
		if value is None:
			raise ValueError("user is not in cache")
		return value
	def set_user_offline(self, username : str):
		try:
			user = self.get_user_status(username)
			if user:
				self.redis.delete(username)
		except:
			pass

_Cache = Cache()
