
from .models import User, Friends

from rest_framework import status
from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from .permissions import IsAllowedHost
from django.shortcuts import get_object_or_404
from django.http.response import Http404
import uuid
from .serializers import AuthProviderSerializer, UserDetailSerializer
from rest_framework.generics import RetrieveAPIView
from rest_framework.exceptions import PermissionDenied

class GetUserServiceID(RetrieveAPIView):
    """
    View to get user info based on id from other services.
    """
    class UserDetail(serializers.ModelSerializer):
        auth_provider = AuthProviderSerializer(many=True)
        class Meta:
            model = User
            fields =  ["auth_provider", 'id', 'username', 'email', "is_active", 'icon_url']

    serializer_class = UserDetail
    queryset = User.objects.all()
    lookup_field = 'id'
    permission_classes = [IsAllowedHost]
    authentication_classes = []

    def permission_denied(self, request, message=None, code=None):
        raise PermissionDenied(detail="Host not allowed.")
    
    
class GetUserServiceName(RetrieveAPIView):
    """
    View to get user info based on id from other services.
    """
    serializer_class = UserDetailSerializer
    queryset = User.objects.all()
    lookup_field = 'username'
    permission_classes = [IsAllowedHost]
    authentication_classes = []
    
    def permission_denied(self, request, message=None, code=None):
        raise PermissionDenied(detail="Host not allowed.")

class GetFriendsAPI(APIView):
    serializer = UserDetailSerializer
    permission_classes = [IsAllowedHost]
    authentication_classes = []
    
    def get(self, request : Request, *args, **kwargs):
        try:
            id = kwargs.get("id")
            if not id:
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : "missing id in url request"})
            id = uuid.UUID(kwargs.get("id"))
            user : User = get_object_or_404(User, id=id)
            friends = Friends.objects.get_friends(user)
            objects = User.objects.filter(id__in=friends)
            ser = self.serializer(objects, many=True)
            return Response(data=ser.data)
        except Http404:
            return Response(data={"detail" : 'User Not Found'})
    
    def permission_denied(self, request, message=None, code=None):
        raise PermissionDenied(detail="Host not allowed.")


class GetRelation(APIView):

    permission_classes = [IsAllowedHost]
    authentication_classes = []

    def get_relation(self, user, other):
        try:
            relation = Friends.objects.filter(from_user=user, to_user=other).get()
            return relation
        except Friends.DoesNotExist:
            try:
                relation = Friends.objects.filter(from_user=other, to_user=user).get()
                return relation
            except Friends.DoesNotExist:
                return None

    def get(self, request : Request, *args, **kwargs):
        try:
            current = request.query_params.get("user1")
            other = request.query_params.get("user2")
            current = get_object_or_404(User, username=current)
            other = get_object_or_404(User, username=other)
            relation : Friends = self.get_relation(current, other)
            if not relation or relation.status != "accepted" :
                return Response(status=status.HTTP_404_NOT_FOUND,
                                data={"detail" : "User are not friends."})
            return Response(data={"detail" : "User are friends."})
        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND,
                            data={"detail" : f"User Not Found.{kwargs.get("username")}"})

    def permission_denied(self, request, message=None, code=None):
        raise PermissionDenied(detail="Host not allowed.")

from pprint import pprint

class GetBlockedAPI(APIView):
    serializer = UserDetailSerializer
    permission_classes = [IsAllowedHost]
    authentication_classes = []

    def get(self, request : Request, *args, **kwargs):
        try:
            id = kwargs.get("id")
            if not id:
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : "missing id in url request"})
            id = uuid.UUID(kwargs.get("id"))
            user : User = get_object_or_404(User, id=id)
            blocked = Friends.objects.get_blocked_users(user)
            objects = User.objects.filter(id__in=blocked)
            ser = UserDetailSerializer(objects, many=True)
            return Response(data=ser.data)
        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND,
                            data={"detail" : "User Not Found"})

    def permission_denied(self, request, message=None, code=None):
        raise PermissionDenied(detail="Host not allowed.")