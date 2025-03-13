from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from socket import gethostbyname
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .jwtMiddleware import JWTAuthentication
from .utils import _Cache
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from asgiref.sync import async_to_sync
from .jwtMiddleware import ProxyUser
from .models import Notification
import httpx


USER_INFO = "http://auth-service/api/auth/api_user_id/"



async def fetch_user_auth(user_id : str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f'{USER_INFO}/{user_id}/')
            response.raise_for_status()
            data = await response.json()
            return data
    except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError):
        raise Exception("Failed to get User from Auth service")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise Exception("Failed to get User from Auth service")
    except:
        raise("Internal Server Error")



class GetUserService(APIView):
    """
        TODO : 
            - get user data from cache along with his presence status
            - if not in cache try fetch from the auth service async
    """
    cache = _Cache
    permission_classes = []
    authentication_classes = []

    def get(self, request: Request, *args, **kwargs):
        id = kwargs.get('id')
        user = self.cache.get_user_data(id)
        if user:
            return Response(data=user)
        user_data = async_to_sync(fetch_user_auth)(id)
        self.cache.set_user_data(id, user_data, "auth")
        return Response(self.cache.get_user_data(id))
        

class GetUserData(APIView):
    """
        TODO : 
            - get user data from cache along with his presence status
            - if not in cache try fetch from the auth service async
    """
    cache = _Cache
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request: Request, *args, **kwargs):
        current :ProxyUser = request.user
        id = current.id
        user = self.cache.get_user_data(id)
        return Response(data=user)

class NotifcationDetail(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["message", "created_at"]

import uuid

class GetNotification(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request: Request, *args, **kwargs):
        user : ProxyUser = request.user
        id = uuid.UUID(user.id)
        notif = Notification.objects.filter(user=id).all().order_by("created_at").last()
        serializer = NotifcationDetail(instance=notif)
        return Response(data=serializer.data)

