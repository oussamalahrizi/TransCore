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
from rest_framework.permissions import IsAuthenticated
from .permissions import IsSameUser
from rest_framework.request import Request
from django.shortcuts import get_object_or_404
from django.http import Http404
from rest_framework import serializers
from .utils import _AuthCache
from core.asgi import publishers
from asgiref.sync import async_to_sync



class UpdateUserInfo(APIView):
    serializer_class = UpdateUserSerializer
    permission_classes = [IsAuthenticated]
    
    def patch(self, request : Request, *agrs, **kwargs):
        if not request.data:
            return Response({"detail" : "Empty request data"},
                            status.HTTP_400_BAD_REQUEST)
        instance : User = request.user
        serializer = self.serializer_class(instance, data=request.data, partial=True)
        # check serializer validation and perform the update
        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data=serializer.errors)
        serializer.update(instance, serializer.validated_data)
        async_to_sync(NotifyApi)(instance.id, "update_info")
        return Response(data={ "detail" : f"update successful {instance.username}"})


class UpdatePassword(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UpdatePasswordSerializer
    
    def patch(self, request : Request, *args, **kwargs):
        if not request.data:
            return Response({"detail" : "empty request data"},
                            status.HTTP_400_BAD_REQUEST)
        instance = request.user
        serializer = self.serializer_class(instance, data=request.data)
        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data=serializer.errors)
        validated_data = serializer.validated_data
        serializer.update(instance=instance, validated_data=validated_data)
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



class ListUsers(ListAPIView):
    serializer_class = UserDetailSerializer
    queryset = User.objects.all()
    authentication_classes = []

"""
    cleanup functions for api
"""

from core.asgi import publishers

async def NotifyApi(user_id, type):
    api = publishers[0]
    body = {
        'type' : type,
        'data' : {
            "user_id" : str(user_id)
        }
    }
    await api.publish(body)

class GetFriends(APIView):
    class FriendsSerializer(serializers.ModelSerializer):
        class Meta:
            model = User
            fields =  ['id', 'username', 'email', 'icon_url']

    permission_classes = [IsAuthenticated]
    
    def get(self, request : Request, *args, **kwargs):
        user : User = request.user
        friends = Friends.objects.get_friends(user)
        objects = User.objects.filter(id__in=friends)
        ser = self.FriendsSerializer(objects, many=True)
        return Response(data=ser.data)

class SendFriendRequest(APIView):
    permission_classes = [IsAuthenticated]

    notif = publishers[0]
    
    
    def get(self, request :Request, *args, **kwargs):
        user : User = request.user
        requested_username = kwargs.get("username")
        try:
            to_user : User = get_object_or_404(User, username=requested_username)
            Friends.objects.add_friend(from_user=user, to_user=to_user)
            data = {
                'type' : "send_notification",
                'data' : {
                    'user_id' : str(to_user.id),
                    'message' : f'you received a friend request from {user.username}',
                    'color' : "green"
                }
            }
            async_to_sync(self.notif.publish)(data)
            return Response(data={"detail" : "Friend Request sent"})
        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"detail" : "User Not Found"})
        except ValueError as e:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail": str(e)})

class CheckReceivedFriend(APIView):
    permission_classes = [IsAuthenticated]

    class ReceivedFriendSerializer(serializers.ModelSerializer):
        class Meta:
            model = User
            fields = ['id', 'username', 'icon_url']

    def get(self, request: Request, *args, **kwargs):
        current_user = request.user
        received = Friends.objects.get_received_reqs(current_user)
        users = User.objects.filter(id__in=received)
        ser = self.ReceivedFriendSerializer(users, many=True)
        return Response(ser.data)


class CheckSentFriend(APIView):
    permission_classes = [IsAuthenticated]

    class SentFriendSerializer(serializers.ModelSerializer):
        class Meta:
            model = User
            fields = ['id', 'username', 'icon_url']

    def get(self, request : Request, *args, **kwargs):
        current_user = request.user
        sent_requests = Friends.objects.get_sent_reqs(current_user)
        users = User.objects.filter(id__in=sent_requests)
        ser = self.SentFriendSerializer(users, many=True)
        return Response(ser.data)

class GetBlocked(APIView):
    permission_classes = [IsAuthenticated]


    def get(self, request : Request, *args, **kwargs):
        current = request.user
        blocked = Friends.objects.get_blocked_users(current)
        objects = User.objects.filter(id__in=blocked)
        ser = UserDetailSerializer(objects, many=True)
        return Response(data=ser.data)

