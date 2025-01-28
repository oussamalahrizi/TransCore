from rest_framework.views import exception_handler
from rest_framework import status

from .exceptions import InvalidToken

def custom_exception_handler(exc, context):
    # Call the default exception handler first , docs impose this
    response = exception_handler(exc, context)
    if isinstance(exc, InvalidToken):
        if response is not None:
            response.status_code = status.HTTP_401_UNAUTHORIZED
            response.data = {
                'detail': exc.detail,
            }
    return response