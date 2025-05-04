from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from social_django.utils import load_strategy, load_backend
from social_core.exceptions import MissingBackend, AuthTokenError, AuthForbidden
from .serializers import UserSerializer

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Exchange Google OAuth2 token for a JWT token
    """
    # Check for access_token in the request
    access_token = request.data.get('access_token')
    if not access_token:
        return Response(
            {'error': 'No access token provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Load the Django strategy and Google backend
        strategy = load_strategy(request)
        backend = load_backend(strategy, 'google-oauth2', redirect_uri=None)
        
        # Attempt authentication with the provided token
        with transaction.atomic():
            # This will either get an existing user or create a new one
            user = backend.do_auth(access_token)
            
            if user:
                # Generate JWT tokens for the user
                refresh = RefreshToken.for_user(user)
                user_data = UserSerializer(user).data
                
                # Return the tokens and user data
                return Response({
                    'user': user_data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'message': 'Login successful'
                })
            else:
                return Response(
                    {'error': 'Failed to authenticate with Google'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
    except (MissingBackend, AuthTokenError, AuthForbidden) as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Unexpected error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 