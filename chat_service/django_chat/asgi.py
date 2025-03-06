import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from chat import routing
from chat.middleware import JWTMiddleware  
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_chat.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTMiddleware(  
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})
