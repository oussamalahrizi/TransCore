# Create your views here.

import datetime
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.views import APIView
from .models import AuthProvider, User
from rest_framework.generics import CreateAPIView, DestroyAPIView, RetrieveAPIView, ListAPIView, UpdateAPIView
from .serializers import InputSerializer, UserDetailSerializer, UpdateUserSerializer
from rest_framework.response import Response
from rest_framework import status
import jwt
from django.conf import settings
from rest_framework.permissions import IsAuthenticated


def GenerateTokenPair(user_id):
	exp_refresh = datetime.datetime.utcnow() + datetime.timedelta(days=1)
	exp_access = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)

	payload = {
		'user_id' : user_id,
		'exp' : exp_access,
		'iat' : datetime.datetime.utcnow()
	}
	access = jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
	payload['exp'] = exp_refresh
	refresh = jwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
	return access, refresh

class RegisterGeneric(CreateAPIView):
	serializer_class = InputSerializer

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		self.perform_create(serializer)
		headers = self.get_success_headers(serializer.data)
		access, refresh = GenerateTokenPair(serializer.instance.id)
		return Response({"access_token" : access, "refresh_token" : refresh},
					status=status.HTTP_201_CREATED, headers=headers)

class UpdateUserInfo(UpdateAPIView):
	serializer_class = UpdateUserSerializer
	queryset = User.objects.all()
	lookup_field = 'username'
	http_method_names = ['patch']
	
	def patch(self, request, *args, **kwargs):
		if not request.data:
			return Response(
				{"detail" : "empty request data"},
				status.HTTP_400_BAD_REQUEST
			)
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

from .serializers import UserLogin

class GetUser(RetrieveAPIView):
	serializer_class = UserDetailSerializer
	queryset = User.objects.all()
	lookup_field = 'username'
	permission_classes = [IsAuthenticated]
	
class ListUsers(ListAPIView):
	serializer_class = UserDetailSerializer
	queryset = User.objects.all()
	
# class UserDeleteView(APIView):
# 	permission_classes = [IsAuthenticated]
	
# 	def post(self, request):
# 		return Response(request)

def check_user_authenticated

class LoginView(APIView):
	def post(self, request: Request):
		if request.user.is_authenticated:
			response = Response(
				data={"detail" : "already logged in redirecting..."},
				status=status.HTTP_302_FOUND,
			)
			response['Location'] = f'/auth/users/{request.user.username}/'
			return response
		