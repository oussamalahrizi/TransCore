from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from socket import gethostbyname
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .jwtMiddleware import JWTAuthentication
from .utils import _Cache
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from asgiref.sync import async_to_sync
from .jwtMiddleware import ProxyUser
import httpx
from pprint import pprint
import asyncio

USER_INFO = "http://auth-service/api/auth/internal/userid/"

USER_FRIENDS = 'http://auth-service/api/auth/internal/friends/'
USER_BLOCKED = 'http://auth-service/api/auth/internal/blocked/'

async def fetch_user_auth(user_id : str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f'{USER_INFO}{user_id}/')
            response.raise_for_status()
            data = response.json()
            return data
    except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError):
        raise Exception("Failed to get User from Auth service")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise Exception("Failed to get User from Auth service")
    except:
        raise("Internal Server Error")

class ApiException(Exception):
    def __init__(self, detail, code, *args):
        self.code = code
        self.detail = detail
        super().__init__(*args)


class GetUserService(APIView):
    """
        TODO : 
            - get user data from cache along with his presence status
            - if not in cache try fetch from the auth service async
    """
    cache = _Cache
    permission_classes = []
    authentication_classes = []

    async def get_user_data(self, user_id):
        try:
            timeout = httpx.Timeout(5.0, read=5.0)
            client = httpx.AsyncClient(timeout=timeout)
            response = await client.get(f"{USER_INFO}{user_id}/")
            response.raise_for_status()
            data = response.json()
            return data
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError) as e:
            raise ApiException(detail="Failed to get user data from Auth service",
                  code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == httpx._status_codes.codes.NOT_FOUND:
                return None
            raise ApiException(detail=f"Internal Server Error {e.response.json()}",
                  code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request: Request, *args, **kwargs):
        try:
            id = kwargs.get('id')
            user = async_to_sync(self.get_user_data)(id)
            if not user:
                return Response(status=status.HTTP_400_BAD_REQUEST, data={"detail" : "User Not Found."})
            user["status"] = self.cache.get_user_status(id)
            tr_id = self.cache.get_tournament_id(id)
            if tr_id:
                user["tournament_id"] = tr_id 
            return Response(data=user)
        except ApiException as e:
            return Response(status=e.code, data={"detail": e.detail})
    

class GetUserData(APIView):
    """
        TODO : 
            - get user data from cache along with his presence status
            - if not in cache try fetch from the auth service async
    """
    cache = _Cache
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    async def get_user_data(self, user_id):
        try:
            timeout = httpx.Timeout(5.0, read=5.0)
            client = httpx.AsyncClient(timeout=timeout)
            response = await client.get(f"{USER_INFO}{user_id}/")
            response.raise_for_status()
            data = response.json()
            return data
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError) as e:
            raise ApiException(detail="Failed to get user data from Auth service",
                  code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == httpx._status_codes.codes.NOT_FOUND:
                return None
            raise ApiException(detail=f"Internal Server Error {e.response.json()}",
                  code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def get(self, request: Request, *args, **kwargs):
        try:
            current :ProxyUser = request.user
            id = current.to_dict()["id"]
            user = async_to_sync(self.get_user_data)(id)
            if not user:
                return Response(status=status.HTTP_404_NOT_FOUND,
                                data={"detail" : "User Not Found."})
            user["status"] = self.cache.get_user_status(id)
            tr_id = self.cache.get_tournament_id(id)
            if tr_id:
                user["tournament_id"] = tr_id 
            return Response(data=user)
        except ApiException as e:
            return Response(status=e.code, data={"detail" : e.detail})


async def fetch_friends_auth(user_id : str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f'{USER_FRIENDS}{user_id}/')
            response.raise_for_status()
            return response.json()
    except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPError):
        raise ApiException("Failed to get User from Auth service", code=500)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise ApiException("Failed to get User from Auth service", code=500)
    except:
        raise ApiException("Internal Server Error", code=500)


class GetFriends(APIView):

    cache = _Cache
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]


    def get(self, request : Request, *args, **kwargs):
        # /api/main/friends/
        try:
            user : ProxyUser = request.user
            current_user = user.to_dict()
            user_id = current_user.get('id')
            friends = async_to_sync(fetch_friends_auth)(user_id)
            for f in friends:
                status = self.cache.get_user_status(f["id"])
                f['status'] = status
            return Response(friends)
        except ApiException as e:
            return Response(status=e.code, data={"detail": e.detail})


