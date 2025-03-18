import jwt
import httpx
import logging
from channels.middleware import BaseMiddleware
from channels.exceptions import DenyConnection
from urllib.parse import parse_qs

logger = logging.getLogger(__name__)

# URLs 
JWK_URL = "http://auth-service/api/auth/jwk/"
USERINFO_URL = "http://api-service/api/main/user/"
USER_BY_USERNAME_URL = "http://api-service/api/main/user/username/"

class JWTMiddleware(BaseMiddleware):
    async def __call__(self, scope: dict, receive, send):
        try:
            query_string = scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token = query_params.get("token")

            if not token:
                raise DenyConnection("Missing token in query")
            token = token[0]

            jwk_data = await self.fetch_jwk_data()
            if not jwk_data:
                raise DenyConnection("Unable to retrieve JWK from Auth Service")

            public_key = jwk_data.get("public_key")
            algorithm = jwk_data.get("algorithm")
            if not public_key or not algorithm:
                raise DenyConnection("Invalid JWK data format")

            try:
                payload = jwt.decode(token, key=public_key, algorithms=[algorithm])
                if payload.get("typ") != "Bearer":
                    raise jwt.InvalidTokenError("Invalid token type")
            except jwt.ExpiredSignatureError:
                raise DenyConnection("Token expired")
            except jwt.InvalidTokenError as e:
                raise DenyConnection(f"Invalid token: {e}")

            user_id = payload.get("user_id")
            if not user_id:
                raise DenyConnection("Missing user_id in token payload")

            user_info = await self.fetch_user_info(user_id)
            if not user_info:
                raise DenyConnection("Failed to fetch authenticated user info")

            scope["user"] = user_info

        except DenyConnection as e:
            logger.error(f"Connection denied: {e}")
            scope["error_message"] = str(e)

        return await super().__call__(scope, receive, send)

  

    async def fetch_jwk_data(self):
        """
        Retrieve the JWK (public key + algorithm) from the Auth Service.
        Handles timeouts/unreachable hosts. Returns None on error.
        """
        try:
            timeout = httpx.Timeout(5.0, read=5.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(JWK_URL)
                response.raise_for_status()
                return response.json()
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError) as e:
            logger.error(f"Failed to fetch JWK data: {e}")
            return None

    async def fetch_user_info(self, user_id: str):
        """
        Retrieve user info from the Auth Service asynchronously.
        Handles timeouts/unreachable hosts. Returns None on error.
        """
        try:
            timeout = httpx.Timeout(5.0, read=5.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(f"{USERINFO_URL}{user_id}/")
                response.raise_for_status()
                user_info = response.json()

                if "id" not in user_info:
                    user_info["id"] = user_id  

                return user_info
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError) as e:
            logger.error(f"Failed to fetch user info: {e}")
            return None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == httpx.codes.NOT_FOUND:
                logger.error(f"User not found: {user_id}")
            else:
                logger.error(f"HTTP error fetching user info: {e}")
            return None

    async def fetch_user_by_username(self, username: str):
        """
        Retrieve user info by username from the Auth Service asynchronously.
        Handles timeouts/unreachable hosts. Returns None on error.
        """
        try:
            timeout = httpx.Timeout(5.0, read=5.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(f"{USER_BY_USERNAME_URL}{username}/")
                response.raise_for_status()
                return response.json()
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError) as e:
            logger.error(f"Failed to fetch user by username: {e}")
            return None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == httpx.codes.NOT_FOUND:
                logger.error(f"User not found: {username}")
            else:
                logger.error(f"HTTP error fetching user by username: {e}")
            return None