from rest_framework.exceptions import AuthenticationFailed
from rest_framework import status

class InvalidToken(AuthenticationFailed):

    def __init__(self, detail=None, clear_cookie=False, custom_code=status.HTTP_401_UNAUTHORIZED):
        self.clear_cookie = clear_cookie
        self.custom_code = custom_code
        super().__init__(detail)
