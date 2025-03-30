from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .utils import Queue, tournament
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



# checks here
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


class FindMatchTic(APIView):

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
            self.cache.store_player(current_user['id'], "tic")
            return Response(data={"detail" : "We are looking for a match."})
            
        except APIException as e:
            return Response(status=e.code, data={"detail" : e.detail})


class SingleMatch(APIView):
    permission_classes = [IsAuthenticated]
    Cache = Queue

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
            id = str(uuid.uuid4())
            self.Cache.redis.set(f'pong:{id}', json.dumps({
                "match_type" : "regular",
                "players" : [current_user["id"]],
                "type" : "single",
                "game_type" : "pong"
            }))
            

            return Response(data={"detail" : "Redirecting to the game", "game_id" : id})
            
        except APIException as e:
            return Response(status=e.code, data={"detail" : e.detail})
        
class SingleMatchTic(APIView):
    permission_classes = [IsAuthenticated]
    Cache = Queue

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
            id = str(uuid.uuid4())
            self.Cache.redis.set(f'tic:{id}', json.dumps({
                "match_type" : "regular",
                "players" : [current_user["id"]],
                "type" : "single",
                "game_type" : "tic"
            }))
            

            return Response(data={"detail" : "Redirecting to the game", "game_id" : id})
            
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
    tr_cache = tournament
    class GIDSerialier(serializers.Serializer):
        game_id = serializers.CharField(required=True)
        state = serializers.BooleanField(required=True)

    async def fetch_user_data(self, user_id):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"http://api-service/api/main/user/{user_id}/")
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

    def post(self, request : Request, *args, **kwargs):
        try:

            current : ProxyUser = request.user
            id = current.to_dict()["id"]
            current_status = async_to_sync(self.fetch_user_data)(id)
            if current_status['status'] != 'online' and not current_status.get('tournament_id') and current_status['status'] != 'inqueue':
                raise APIException(code=400, detail='You are not Online')
            print("accept data")
            pprint(current_status)
            ser = self.GIDSerialier(data=request.data)
            ser.is_valid(raise_exception=True)
            game_id = ser.validated_data["game_id"]
            game_info = self.cache.get_game_info(game_id=game_id, type="pong")
            if not game_info:
                if current_status.get('tournament_id'):
                    print('User advancing')
                    return Response(status=status.HTTP_400_BAD_REQUEST,
                                    data={'detail' : 'Advanced to next stage'})
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : "Game Not Found Or Canceled"})
            players = game_info["players"]
            if id not in players:
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : "You are not in this game"})
            state = ser.validated_data["state"]
            if not state:
                tr_id = None
                if current_status.get('tournament_id'):
                    tr_id = current_status['tournament_id']
                    print('USER DECLINED', current_status['username'])
                    self.tr_cache.handle_decline(game_id, id, tr_id)
                else:
                    self.cache.handle_decline(game_id, "pong", id, tr_id)
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
        except APIException as e:
            return Response(status=e.code,
                            data=e.detail)



class AcceptMatchTic(APIView):
    permission_classes = [IsAuthenticated]
    cache = Queue
    tr_cache = tournament
    class GIDSerialier(serializers.Serializer):
        game_id = serializers.CharField(required=True)
        state = serializers.BooleanField(required=True)

    async def fetch_user_data(self, user_id):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"http://api-service/api/main/user/{user_id}/")
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

    def post(self, request : Request, *args, **kwargs):
        try:

            current : ProxyUser = request.user
            id = current.to_dict()["id"]
            current_status = async_to_sync(self.fetch_user_data)(id)
            if current_status["status"] != "online" and current_status['status'] != 'inqueue':
                raise APIException(code=400, detail="You are not online!")
            ser = self.GIDSerialier(data=request.data)
            ser.is_valid(raise_exception=True)
            game_id = ser.validated_data["game_id"]
            game_info = self.cache.get_game_info(game_id=game_id, type="tic")
            if not game_info:
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : "Game Not Found Or Canceled"})
            players = game_info["players"]
            if id not in players:
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : "You are not in this game"})
            state = ser.validated_data["state"]
            if not state:
                self.cache.handle_decline(game_id, "tic", id, None)
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
        except APIException as e: 
            return Response(status=e.code,
                            data=e.detail)

