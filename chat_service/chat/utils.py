import jwt
from django.contrib.auth.models import User
from rest_framework.exceptions import AuthenticationFailed

def decode_jwt_token(token):
    """
    Decode and validate the JWT token passed for WebSocket authentication.
    Returns the user object if valid, otherwise raises an error.
    """
    try:
        # Decode the token without using the SECRET_KEY (No signature verification)
        payload = jwt.decode(token, options={"verify_signature": False})
        
        # Get the user from the payload
        user = User.objects.get(id=payload.get('user_id'))
        return user
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token has expired')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Invalid token')
    except User.DoesNotExist:
        raise AuthenticationFailed('User not found')
