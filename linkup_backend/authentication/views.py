from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from .serializers import UserSerializer, UserRegistrationSerializer
from .models import UserFollowing, FollowRequest, Notification, CustomUser, Skill
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
import json

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data['email'])
            user_data = UserSerializer(user).data
            response.data['user'] = user_data
        return response

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Handle skills
            skills_data = request.data.get('skills')
            if skills_data:
                try:
                    skills_list = json.loads(skills_data)
                    for skill_name in skills_list:
                        skill, _ = Skill.objects.get_or_create(
                            name=skill_name,
                            defaults={'category': 'TECH'}  # Default category
                        )
                        user.skills.add(skill)
                except json.JSONDecodeError:
                    pass  # Skip if skills data is invalid

            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # If no pk in URL, return current user
        pk = self.kwargs.get('pk')
        if not pk:
            return self.request.user
        return get_object_or_404(User, pk=pk)

class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_to_follow = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if user_to_follow == request.user:
        return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if already following
    if UserFollowing.objects.filter(user=request.user, following_user=user_to_follow).exists():
        return Response({'error': 'Already following this user'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if there's any existing follow request
    existing_request = FollowRequest.objects.filter(
        from_user=request.user,
        to_user=user_to_follow
    ).first()

    if existing_request:
        if existing_request.status == 'PENDING':
            # Even though request exists, make sure notification exists
            notification = Notification.objects.filter(
                user=user_to_follow,
                title='New Follow Request',
                message__contains=f'Request ID: {existing_request.id}'
            ).first()
            
            if not notification:
                # Create notification if it doesn't exist
                Notification.objects.create(
                    user=user_to_follow,
                    title='New Follow Request',
                    message=f'{request.user.get_full_name()} wants to follow you. Request ID: {existing_request.id}'
                )
            return Response({'error': 'Follow request already sent'}, status=status.HTTP_400_BAD_REQUEST)
        elif existing_request.status == 'REJECTED':
            # If request was previously rejected, update it to pending
            existing_request.status = 'PENDING'
            existing_request.save()
            
            # Create new notification for the target user
            Notification.objects.create(
                user=user_to_follow,
                title='New Follow Request',
                message=f'{request.user.get_full_name()} wants to follow you. Request ID: {existing_request.id}'
            )
            
            return Response({'status': 'follow_request_sent'})
        else:
            # If request was accepted but no following relationship exists (cleanup)
            existing_request.delete()

    # Create new follow request
    try:
        follow_request = FollowRequest.objects.create(
            from_user=request.user,
            to_user=user_to_follow,
            status='PENDING'
        )
        print(f"Created follow request: {follow_request.id}")

        # Create notification for the target user
        notification = Notification.objects.create(
            user=user_to_follow,
            title='New Follow Request',
            message=f'{request.user.get_full_name()} wants to follow you. Request ID: {follow_request.id}'
        )
        print(f"Created notification: {notification.id} for user: {user_to_follow.id}")

        return Response({'status': 'follow_request_sent'})
    except Exception as e:
        print(f"Error in follow_user: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def handle_follow_request(request):
    request_id = request.data.get('request_id')
    action = request.data.get('action')  # 'accept' or 'decline'

    if not request_id or not action:
        return Response({'error': 'request_id and action are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        follow_request = FollowRequest.objects.get(id=request_id, to_user=request.user)
    except FollowRequest.DoesNotExist:
        return Response({'error': 'Follow request not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if request is already handled
    if follow_request.status != 'PENDING':
        return Response({
            'error': f'Follow request already {follow_request.status.lower()}',
            'status': follow_request.status.lower()
        }, status=status.HTTP_400_BAD_REQUEST)

    if action == 'accept':
        try:
            # Create one-way follow relationship
            UserFollowing.objects.get_or_create(
                user=follow_request.from_user,
                following_user=request.user
            )
            
            follow_request.status = 'ACCEPTED'
            follow_request.save()

            # Notify the requester
            Notification.objects.create(
                user=follow_request.from_user,
                title='Follow Request Accepted',
                message=f'{request.user.get_full_name()} accepted your follow request. Request ID: {follow_request.id}'
            )

            return Response({'status': 'accepted'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    elif action == 'decline':
        try:
            follow_request.status = 'REJECTED'
            follow_request.save()

            # Notify the requester
            Notification.objects.create(
                user=follow_request.from_user,
                title='Follow Request Declined',
                message=f'{request.user.get_full_name()} declined your follow request. Request ID: {follow_request.id}'
            )

            return Response({'status': 'declined'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_notifications(request):
    try:
        print(f"Fetching notifications for user: {request.user.id} ({request.user.email})")
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        print(f"Found {notifications.count()} notifications")
        
        # Debug: Print each notification
        for notif in notifications:
            print(f"Notification {notif.id}: {notif.title} - {notif.message} - Created at: {notif.created_at}")
        
        # Add pagination
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginated_notifications = paginator.paginate_queryset(notifications, request)
        
        if paginated_notifications is None:
            print("No notifications after pagination")
            return Response({
                'results': [],
                'next': None,
                'previous': None,
                'count': 0
            })
        
        data = {
            'results': [{
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'is_read': n.is_read,
                'created_at': n.created_at
            } for n in paginated_notifications],
            'next': paginator.get_next_link(),
            'previous': paginator.get_previous_link(),
            'count': notifications.count()
        }
        print(f"Returning {len(data['results'])} notifications")
        print(f"Response data: {data}")
        
        return Response(data)
    except Exception as e:
        print(f"Error fetching notifications: {str(e)}")
        print(f"Full error details: ", e.__dict__)
        return Response(
            {'error': f'Failed to fetch notifications: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({'status': 'success'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unfollow_user(request):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_to_unfollow = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    UserFollowing.objects.filter(
        user=request.user,
        following_user=user_to_unfollow
    ).delete()

    return Response({'status': 'unfollowed'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_following(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        following = UserFollowing.objects.filter(user=user).select_related('following_user')
        
        # Add pagination
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginated_following = paginator.paginate_queryset(following, request)
        
        following_users = [follow.following_user for follow in paginated_following]
        serializer = UserSerializer(following_users, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_followers(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        followers = UserFollowing.objects.filter(following_user=user).select_related('user')
        
        # Add pagination
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginated_followers = paginator.paginate_queryset(followers, request)
        
        follower_users = [follow.user for follow in paginated_followers]
        serializer = UserSerializer(follower_users, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class SearchUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        department = self.request.query_params.get('department', '')
        graduation_year = self.request.query_params.get('graduationYear', '')
        user_type = self.request.query_params.get('userType', '')

        # Start with all users except the current user
        queryset = User.objects.exclude(id=self.request.user.id)

        # Apply search query if provided
        if query:
            queryset = queryset.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query) |
                Q(username__icontains=query)
            )

        # Apply filters only if they are not empty strings
        if department:
            queryset = queryset.filter(department=department)
        
        if graduation_year:
            queryset = queryset.filter(graduation_year=graduation_year)
        
        if user_type:
            queryset = queryset.filter(user_type=user_type)

        return queryset.order_by('first_name', 'last_name')

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_follow_request_status(request, user_id):
    try:
        follow_request = FollowRequest.objects.filter(
            from_user=request.user,
            to_user_id=user_id,
            status='pending'
        ).first()
        
        if follow_request:
            return Response({'status': 'requested'})
        
        is_following = UserFollowing.objects.filter(
            user=request.user,
            following_user_id=user_id
        ).exists()
        
        return Response({'status': 'following' if is_following else 'none'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
