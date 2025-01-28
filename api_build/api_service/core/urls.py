
from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.views import APIView


urlpatterns = [
    path("api/main/", include("api_core.urls"))
]
