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
    except:
        api = ""
    allowed_hosts = [api]

    def has_permission(self, request, view):
        incoming_host = request.META.get('REMOTE_ADDR')
        return incoming_host in self.allowed_hosts


class IsSameUser(BasePermission):

    def has_object_permission(self, request : Request, view, obj : User):
        return request.user.is_authenticated \
            and request.user.username == obj.username