class ChangeFriend(APIView):

    permission_classes = [IsAuthenticated]

    actions = {}

    def __init__(self, **kwargs):
        self.actions = {
            'accept' : self.accept,
            'reject' : self.reject,
            'unfriend' : self.unfriend,
            'block' : self.block,
            'unblock' : self.unblock,
            'cancel' : self.cancel
        }
        super().__init__(**kwargs)

    class ChangeSerializer(serializers.Serializer):
        
        change = serializers.CharField(max_length=10, required=True)

        def validate_change(self, value):
            choices = ['accept', 'reject', 'unfriend', 'block', 'cancel', 'unblock']
            if value not in choices:
                raise serializers.ValidationError("invalid relation change value")
            return value

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

    def accept(self, user : User, other : User):
        try:
            relation : Friends = self.get_relation(user, other)
            if not relation:
                raise Exception(f"{other.username} Did not send you a friend request")
            if relation.status != "pending":
                raise Exception(f"Your current relation is : {relation.status}")
            relation.status = "accepted"
            relation.save()
            return f"You accepted {other.username}"
        except Friends.DoesNotExist:
            raise Exception("You didn't receive any friend request from this user.")
    
    def reject(self, user : User, other : User):
        try:
            relation : Friends = self.get_relation(user, other)
            if not relation:
                raise Exception(f"{other.username} did not sent you a friend request")
            if relation.status != "pending":
                raise Exception(f"Your current relation is : {relation.status}")
            relation.delete()
            return f"You rejected {other.username}"
        except Friends.DoesNotExist:
            raise Exception("You didn't receive any friend request from this user.")

    def cancel(self, user : User, other : User):
        relation : Friends = self.get_relation(user, other)
        if not relation:
            raise Exception(f"You did not send any friend request to {other.username}")
        relation.delete()
        return f"You canceled friend request to {other.username}"
    def unfriend(self, user : User, other : User):
       
        relation : Friends = self.get_relation(user, other)
        if not relation:
            raise Exception("You are not even friends.")
        relation.delete()
        return f"{other.username} removed from friends"

        
    def block(self, user : User, other : User):
        relation : Friends = self.get_relation(user, other)
        if relation:
            if relation.status == "blocked":
                return f"{other.username} already blocked you hehe"
            relation.status = "blocked"
            relation.from_user = user
            relation.to_user = other
            relation.save()
        else:
            relation = Friends.objects.create(from_user=user, to_user=other, status="blocked")
            relation.from_user = user
            relation.to_user = other
            relation.save()
        return f"Successfully blocked {other.username}"
    
    def unblock(self, user : User, other : User):
        relation : Friends = self.get_relation(user, other)
        if not relation:
            raise Exception("You are not even friends or blocking each other")
        if  relation.status != "blocked":
            raise Exception("You are not even friends or blocking each other")
        relation.status = "accepted"
        relation.save()
        return f"Successfully unblocked {other.username}"

    def post(self, request : Request, *args, **kwargs):
        try:
            user : User = request.user
            other = kwargs.get('id')
            if not other:
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : 'Missing Username'})
            other : User = get_object_or_404(User, id=other)
            serializer = self.ChangeSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            change = serializer.data["change"]
            res = self.actions[change](user, other)
            print(f"publishing for user id {user.id} type : refresh_friends")
            print(f"publishing for other id {other.id} type : refresh_friends")
            if change not in ["reject", "cancel"]:
                async_to_sync(NotifyApi)(user.id, "refresh_friends")
                async_to_sync(NotifyApi)(other.id, "refresh_friends")
            return Response(status=status.HTTP_201_CREATED, data={"detail" : res})
        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND,
                            data={"detail" : f'User Not Found, {kwargs.get("username")}'})
        except (Exception, ValueError) as e:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail" : str(e)})

import json
from django.core.mail import send_mail
import pyotp

class ResetPassword(APIView):
    authentication_classes = []
    cache = _AuthCache

    class CodeRequest(serializers.Serializer):
        email = serializers.EmailField(required=True)

    def post(self, request : Request, *args, **kwargs):
        ser = self.CodeRequest(data=request.data)
        ser.is_valid(raise_exception=True) # will return 400 if fails
        email = ser.data["email"]
        try:
            user = get_object_or_404(User, email=email)
            if not user.is_active:
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : "This Account has been permanently banned."})
            code = self.cache.reset_code_action(email=user.email,action='set')
            send_mail(
                from_email=None,
                subject="Password Reset",
                message=f"Your password reset code is {code}",
                recipient_list=[user.email],
                fail_silently=False
            )
            return Response(status=status.HTTP_202_ACCEPTED, data={"detail": "A code has been sent to your email."})
        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND,
                            data={"detail" : "User Not Found"})
        except  json.JSONDecodeError as e:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            data={"detail" : "Internal Server Error"})            
        except Exception as e:
            print(f"Error in Password Reset : {e}")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            data={"detail" : "Internal Server Error"})

from .models import AuthProvider

