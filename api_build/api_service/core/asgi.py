"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from .Middleware import jwtmiddleware
from api_core.urls import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django_asgi = get_asgi_application()

application  =  ProtocolTypeRouter({
	"http" : django_asgi,
	"websocket" : jwtmiddleware(
		URLRouter(
			websocket_urlpatterns
		)
	)
})
