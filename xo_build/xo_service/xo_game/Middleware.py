import jwt
import httpx
from channels.middleware import BaseMiddleware
from channels.exceptions import DenyConnection
from urllib.parse import parse_qs


JWK_URL = "http://auth-service/api/auth/jwk/"
USERINFO_URL = "http://api-service/api/main/user/"

CHECK_GAME_URL = 'http://match-service/api/match/check_game/'

class jwtMiddleware(BaseMiddleware):
    async def __call__(self, scope : dict, receive, send):
        try:

            # /ws/pong/?token=123&game_id=456
            query_string = scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token = query_params.get("token")

            
            if (scope['path'] == '/api/game/tictac/ws/local'):
                
                if not token:
                    raise DenyConnection("Missing token in query")
                
                token = token[0]
                
                jwk_data = await self.fetch_jwk_data()
                if not jwk_data:
                    raise DenyConnection("Unable to retrieve JWK from Auth Service")
                
                public_key = jwk_data.get("public_key")
                algorithm = jwk_data.get("algorithm")

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
                user_id = payload.get("user_id")

                user_info = await self.fetch_user_info(user_id)

                scope["user"] = user_info

                await super().__call__(scope, receive, send)
                return


            game_id = query_params.get("game_id")

            if not game_id:
                raise DenyConnection("Missing Game ID in query")
            game_id = game_id[0]

            if not token:
                raise DenyConnection("Missing token in query")
            token = token[0]


            jwk_data = await self.fetch_jwk_data()
            if not jwk_data:
                raise DenyConnection("Unable to retrieve JWK from Auth Service")

            public_key = jwk_data.get("public_key")
            algorithm = jwk_data.get("algorithm")
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
            user_id = payload.get("user_id")

            user_info = await self.fetch_user_info(user_id)
            
            # game_info = await self.check_game_id(game_id, user_id)
            # scope["game_info"] = game_info["game_info"]
            scope["user"] = user_info
            scope['game_id'] = game_id
            """
                url from scope
                {
                    'single' : url,
                    'multi' : url
                }
                if game type in game info doesnt match the requested url raise deny connection with a message
                saying wron consumer
            """
        
        except DenyConnection as e:
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
                user_info = response.json()
                return user_info
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError):
            raise DenyConnection("Failed to get User Info from API Service")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == httpx.codes.NOT_FOUND:
                raise DenyConnection("User Not found")
            raise DenyConnection("Internal Server Error")
        except:
            raise DenyConnection("Internal Server Error")


    async def check_game_id(self, game_id: str, user_id: str):
        try:
            async with httpx.AsyncClient() as client:
                post_data = {
                    'game_id' : game_id,
                    'user_id' : user_id,
                    'game_type' : 'tic'
                }
                response = await client.post(CHECK_GAME_URL, json=post_data)
                response.raise_for_status()
                return response.json()
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError) as e:
            raise DenyConnection("Failed to get Game info From Match Making Service")
        except httpx.HTTPStatusError as e:
            if e.response.status_code in range(400, 500):
                error = e.response.json()
                raise DenyConnection("Internal Server Error", error)
            raise DenyConnection("Internal Server Error")
        except:
            raise DenyConnection("Internal Server Error")
            