class PasswordVerify(APIView):
    authentication_classes = []
    cache = _AuthCache

    class Code(serializers.Serializer):
        code = serializers.IntegerField(required=True)
        email = serializers.EmailField(required=True)

    def post(self, request: Request, *args, **kwargs):
        ser = self.Code(data=request.data)
        ser.is_valid(raise_exception=True)   
        email = ser.data["email"]
        code = ser.data["code"]     
        cache_code = self.cache.reset_code_action(action="get", email=email)
        if cache_code is None:
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data={"detail" : "User with this email did not request any code"})
        if int(cache_code) != code:
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data={"detail" : "Invalid code"})
        try:
            user = get_object_or_404(User, email=email)
            self.cache.reset_code_action(email=email, action='delete')
            new_password = pyotp.random_base32()
            obj, created = AuthProvider.objects.get_or_create(name="Email")
            user.auth_provider.add(obj)
            if user.two_factor_enabled:
                user.two_factor_enabled = False
                user.two_factor_secret = ""
            self.cache.BlacklistUserToken(user.username)
            self.cache.delete_access_session(user.id)
            user.set_password(new_password)
            user.save()
            send_mail(
                from_email=None,
                subject="Your password has been reset",
                message=f"Your new password is {new_password}",
                recipient_list=[email],
                fail_silently=False
            )
            return Response(data={"detail" : "A new Password has been sent to your email"})
        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND,
                            data={"detail" : "User Not Found"})
        except Exception as e:
            print(f"Error in Password Verify : {e}")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            data={"detail" : "Internal Server Error"})
        
from .permissions import isNginx

class CDNVerify(APIView):
    authentication_classes = []
    permission_classes = [isNginx]

    def get(self, request, *args , **kwargs):
        return Response(data={"detail" : "works!"})
    
class Upload(APIView):

    class imageSerial(serializers.Serializer):
        image = serializers.ImageField()

class sendNotif(APIView):
    permission_classes = [IsAuthenticated]
    notif = publishers[0]

    @async_to_sync
    async def get(self, request : Request, *args, **kwargs):
        try:
            user : User = request.user
            data = {
                'type' : "send_notification",
                'data' : {
                    'user_id' : str(user.id),
                    'message' : 'Test message'
                }
            }
            await self.notif.publish(data)
            return Response(data={"detail" : "published successuly"})
        except Exception as e:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            data={"detail" : f"error publishing, {e}"})

from django.http import FileResponse
import os
from django.conf import settings
from .models import ImageUser
from PIL import Image
from rest_framework.parsers import FileUploadParser, JSONParser
from rest_framework.parsers import BaseParser

from uuid import uuid4
from django.core.files.uploadedfile import SimpleUploadedFile


class RawImageParser(BaseParser):
    """
    Parser for raw image data.
    """
    media_type = 'image/png'
    
    def parse(self, stream, media_type=None, parser_context=None):
        """
        Convert raw binary content to a file-like object that serializers can use
        """
        content = stream.read()
        
        # Create a unique filename for the image
        filename = f"{uuid4()}.png"
        
        # Create a Django file object from the raw content
        file_dict = {
            'image': SimpleUploadedFile(
                name=filename,
                content=content,
                content_type='image/png'
            )
        }
        return file_dict

from django.http.response import FileResponse
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
class UserImageView(APIView):

    permission_classes = [IsAuthenticated]

    def get_parsers(self):
        if self.request.method == "POST":
            return [RawImageParser()]
        return super().get_parsers()

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return super().get_permissions()

    def get_authenticators(self):
        if self.request.method == "GET":
            return []
        return super().get_authenticators()


    class UploadSerialize(serializers.Serializer):
        image = serializers.ImageField()

        def validate_image(self, value):
            try:
                # Open the image using Pillow
                img = Image.open(value)
                if img.format != 'PNG':
                    raise serializers.ValidationError("Only PNG images are allowed.")
            except Exception as e:
                raise serializers.ValidationError("The uploaded file is not a valid image.")
            return value
    
    def relation(self, user, other):
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
        id = kwargs.get("id")
        user : User = request.user
        if not id:
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data={"detail" : "Missing id"})
        try:
            user : User = get_object_or_404(User, id=id)
            image = get_object_or_404(ImageUser, user=user)
            print("sending response")
            return FileResponse(image.image)
        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND, data={"detail" : "Not Found"})

    def post(self, request : Request, *args, **kwargs):
        ser = self.UploadSerialize(data=request.data)
        ser.is_valid(raise_exception=True)
        image : SimpleUploadedFile= ser.validated_data["image"]
        user : User = request.user
        save, created = ImageUser.objects.get_or_create(user=user)
        if not created:
            save.image.delete()
        print("setting image")
        save.image = image
        save.save()
        user.icon_url = f'/api/auth/users/image/{user.id}/'
        user.save()
        async_to_sync(NotifyApi)(user.id, type="update_info")
        return Response({"detail" :"Image changed successfully."})
    
    def delete(self, request : Request, *args, **kwargs):
        user : User = request.user
        image = ImageUser(user=user)
        image.delete()
        user.icon_url = None
        user.save()
        async_to_sync(NotifyApi)(user.id, type="update_info")
        return Response(data={"detail": "Successfully deleted your profile image."})

