import httpx
import jwt
from django.contrib.auth import get_user_model
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from channels.exceptions import DenyConnection
from channels.db import database_sync_to_async
import uuid
import logging
from django.contrib.auth.models import User
from .models import Profile 

logger = logging.getLogger(__name__)

JWK_URL = "http://auth-service/api/auth/jwk/"
AUTH_USER = "http://auth-service/api/auth/internal/userid/"

class JWTMiddleware(BaseMiddleware):
    """
    Custom JWT middleware that accepts JWTs and authenticates users.
    """

    async def __call__(self, scope, receive, send):
        try:
            query_string = scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token = query_params.get("token")

            if not token:
                logger.error("Missing token in query")
                raise DenyConnection("Missing token in query")
            token = token[0]

            logger.info(f"Token received: {token}")

            # Fetch JWK data (public key) for token verification
            jwk_data = await self.get_jwk_data()
            if not jwk_data:
                logger.error("Unable to retrieve JWK from Auth Service")
                raise DenyConnection("Unable to retrieve JWK from Auth Service")

            public_key = jwk_data.get("public_key")
            algorithm = jwk_data.get("algorithm")
            if not public_key or not algorithm:
                logger.error("Invalid JWK data")
                raise DenyConnection("Invalid JWK data")

            # Verify the JWT token using the public key
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

            # user = await self.get_or_create_user(user_id)
            user = await self.get_user_data(user_id)
            scope["user"] = user

            """
                add to scope receipent data from auth service, 
                just call getuser_datausername : http://auth-service/api/auth/internal/username/<username>/

                scope["other"] = other_data

                get the relation between them, swli fia ngolik wach salit

            """

        except DenyConnection as e:
            logger.error(f"Connection denied: {e}")
            scope["error_message"] = str(e)

        return await super().__call__(scope, receive, send)

    # @database_sync_to_async
    # def get_or_create_user(self, user_id):
    #     """
    #     Fetch or create a user using the provided user_id (UUID).
    #     """
    #     try:
    #         try:
    #             user_uuid = uuid.UUID(user_id)
    #             logger.info(f"Converted user_id to UUID: {user_uuid}")
    #         except ValueError:
    #             logger.error(f"Invalid UUID format: {user_id}")
    #             raise DenyConnection("Invalid UUID format")

    #         profile = Profile.objects.filter(uuid=user_uuid).first()

    #         if profile:
    #             logger.info(f"User found: {profile.user}")
    #             return profile.user
    #         else:
    #             logger.info("User not found. Creating new user.")

    #             user = User.objects.create(username=f"user_{user_uuid}")
    #             profile = Profile.objects.create(user=user, uuid=user_uuid)
    #             logger.info(f"Created new user: {user.username}")
    #             return user

    #     except Exception as e:
    #         logger.error(f"Error fetching or creating user: {e}")
    #         return None

    async def get_jwk_data(self):
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
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError, httpx.HTTPStatusError):
            logger.error("Failed to fetch JWK data from Auth Service")
            return None
    

    async def get_user_data(self, user_id : str):
        """
        Retrieve the JWK (public key + algorithm) from the Auth Service.
        Handles timeouts/unreachable hosts. Returns None on error.
        """
        try:
            timeout = httpx.Timeout(5.0, read=5.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
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
