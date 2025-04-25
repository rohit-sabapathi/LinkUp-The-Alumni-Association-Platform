from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken, TokenError
from django.contrib.auth import get_user_model
from jwt import InvalidTokenError, decode
from django.conf import settings
import logging
import traceback
import json

logger = logging.getLogger(__name__)
User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    try:
        # Remove 'Bearer ' prefix if present
        if token_key.startswith('Bearer '):
            token_key = token_key[7:]
        
        logger.info(f"Attempting to validate token: {token_key[:10]}...")
        
        try:
            # First try to decode the token
            decoded_token = decode(token_key, settings.SECRET_KEY, algorithms=['HS256'])
            logger.info(f"Token decoded successfully: {json.dumps(decoded_token, indent=2)}")
            
            # Check token expiration
            from datetime import datetime
            import pytz
            exp = datetime.fromtimestamp(decoded_token['exp'], tz=pytz.UTC)
            now = datetime.now(pytz.UTC)
            logger.info(f"Token expiration: {exp}, Current time: {now}")
            
            if exp < now:
                logger.error("Token has expired")
                raise TokenError("Token has expired")
            
            user = User.objects.get(id=decoded_token['user_id'])
            logger.info(f"Successfully authenticated user {user.id} ({user.email})")
            return user
            
        except Exception as e:
            logger.error(f"Token decode/validation failed: {str(e)}")
            logger.error(f"Token attempted: {token_key[:50]}...")  # Show more of the token for debugging
            raise InvalidTokenError(f"Invalid token format: {str(e)}")
            
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        try:
            # Log the full scope for debugging
            logger.info(f"WebSocket connection attempt - Headers: {scope.get('headers', [])}")
            
            # Get the token from query string
            query_string = scope.get('query_string', b'').decode()
            logger.info(f"Query string: {query_string}")
            
            # Parse query parameters more robustly
            query_params = {}
            if query_string:
                try:
                    query_params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
                except Exception as e:
                    logger.error(f"Error parsing query string: {str(e)}")
            
            token = query_params.get('token')
            if not token:
                logger.warning("No token provided in query parameters")
                await self.close_connection(send, "Authentication required")
                return

            try:
                scope['user'] = await get_user(token)
                logger.info(f"WebSocket authenticated for user {scope['user'].id}")
                return await super().__call__(scope, receive, send)
            except InvalidTokenError as e:
                logger.error(f"Invalid token: {str(e)}")
                await self.close_connection(send, f"Invalid authentication token: {str(e)}")
            except TokenError as e:
                logger.error(f"Token error: {str(e)}")
                await self.close_connection(send, f"Token error: {str(e)}")
            except User.DoesNotExist:
                logger.error("User not found")
                await self.close_connection(send, "User not found")
            except Exception as e:
                logger.error(f"Authentication failed: {str(e)}")
                await self.close_connection(send, f"Authentication failed: {str(e)}")

        except Exception as e:
            logger.error(f"Middleware error: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            await self.close_connection(send, "Internal server error")

    async def close_connection(self, send, reason):
        """Helper method to close WebSocket connection with a reason"""
        logger.error(f"Closing WebSocket connection: {reason}")
        await send({
            "type": "websocket.close",
            "code": 4000,
            "reason": reason
        }) 