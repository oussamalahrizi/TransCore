from .Consumer import Consumer
from .Singleconsumer import SingleConsumer
from django.urls import path

from rest_framework.views import APIView
from rest_framework.response import Response

websocket_patterns = [
    path('api/game/pong/ws/', Consumer.as_asgi()),
    path('api/game/pong-single/ws/', SingleConsumer.as_asgi()),

]

class Test(APIView):

    def get(self, request, *args, **kwargs):
        return Response(data={"It works!"})


urlpatterns = [
    path('test/', Test.as_view(), name="test-view")
]