from rest_framework.permissions import BasePermission
from socket import gethostbyname
from .models import User
from rest_framework.request import Request

class IsAllowedHost(BasePermission):
    """
    Custom permission to only allow access from specific hosts.
    """

    try:
        api = gethostbyname("api-service")
        match = gethostbyname("match-service")
        chat = gethostbyname("chat-service")
    except:
        api = ""
        match = ""
        chat = ""
    allowed_hosts = [api, match, chat]

    def has_permission(self, request, view):
        incoming_host = request.META.get('REMOTE_ADDR')
        return incoming_host in self.allowed_hosts

class isNginx(BasePermission):

    try:
        nginx = gethostbyname("nginx")
    except:
        nginx = ""
    def has_permission(self, request, view):
        incoming = request.META.get('REMOTE_ADDR')
        return incoming == self.nginx

class IsSameUser(BasePermission):

    def has_object_permission(self, request : Request, view, obj : User):
        return request.user.is_authenticated \
            and request.user.username == obj.username