import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from core.middleware import JWTAuthMiddleware
from fann.notifications.routing import websocket_urlpatterns as notifications_ws_urls
from fann.chat.routing import websocket_urlpatterns as chat_ws_urls

print(">>> core/asgi.py LOADED")

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": JWTAuthMiddleware(URLRouter(notifications_ws_urls + chat_ws_urls)),
    }
)
