from rest_framework.exceptions import AuthenticationFailed
from rest_framework import status

class InvalidToken(AuthenticationFailed):    
    def __init__(self, detail=None, code=None, clear=False, custom_code=None):
        self.clear = clear
        self.custom_code = custom_code
        super().__init__(detail, code)