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

USER_INFO = "http://auth-service/auth/api_users/"

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
        return Response(data=user)

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

