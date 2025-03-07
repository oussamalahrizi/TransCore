from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .utils import Queue
from .Middleware import ProxyUser

class FindMatch(APIView):

    permission_classes = [IsAuthenticated]
    cache = Queue

    def get(self, request : Request, *args, **kwargs):
        user : ProxyUser= request.user

        # check if the user in queue already
        return Response(data={
            "detail" : "it works",
            "data" : user.to_dict()
            })