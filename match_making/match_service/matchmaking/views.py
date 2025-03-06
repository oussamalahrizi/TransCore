from rest_framework.views import APIView
from rest_framework.request import Request


class FindMatch(APIView):

    authentication_classes = []
    permission_classes = []

    def get(self, request : Request, *args, **kwargs):
        user = request.user

        # check if the user in queue already