"""
    TODO :
        generate game for single player
"""

# checks here
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
            if other_data.get('tournament_id'):
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
                    'from' : current["username"],
                    'from_id' : id
                } 
            }
            async_to_sync(notif.publish)(data)
            return Response(data={"detail" : res})
        except APIException as e:
            return Response(status=e.code, data={"detail" : e.detail})

import uuid, json

class AcceptInvite(APIView):
    permission_classes = [IsAuthenticated]
    cache = Queue

    class AcceptSerializer(serializers.Serializer):
        user_id = serializers.CharField(required=True)
        decision = serializers.CharField(required=True)
        
        def validate_decision(self, value):
            if value not in ["accept", "decline"]:
                raise serializers.ValidationError("decision is not valid")
            return value

        async def fetch_user_data(self, user_id):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"http://api-service/api/main/user/{user_id}/")
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

        def validate_user_id(self, value):
            try:
                data = async_to_sync(self.fetch_user_data)(value)
                if data["status"] != "online":
                    raise serializers.ValidationError("User is not online.")
                return value
            except APIException as e:
                raise serializers.ValidationError(e.detail)

    def generate_game(self, players : list, user_id : str):
        id = uuid.uuid4()
        data = {
            'players' : players,
            'match_type' : "regular"
        }
        self.cache.redis.set(f"pong:{id}", json.dumps(data))
        for p in players:
            notif = publishers[1]
            body = {
                'type' : "update_status",
                "data": {
                    'user_id' : str(id),
                    'status' : "ingame"
                }
            }
            async_to_sync(notif.publish)(body)
        body = {
            'type' : "invite_accepted",
            "data": {
                'game_id' : str(id),
                'user_id' : user_id
            }  
        }
        async_to_sync(notif.publish)(body)
        return str(id)

    def post(self, request : Request, *args, **kwargs):
        # current is the one who will accept
        # data["user_id"] is the one who sent the invite
        current :ProxyUser = request.user
        current : dict = current.to_dict()
        current_id = current["id"]
        ser = self.AcceptSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        check = self.cache.check_invite(data["user_id"] ,current_id, "pong")
        if not check:
            return Response(status=status.HTTP_400_BAD_REQUEST,
                            data={"detail" : "Invalid Invite"})
        if data["decision"] == "decline":
            self.cache.redis.delete(f"invite:pong:{data["user_id"]}")
            return Response(data={"detail" : "declined"})
        game_id = self.generate_game([current_id, data["user_id"]], data["user_id"])
        return Response(data={
            "detail" : "Redirecting",
            "game_id" : game_id
            })  


from pprint import pprint

class TournamentAPI(APIView):
    permission_classes = [IsAuthenticated]
    cache = tournament

    async def get_status(self, user_id : str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"http://api-service/api/main/user/{user_id}/")
                response.raise_for_status()
                return response.json()
        except (httpx.HTTPError, httpx.ConnectError, httpx.ConnectTimeout):
            raise APIException(code=500, detail="Cant reach Api server")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise APIException(code=404, detail="User Not Found")
            raise APIException(code=e.response.status_code,
                               detail=e.response.json())
        except APIException as e:
            raise APIException(detail=e.detail)


    def get(self, request : Request, *args, **kwargs):
        # check player satus
        current : ProxyUser = request.user
        current_id = current.to_dict()["id"]
        try:
            user_data = async_to_sync(self.get_status)(current_id)
            print("user data in tournament api")
            if user_data.get("tournament_id") is not None:
                print('User already in tournament')
                print(user_data['username'])
                tr_data = self.cache.fetch_ongoing(user_data['tournament_id'])
                if not tr_data:
                    return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                    data={'detail' : 'something went wrong getting your tr data'})
                print('sending tournament data to :', user_data['username'])
                pprint(tr_data)
                return Response(data=tr_data)
            if user_data['status'] != 'online':
                print("user status : ", user_data)
                return Response(status=status.HTTP_400_BAD_REQUEST,
                                data={"detail" : "You are not online"})
            players = self.cache.store_player(current_id)
            return Response(data=players)
        except APIException as e:
            return Response(status=e.code , data={'detail' : e.detail})