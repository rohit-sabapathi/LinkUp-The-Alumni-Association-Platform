from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from chat.routing import websocket_urlpatterns
from chat.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    'websocket': AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
}) 