from django.contrib.auth import get_user_model
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from channels.exceptions import DenyConnection
import jwt
from channels.db import database_sync_to_async
import uuid
import logging
from django.contrib.auth.models import User
from .models import Profile  
import uuid
import logging

logger = logging.getLogger(__name__)

class JWTMiddleware(BaseMiddleware):
    """
    Custom JWT middleware that accepts JWTs and authenticates users.
    """

    async def __call__(self, scope, receive, send):
        try:
            # Extract token from query string
            query_string = scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token = query_params.get("token")

            if not token:
                logger.error("Missing token in query")
                raise DenyConnection("Missing token in query")
            token = token[0]

            logger.info(f"Token received: {token}")

            try:
                # Decode the token (without verifying the signature)
                payload = jwt.decode(token, options={"verify_signature": False})
                logger.info(f"Token payload: {payload}")

                # Validate token type
                if payload.get("typ") != "Bearer":
                    logger.error("Invalid token type")
                    raise jwt.InvalidTokenError("Invalid token type")
            except jwt.ExpiredSignatureError:
                logger.error("Token expired")
                raise DenyConnection("Token expired")
            except jwt.InvalidTokenError as e:
                logger.error(f"Invalid token: {e}")
                raise DenyConnection("Invalid token")

            # Extract user info
            user_id = payload.get("user_id")
            if not user_id:
                logger.error("Missing user_id in token payload")
                raise DenyConnection("Invalid payload structure")

            # Fetch or create user using user_id
            user = await self.get_or_create_user(user_id)
            if user is None:
                logger.error("User not found")
                raise DenyConnection("User not found")

            # Add user to the scope
            scope["user"] = user

        except DenyConnection as e:
            logger.error(f"Connection denied: {e}")
            scope["error_message"] = str(e)

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_or_create_user(self, user_id):
        """
        Fetch or create a user using the provided user_id (UUID).
        """
        try:
            # Convert the user_id (UUID string) to a UUID object
            try:
                user_uuid = uuid.UUID(user_id)
                logger.info(f"Converted user_id to UUID: {user_uuid}")
            except ValueError:
                logger.error(f"Invalid UUID format: {user_id}")
                raise DenyConnection("Invalid UUID format")

            # Check if a Profile exists for the user
            profile = Profile.objects.filter(uuid=user_uuid).first()

            if profile:
                logger.info(f"User found: {profile.user}")
                return profile.user
            else:
                logger.info("User not found. Creating new user.")

                # Create a new user and profile
                user = User.objects.create(username=f"user_{user_uuid}")
                profile = Profile.objects.create(user=user, uuid=user_uuid)
                logger.info(f"Created new user: {user.username}")
                return user

        except Exception as e:
            logger.error(f"Error fetching or creating user: {e}")
            return None

