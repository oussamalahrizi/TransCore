from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .utils import Queue
from .Middleware import ProxyUser
import httpx
from asgiref.sync import async_to_sync

API_DATA = "http://api-service/api/main/user/"

class APIException(Exception):

    def __init__(self, *args, code=500, detail : str):
        self.code = code
        self.detail = detail
        super().__init__(*args)

class FindMatchPong(APIView):

    permission_classes = [IsAuthenticated]
    cache = Queue
    
    @async_to_sync
    async def get_status(self, user_id : str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{API_DATA}{user_id}/")
                response.raise_for_status()
                data = response.json()
                return data
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError):
            raise APIException(code=500, detail="Failed to reach API Service")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            detail = await response.json()
            raise APIException(code=e.response.status_code, detail=detail)
        except Exception as e:
            raise APIException(detail='Internal Server Error')

    def get(self, request : Request, *args, **kwargs):
        current_user = {'id' : request.user.id}
        try:
            user_data = self.get_status(user_id=current_user["id"])
            if not user_data:
                return Response(status=status.HTTP_404_NOT_FOUND,
                                data={"detail" : "User Not Found."})
            if user_data["status"] != "online":
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : f'It appears that you are {user_data["status"]}'})
            self.cache.store_player(current_user['id'], "pong")
            return Response(data={"detail" : "We are looking for a match."})
            
        except APIException as e:
            return Response(status=e.code, data={"detail" : e.detail})
        