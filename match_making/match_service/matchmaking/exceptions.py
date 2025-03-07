from rest_framework.exceptions import AuthenticationFailed

class InvalidToken(AuthenticationFailed):    
    def __init__(self, detail=None, code=None, clear=False, custom_code=None):
        print("here : code :", custom_code)
        self.clear = clear
        self.custom_code = custom_code if custom_code else 401
        super().__init__(detail, code)