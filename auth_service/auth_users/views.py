# Create your views here.

import datetime
from rest_framework import serializers
from rest_framework import generics
from rest_framework.request import Request
from rest_framework.views import APIView
from .models import AuthProvider, User
from rest_framework.generics import CreateAPIView, DestroyAPIView, RetrieveAPIView, ListAPIView, UpdateAPIView
from .serializers import InputSerializer, UserDetailSerializer, UpdateUserSerializer, UserLogin
from rest_framework.response import Response
from rest_framework import status
import jwt
from django.conf import settings
from rest_framework.permissions import AllowAny, IsAuthenticated
from .utils import GenerateTokenPair, RefreshBearer, CheckUserAauthenticated
from django.urls import reverse

class RefreshToken(APIView):
	@property
	def allowed_methods(self):
		return ['GET']
	def get(self, request: Request, *args, **kwargs):
		refresh = request.COOKIES.get('refresh_token')
		if refresh is None:
			return Response({"detail" : "Missing refresh token."}, status=status.HTTP_400_BAD_REQUEST)
		response = RefreshBearer(refresh)
		return response

class RegisterGeneric(CreateAPIView):
	serializer_class = InputSerializer

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		self.perform_create(serializer)
		headers = self.get_success_headers(serializer.data)
		try:
			access, refresh = GenerateTokenPair(serializer.instance.id)
		except Exception as e:
			serializer.instance.delete()
			return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		return Response({"access_token" : access, "refresh_token" : refresh},
					status=status.HTTP_201_CREATED, headers=headers)


class LoginView(generics.CreateAPIView):
	serializer_class = UserLogin
	
	
	def post(self, request):
		# redirect logged in users
		if request.user.is_authenticated:
			profile_url = reverse('user-info', kwargs={'username': request.user.username})
			return Response(status=status.HTTP_302_FOUND, headers={'Location': profile_url})
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.validated_data['user']
		access, refresh = GenerateTokenPair(str(user.id))
		return Response({"access_token" : access, "refresh_token" : refresh}, status=status.HTTP_202_ACCEPTED)


from rest_framework.permissions import BasePermission

class IsSameUser(BasePermission):

	def has_object_permission(self, request, view, obj : User):
		return request.user.is_authenticated \
			and request.user.username == obj.username

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
		for key in request.data.keys():
			if key not in serializer.get_fields():
				return Response({"detail" : "ivalid key provided"},
					status=status.HTTP_400_BAD_REQUEST)
		serializer.is_valid(raise_exception=True)
		self.perform_update(serializer)
		# just copied it from original function, ignore it 
		if getattr(instance, '_prefetched_objects_cache', None):
			 # If 'prefetch_related' has been applied to a queryset, we need to
			 # forcibly invalidate the prefetch cache on the instance.
			instance._prefetched_objects_cache = {}
		response = {
			"detail" : "update successful",
			"updated_fields" : request.data.keys()
		}
		return Response(response)


class GetUser(RetrieveAPIView):
	serializer_class = UserDetailSerializer
	queryset = User.objects.all()
	lookup_field = 'username'
	permission_classes = [IsAuthenticated]
	
class ListUsers(ListAPIView):
	serializer_class = UserDetailSerializer
	queryset = User.objects.all()




