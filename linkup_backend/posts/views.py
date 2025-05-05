from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Post, Comment, Poll, PollOption
from .serializers import PostSerializer, CommentSerializer, CreatePollSerializer

User = get_user_model()

class UserPostsView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return Post.objects.filter(author_id=user_id).prefetch_related(
            'author', 'likes', 'saved_by', 'comments', 'comments__author', 'comments__likes'
        ).order_by('-created_at')

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.prefetch_related(
            'author', 'likes', 'saved_by', 'comments', 'comments__author', 'comments__likes'
        ).order_by('-created_at')

    def perform_create(self, serializer):
        # Determine media type if media is present
        media_type = self.request.data.get('media_type', 'none')
        serializer.save(author=self.request.user, media_type=media_type)

    @transaction.atomic
    @action(detail=False, methods=['post'], url_path='create-poll')
    def create_poll(self, request):
        poll_serializer = CreatePollSerializer(data=request.data)
        
        if not poll_serializer.is_valid():
            return Response(poll_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # Create post first
        post = Post.objects.create(
            author=request.user,
            content=request.data.get('content', ''),
            is_poll=True
        )
        
        # Create poll
        poll = Poll.objects.create(
            post=post,
            question=poll_serializer.validated_data['question'],
            end_date=poll_serializer.validated_data.get('end_date')
        )
        
        # Create poll options
        for option_text in poll_serializer.validated_data['options']:
            PollOption.objects.create(poll=poll, text=option_text)
            
        # Return the created post with poll data
        return Response(PostSerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='vote')
    def vote(self, request, pk=None):
        post = self.get_object()
        if not post.is_poll:
            return Response({"detail": "This is not a poll post."}, status=status.HTTP_400_BAD_REQUEST)
            
        option_id = request.data.get('option_id')
        if not option_id:
            return Response({"detail": "No option selected."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            option = post.poll.options.get(id=option_id)
        except PollOption.DoesNotExist:
            return Response({"detail": "Invalid option."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if poll has ended
        if post.poll.is_ended:
            return Response({"detail": "This poll has ended."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Remove any previous votes by this user on this poll
        for poll_option in post.poll.options.all():
            poll_option.votes.remove(request.user)
            
        # Add vote to selected option
        option.votes.add(request.user)
        
        return Response(PostSerializer(post, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        if post.likes.filter(id=request.user.id).exists():
            post.likes.remove(request.user)
            return Response({'status': 'unliked'})
        else:
            post.likes.add(request.user)
            return Response({'status': 'liked'})

    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        post = self.get_object()
        if post.saved_by.filter(id=request.user.id).exists():
            post.saved_by.remove(request.user)
            return Response({'status': 'unsaved'})
        else:
            post.saved_by.add(request.user)
            return Response({'status': 'saved'})

    @action(detail=False, methods=['get'])
    def saved(self, request):
        saved_posts = Post.objects.filter(saved_by=request.user)
        page = self.paginate_queryset(saved_posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(saved_posts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def user(self, request, user_pk=None):
        user_posts = self.get_queryset().filter(author_id=user_pk)
        page = self.paginate_queryset(user_posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(user_posts, many=True)
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs.get('post_pk')).select_related('author')

    def perform_create(self, serializer):
        post = get_object_or_404(Post, pk=self.kwargs.get('post_pk'))
        serializer.save(author=self.request.user, post=post)

    @action(detail=True, methods=['post'])
    def like(self, request, post_pk=None, pk=None):
        comment = self.get_object()
        if comment.likes.filter(id=request.user.id).exists():
            comment.likes.remove(request.user)
            return Response({'status': 'unliked'})
        else:
            comment.likes.add(request.user)
            return Response({'status': 'liked'})
