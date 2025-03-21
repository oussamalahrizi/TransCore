"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django_app = get_asgi_application()

from pong_game.wbesocket_urls import websocket_patterns
from pong_game.Middleware import jwtMiddleware


application = ProtocolTypeRouter({
    'http' : django_app,
    'websocket' : jwtMiddleware(
        URLRouter(
            websocket_patterns
        )
    )
})


