import httpx
import jwt
from django.contrib.auth import get_user_model
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from channels.exceptions import DenyConnection
import logging

logger = logging.getLogger(__name__)

JWK_URL = "http://auth-service/api/auth/jwk/"
AUTH_USER = "http://auth-service/api/auth/internal/userid"
AUTH_USERNAME = "http://auth-service/api/auth/internal/username" 

class JWTMiddleware(BaseMiddleware):
    """
    Custom JWT middleware that accepts JWTs and authenticates users.
    """

    async def __call__(self, scope, receive, send):
        try:
            
            query_string = scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token_list = query_params.get("token")

            if not token_list or not token_list[0]:
                logger.error("Missing token in query")
                raise DenyConnection("Missing token in query")

            token = token_list[0]
            logger.info(f"Token received: {token}")

            # Fetch JWK data (public key) for token verification
            jwk_data = await self.get_jwk_data()
            if not jwk_data or not isinstance(jwk_data, dict):
                logger.error("Invalid JWK response")
                raise DenyConnection("Unable to retrieve JWK from Auth Service")

            public_key = jwk_data.get("public_key")
            algorithm = jwk_data.get("algorithm")
            if not public_key or not algorithm:
                logger.error("Invalid JWK data format")
                raise DenyConnection("Invalid JWK data")

            # Verify the JWT token
            try:
                payload = jwt.decode(token, key=public_key, algorithms=[algorithm])
                logger.info(f"Token payload: {payload}")

                if payload.get("typ") != "Bearer":
                    logger.error("Invalid token type")
                    raise jwt.InvalidTokenError("Invalid token type")
            except jwt.ExpiredSignatureError:
                logger.error("Token expired")
                raise DenyConnection("Token expired")
            except jwt.InvalidTokenError as e:
                logger.error(f"Invalid token: {e}")
                raise DenyConnection("Invalid token")

            user_id = payload.get("user_id")
            if not user_id:
                logger.error("Missing user_id in token payload")
                raise DenyConnection("Invalid payload structure")

            # Retrieve user data
            user_data = await self.get_user_data(user_id)
            scope["user"] = user_data  # Store user info in scope

            # Fetch additional data for recipient
            username = user_data.get("username")
            if username:
                recipient_data = await self.get_user_data_by_username(username)
                scope["other"] = recipient_data  # Store additional data in scope

        except DenyConnection as e:
            logger.error(f"Connection denied: {e}")
            scope["error_message"] = str(e)

        return await super().__call__(scope, receive, send)

    async def get_jwk_data(self):
        """
        Retrieve the JWK (public key + algorithm) from the Auth Service.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(JWK_URL)
                response.raise_for_status()
                return response.json()
        except (httpx.HTTPError, httpx.TimeoutException) as e:
            logger.error(f"Failed to fetch JWK data: {e}")
            return None

    async def get_user_data(self, user_id: str):
        """
        Retrieve user data from the Auth Service.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{AUTH_USER}/{user_id}/")
                response.raise_for_status()
                return response.json()
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError):
            raise DenyConnection("Failed to get User Info from API Service")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == httpx.codes.NOT_FOUND:
                raise DenyConnection("User Not found")
            raise DenyConnection("Internal Server Error")
        except:
            raise DenyConnection("Internal Server Error")

    async def get_user_data_by_username(self, username: str):
        """
        Retrieve recipient data using username.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{AUTH_USERNAME}/{username}/")
                response.raise_for_status()
                return response.json()
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError):
            raise DenyConnection("Failed to get User Info from API Service")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == httpx.codes.NOT_FOUND:
                raise DenyConnection("User Not found")
            raise DenyConnection("Internal Server Error")
        except:
            raise DenyConnection("Internal Server Error")
