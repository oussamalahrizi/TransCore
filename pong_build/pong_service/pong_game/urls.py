
from django.urls import path

from rest_framework.views import APIView
from rest_framework.response import Response

class Test(APIView):

    def get(self, request, *args, **kwargs):
        return Response(data={"It works!"})


urlpatterns = [
    path('test/', Test.as_view(), name="test-view")
]