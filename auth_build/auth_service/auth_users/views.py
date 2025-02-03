# Create your views here.

from .models import User, Friends
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView, ListAPIView, UpdateAPIView
from .serializers import (
    UserDetailSerializer,
    UpdateUserSerializer,
    UpdatePasswordSerializer)
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, BasePermission
from .permissions import IsAllowedHost, IsSameUser
from rest_framework.request import Request
from django.shortcuts import get_object_or_404
from django.http import Http404
from rest_framework import serializers


class UpdateUserInfo(UpdateAPIView):
    serializer_class = UpdateUserSerializer
    queryset = User.objects.all()
    lookup_field = 'username'
    http_method_names = ['patch']
    permission_classes = [IsSameUser]
    
    def patch(self, request, *agrs, **kwargs):
        if not request.data:
            return Response({"detail" : "empty request data"},
                            status.HTTP_400_BAD_REQUEST)
        partial = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        # check additional fields in the request data
        for key in request.data.keys():
            if key not in serializer.get_fields():
                return Response({"detail" : "ivalid key provided"},
                    status=status.HTTP_400_BAD_REQUEST)
        # check serializer validation and perform the update
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # just copied it from original function, ignore it 
        ###################
        if getattr(instance, '_prefetched_objects_cache', None):
             # If 'prefetch_related' has been applied to a queryset, we need to
             # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}
        ###################
        response = {
            "detail" : "update successful",
            "updated_fields" : request.data.keys()
        }
        return Response(response)


class UpdatePassword(UpdateAPIView):
    permission_classes = [IsSameUser]
    queryset = User.objects.all()
    lookup_field = 'username'
    http_method_names = ['patch']
    serializer_class = UpdatePasswordSerializer
    
    def patch(self, request, *args, **kwargs):
        if not request.data:
            return Response({"detail" : "empty request data"},
                            status.HTTP_400_BAD_REQUEST)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer=serializer)
        return Response(status=status.HTTP_202_ACCEPTED,
                        data={"detail" : "Sucessfully updated the password"})
        

class GetUser(RetrieveAPIView):
    serializer_class = UserDetailSerializer
    queryset = User.objects.all()
    lookup_field = 'username'
    permission_classes = [IsAuthenticated]

class GetMyInfo(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, *args, **kwargs):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

class GetUserService(RetrieveAPIView):
    """
    View to get user info based on id from other services.
    """
    serializer_class = UserDetailSerializer
    queryset = User.objects.all()
    lookup_field = 'id'
    permission_classes = [IsAllowedHost]
    authentication_classes = []
    
    def permission_denied(self, request, message=None, code=None):
        raise PermissionDenied(detail="Host not allowed.")

class ListUsers(ListAPIView):
    serializer_class = UserDetailSerializer
    queryset = User.objects.all()
    authentication_classes = []

class GetFriends(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request : Request, *args, **kwargs):
        user : User = request.user
        friends = Friends.objects.get_friends(user)
        print(friends)
        return Response(friends)

class SendFriendRequest(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request :Request, *args, **kwargs):
        user = request.user
        requested_username = kwargs.get("username")
        try:
            to_user = get_object_or_404(User, username=requested_username)
            Friends.objects.add_friend(from_user=user, to_user=to_user)
            return Response(data={"detail" : "Friend Request sent"})
        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"detail" : "User Not Found"})
        except ValueError as e:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail": str(e)})

class CheckReceivedFriend(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, *args, **kwargs):
        current_user = request.user
        data = Friends.objects.get_received_reqs(current_user)
        return Response(data)


class CheckSentFriend(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request : Request, *args, **kwargs):
        current_user = request.user
        sent_requests = Friends.objects.get_sent_reqs(current_user)
        # data = [req.to_user.username for req in sent_requests]
        return Response(sent_requests)
