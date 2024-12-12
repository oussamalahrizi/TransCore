# Create your views here.

from rest_framework import generics
from rest_framework.request import Request
from rest_framework.views import APIView
from .models import User
from rest_framework.generics import RetrieveAPIView, ListAPIView, UpdateAPIView
from .serializers import  UserDetailSerializer, UpdateUserSerializer, UserLogin
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission


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


class GetUser(RetrieveAPIView):
	serializer_class = UserDetailSerializer
	queryset = User.objects.all()
	lookup_field = 'username'
	permission_classes = [IsAuthenticated]
	
class ListUsers(ListAPIView):
	serializer_class = UserDetailSerializer
	queryset = User.objects.all()

