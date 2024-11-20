from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework import status
from .serializers import InputSerializer
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from drf_yasg.utils import swagger_auto_schema

class RegisterInput(APIView):
	@swagger_auto_schema(
        request_body=InputSerializer,
        responses={201: InputSerializer(many=False), 400: "Bad Request"}
    )
	def post(self, request):
		serializer_class = InputSerializer(data=request.data)
		if serializer_class.is_valid():
			serializer_class.save()
			return Response(serializer_class.validated_data, status=status.HTTP_201_CREATED)
		return Response(serializer_class.errors, status=status.HTTP_400_BAD_REQUEST)
