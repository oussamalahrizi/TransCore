from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .utils import Queue
from .Middleware import ProxyUser
import httpx
from asgiref.sync import async_to_sync

from core.publishers import publishers

API_DATA = "http://api-service/api/main/user/"

class APIException(Exception):

    def __init__(self, *args, code=500, detail : str):
        self.code = code
        self.detail = detail
        super().__init__(*args)



class FindMatchPong(APIView):

    permission_classes = [IsAuthenticated]
    cache = Queue
    
    @async_to_sync
    async def get_status(self, user_id : str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{API_DATA}{user_id}/")
                response.raise_for_status()
                data = response.json()
                return data
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError):
            raise APIException(code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                               detail="Failed to reach API Service")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            detail = e.response.json()
            raise APIException(code=e.response.status_code, detail=detail)
        except Exception as e:
            raise APIException(detail='Internal Server Error', code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request : Request, *args, **kwargs):
        current_user = {'id' : request.user.id}
        try:
            user_data = self.get_status(user_id=current_user["id"])
            if not user_data:
                return Response(status=status.HTTP_404_NOT_FOUND,
                                data={"detail" : "User Not Found."})
            if user_data["status"] != "online":
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : f'It appears that you are {user_data["status"]}'})
            self.cache.store_player(current_user['id'], "pong")
            return Response(data={"detail" : "We are looking for a match."})
            
        except APIException as e:
            return Response(status=e.code, data={"detail" : e.detail})


from rest_framework import serializers, status

from .utils import Queue

class CheckGame(APIView):

    permission_classes = []
    authentication_classes = []
    cache = Queue
    class CheckGameSerializer(serializers.Serializer):
        game_id  = serializers.CharField()
        user_id = serializers.CharField()
        game_type = serializers.CharField()

        def validate_game_type(self, value):
            types = ['pong', 'tic']
            if value not in types:
                raise serializers.ValidationError("game type not supported")
            return value

    def post(self, request : Request, *args, **kwargs):
        try:
            post_data = request.data
            serializer = self.CheckGameSerializer(data=post_data)
            serializer.is_valid(raise_exception=True)
            game_id = serializer.validated_data['game_id']
            user_id = serializer.validated_data['user_id']
            game_type = serializer.validated_data['game_type']
            game_info = self.cache.get_game_info(game_id, game_type)
            if not game_info:
                return Response(status=status.HTTP_404_NOT_FOUND,
                                data={'detail': 'Game Not Found.'})
            players = game_info['players']
            if user_id not in players:
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={'detail' : 'User Not in this game'})
            return Response(status=status.HTTP_200_OK, data={
                "detail" : "OK",
                'game_info' : game_info
                })
        except serializers.ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data=serializer.errors)



class CancelQueue(APIView):
    permission_classes = [IsAuthenticated]

    cache = Queue

    def get(self, request : Request, *args, **kwargs):
        current : ProxyUser = request.user
        current = current.to_dict()
        id = current["id"]
        self.cache.remove_player(id)
        notif = publishers[1]
        body = {
            'type' : "cancel_queue",
            'data': {
                'user_id' : id
            }
        }
        async_to_sync(notif.publish)(body)
        return Response(data={"detail" : "Queue Canceled"})


class AcceptMatchPong(APIView):
    permission_classes = [IsAuthenticated]
    cache = Queue
    class GIDSerialier(serializers.Serializer):
        game_id = serializers.CharField(required=True)
        state = serializers.BooleanField(required=True)

    def post(self, request : Request, *args, **kwargs):
        current : ProxyUser = request.user
        id = current.to_dict()["id"]
        ser = self.GIDSerialier(data=request.data)
        ser.is_valid(raise_exception=True)
        game_id = ser.validated_data["game_id"]
        game_info = self.cache.get_game_info(game_id=game_id, type="pong")
        if not game_info:
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data={"detail" : "Game Not Found Or"
                            "Canceled"})
        players = game_info["players"]
        if id not in players:
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data={"detail" : "You are not in this game"})
        state = ser.validated_data["state"]
        if not state:
            self.cache.handle_decline(game_id, "pong", id)
            return Response(data={"detail" : "You declined"})
        notif = publishers[1]
        body = {
            'type' : "update_status",
            "data": {
                'user_id' : id,
                'status' : "ingame"
            }
        }
        async_to_sync(notif.publish)(body)
        return Response(data={'detail' : "Redirecting to the game"})


"""
    TODO :
        generate game for single player
"""


class InviteGame(APIView):
    permission_classes = [IsAuthenticated]

    cache = Queue

    async def get_other_data(self, other):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"http://api-service/api/main/user/{other}/")
                response.raise_for_status()
                return response.json()
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError):
            raise APIException(code=500, detail="Failed to reach API Service")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            detail = e.response.json()
            raise APIException(code=e.response.status_code, detail=detail)
        except Exception as e:
            raise APIException(detail='Internal Server Error')

    def get(self, request : Request, *args, **kwargs):
        current : ProxyUser = request.user
        id = current.to_dict()["id"]
        current = current.to_dict()
        other = kwargs.get("id")
        if not other:
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data={"detail" : "Missing User to invite"})
        try:
            other_data = async_to_sync(self.get_other_data)(other)
            if other_data["status"] != "online":
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : "User is not online"})
            res, state = self.cache.invite_player(id, other, "pong")
            if not state:
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : res})
            notif = publishers[1]
            data=  {
                "type" :"invite",
                'data' : {
                    "user_id" : other,
                    'from' : current["username"]
                } 
            }
            async_to_sync(notif.publish)(data)
            return Response(data={"detail" : res})
        except APIException as e:
            return Response(status=e.code, data={"detail" : e.detail})
        