import jwt
import httpx
from django.core.cache import cache
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from api_core.utils import _Cache
from channels.exceptions import DenyConnection
from pprint import pprint

JWK_URL = "http://auth-service/api/auth/jwk/"
USERINFO_URL = "http://auth-service/api/auth/internal/userid/"
USERFRIENDS_URL = "http://auth-service/api/auth/internal/friends/"

class jwtmiddleware(BaseMiddleware):
    """
    Custom JWT middleware for Django Channels.
    """
    cache = _Cache
    async def __call__(self, scope, receive, send):
        try:
            query_string = scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token = query_params.get("token")

            if not token:
                raise DenyConnection("Missing token in query")
            token = token[0]
            # Fetch public key & algorithm from JWK endpoint
            jwk_data = await self.fetch_jwk_data()
            if not jwk_data:
                raise DenyConnection("Unable to retrieve JWK from Auth Service")

            public_key = jwk_data.get("public_key")
            algorithm = jwk_data.get("algorithm")
            # Decode JWT
            try:
                payload = jwt.decode(token, key=public_key, algorithms=algorithm)
                type = payload["typ"]
                if type is None or type != "Bearer":
                    raise jwt.InvalidTokenError()
            except jwt.ExpiredSignatureError:
                raise DenyConnection("Token expired")
            except jwt.InvalidSignatureError:
                raise DenyConnection("Invalid signature token")
            except jwt.InvalidTokenError:
                raise DenyConnection("Invalid token")
            # Extract user ID
            user_id = payload.get("user_id")

            # Fetch user info
            user_info = await self.fetch_user_info(user_id)
            if not user_info:
                raise DenyConnection("Unable to fetch user info from Auth Service")

            # Attach user info to scope
            scope["user"] = user_info

        except DenyConnection as e:
            scope["error_message"] = str(e)

        # Continue with the connection
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
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError, httpx.HTTPStatusError):
            return None
        

    async def fetch_user_info(self, user_id: str):
        """
        Retrieve user info from the Auth Service asynchronously,
        handling timeouts/unreachable hosts. Returns None on error.
        """
        try:
            timeout = httpx.Timeout(5.0, read=5.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(f"{USERINFO_URL}{user_id}/")
                response.raise_for_status()
                data = response.json()
                return data
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError):
            return None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == httpx.codes.NOT_FOUND:
                raise DenyConnection("User Not found")
            return None