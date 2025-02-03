from rest_framework.views import APIView
from socket import gethostbyname
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .jwtMiddleware import JWTAuthentication
from .utils import _Cache
from rest_framework.serializers import Serializer
from rest_framework.permissions import AllowAny
from asgiref.sync import async_to_sync
import httpx

USER_INFO = "http://auth-service/auth/api_users/"

class GetUserData(APIView):
    """
        TODO : 
            - get user data from cache along with his presence status
            - if not in cache try fetch from the auth service async
    """
    cache = _Cache
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    async def fetch_user_data(self, user_id):
        try:
            timeout = httpx.Timeout(5.0, read=5.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(f"{USER_INFO}{user_id}/")
                response.raise_for_status()
                self.cache.set_user_data(user_id, data=response.json())
                return response.json()
        except:
            return None

    @async_to_sync
    async def get(self, request: Request, *args, **kwargs):
        user_id = request.user.id
        # user_data = self.cache.get_user_data(user_id=user_id)
        # if user_data is not None:
        #     return Response(data=user_data)
        user_data = await self.fetch_user_data(user_id)
        if user_data is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        print(user_data)
        return Response(user_data)
        self.cache.set_user_data(user_id=user_data["id"], data=user_data)
        return Response(self.cache.get_user_data(user_data["id"]))


class Debug(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        print("args : ")
        print(args)
        print("kwagrs : ")
        print(kwargs)
        return Response(data="Hi")