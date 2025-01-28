from rest_framework.exceptions import AuthenticationFailed
from rest_framework import status

class InvalidToken(AuthenticationFailed):
    status_code = status.HTTP_401_UNAUTHORIZED