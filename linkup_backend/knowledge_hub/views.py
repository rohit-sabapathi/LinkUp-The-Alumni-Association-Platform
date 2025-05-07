from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, F
from .models import (
    Tag, Article, ArticleLike, ArticleComment, ArticleBookmark, ArticleMedia,
    Question, Answer, QuestionVote, AnswerVote, QuestionView
)
from .serializers import (
    TagSerializer, ArticleSerializer, ArticleCreateSerializer,
    ArticleCommentSerializer, ArticleLikeSerializer, ArticleBookmarkSerializer,
    QuestionSerializer, QuestionDetailSerializer, QuestionCreateUpdateSerializer,
    AnswerSerializer, AnswerCreateSerializer
)

# Create your views here.

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.filter(is_published=True)
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'tags__name']

    def get_serializer_class(self):
        if self.action == 'create':
            return ArticleCreateSerializer
        return ArticleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        tag = self.request.query_params.get('tag', None)
        if tag:
            queryset = queryset.filter(tags__name=tag)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post', 'delete'])
    def like(self, request, pk=None):
        article = self.get_object()
        
        if request.method == 'DELETE':
            # Handle unlike
            try:
                like = ArticleLike.objects.get(article=article, user=request.user)
                like.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            except ArticleLike.DoesNotExist:
                return Response({"error": "You haven't liked this article"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Handle like (POST)
            like, created = ArticleLike.objects.get_or_create(
                article=article,
                user=request.user
            )
            if not created:
                like.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response(ArticleLikeSerializer(like).data)

    @action(detail=True, methods=['post', 'delete'])
    def bookmark(self, request, pk=None):
        article = self.get_object()
        
        if request.method == 'DELETE':
            # Handle unbookmark
            try:
                bookmark = ArticleBookmark.objects.get(article=article, user=request.user)
                bookmark.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            except ArticleBookmark.DoesNotExist:
                return Response({"error": "You haven't bookmarked this article"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Handle bookmark (POST)
            bookmark, created = ArticleBookmark.objects.get_or_create(
                article=article,
                user=request.user
            )
            if not created:
                bookmark.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response(ArticleBookmarkSerializer(bookmark).data)

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        article = self.get_object()
        parent_id = request.data.get('parent_id')
        
        comment_data = {
            'article': article,
            'author': request.user,
            'content': request.data.get('content')
        }
        
        if parent_id:
            try:
                parent_comment = ArticleComment.objects.get(id=parent_id, article=article)
                comment_data['parent'] = parent_comment
            except ArticleComment.DoesNotExist:
                return Response(
                    {'error': 'Parent comment not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        comment = ArticleComment.objects.create(**comment_data)
        return Response(ArticleCommentSerializer(comment).data)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        article = self.get_object()
        comments = ArticleComment.objects.filter(article=article, parent=None)
        return Response(ArticleCommentSerializer(comments, many=True).data)

    @action(detail=True, methods=['get'])
    def increment_view(self, request, pk=None):
        article = self.get_object()
        article.view_count += 1
        article.save()
        return Response({'view_count': article.view_count})

# Discussion Forum ViewSets
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'tags__name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuestionDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateUpdateSerializer
        return QuestionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by tag if provided
        tag = self.request.query_params.get('tag', None)
        if tag:
            queryset = queryset.filter(tags__name=tag)
        
        # Apply sorting
        sort_by = self.request.query_params.get('sort_by', 'recent')
        if sort_by == 'votes':
            queryset = queryset.order_by('-upvote_count', '-created_at')
        elif sort_by == 'unanswered':
            queryset = queryset.filter(answers__isnull=True).order_by('-created_at')
        else:  # Default to recent
            queryset = queryset.order_by('-created_at')
            
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        question = self.get_object()
        vote_type = request.data.get('vote_type')
        
        if vote_type not in ['upvote', 'downvote']:
            return Response(
                {'error': 'Vote type must be either "upvote" or "downvote"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vote_value = 1 if vote_type == 'upvote' else -1
        
        # Check if the user has already voted
        existing_vote = QuestionVote.objects.filter(
            question=question,
            user=request.user
        ).first()
        
        if existing_vote:
            # If the vote is the same, remove it (toggle off)
            if existing_vote.value == vote_value:
                # Update question's vote count
                if vote_value == 1:
                    question.upvote_count = F('upvote_count') - 1
                else:
                    question.downvote_count = F('downvote_count') - 1
                
                # Delete the vote
                existing_vote.delete()
                question.save()
                return Response({'status': 'vote removed'})
            else:
                # Change the vote (e.g., from upvote to downvote)
                existing_vote.value = vote_value
                existing_vote.save()
                
                # Update question's vote counts
                if vote_value == 1:
                    # Changing from downvote to upvote
                    question.downvote_count = F('downvote_count') - 1
                    question.upvote_count = F('upvote_count') + 1
                else:
                    # Changing from upvote to downvote
                    question.upvote_count = F('upvote_count') - 1
                    question.downvote_count = F('downvote_count') + 1
                
                question.save()
                return Response({'status': 'vote changed'})
        else:
            # Create a new vote
            QuestionVote.objects.create(
                question=question,
                user=request.user,
                value=vote_value
            )
            
            # Update question's vote count
            if vote_value == 1:
                question.upvote_count = F('upvote_count') + 1
            else:
                question.downvote_count = F('downvote_count') + 1
            
            question.save()
            return Response({'status': 'vote added'})
    
    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        question = self.get_object()
        serializer = AnswerCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(
                question=question,
                author=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def increment_view(self, request, pk=None):
        question = self.get_object()
        
        # Only increment view count if this user hasn't viewed it before
        view, created = QuestionView.objects.get_or_create(
            question=question,
            user=request.user
        )
        
        # Only increment the view count if this is a new view
        if created:
            question.view_count += 1
            question.save()
            
        return Response({'view_count': question.view_count})
    
class AnswerViewSet(viewsets.ModelViewSet):
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AnswerCreateSerializer
        return AnswerSerializer
    
    def perform_create(self, serializer):
        question_id = self.kwargs.get('question_pk')
        question = Question.objects.get(id=question_id)
        serializer.save(
            question=question,
            author=self.request.user
        )
    
    def get_queryset(self):
        """Override queryset to filter by question if question_pk is provided"""
        queryset = super().get_queryset()
        question_pk = self.kwargs.get('question_pk')
        if question_pk:
            queryset = queryset.filter(question__id=question_pk)
        return queryset
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None, question_pk=None):
        """Vote on an answer"""
        # First, validate that this answer belongs to the question
        answer = self.get_object()
        
        if question_pk and int(answer.question.id) != int(question_pk):
            return Response(
                {'error': 'This answer does not belong to the specified question'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vote_type = request.data.get('vote_type')
        
        if vote_type not in ['upvote', 'downvote']:
            return Response(
                {'error': 'Vote type must be either "upvote" or "downvote"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vote_value = 1 if vote_type == 'upvote' else -1
        
        # Check if the user has already voted
        existing_vote = AnswerVote.objects.filter(
            answer=answer,
            user=request.user
        ).first()
        
        if existing_vote:
            # If the vote is the same, remove it (toggle off)
            if existing_vote.value == vote_value:
                # Update answer's vote count
                if vote_value == 1:
                    answer.upvote_count = F('upvote_count') - 1
                else:
                    answer.downvote_count = F('downvote_count') - 1
                
                # Delete the vote
                existing_vote.delete()
                answer.save()
                return Response({'status': 'vote removed'})
            else:
                # Change the vote (e.g., from upvote to downvote)
                existing_vote.value = vote_value
                existing_vote.save()
                
                # Update answer's vote counts
                if vote_value == 1:
                    # Changing from downvote to upvote
                    answer.downvote_count = F('downvote_count') - 1
                    answer.upvote_count = F('upvote_count') + 1
                else:
                    # Changing from upvote to downvote
                    answer.upvote_count = F('upvote_count') - 1
                    answer.downvote_count = F('downvote_count') + 1
                
                answer.save()
                return Response({'status': 'vote changed'})
        else:
            # Create a new vote
            AnswerVote.objects.create(
                answer=answer,
                user=request.user,
                value=vote_value
            )
            
            # Update answer's vote count
            if vote_value == 1:
                answer.upvote_count = F('upvote_count') + 1
            else:
                answer.downvote_count = F('downvote_count') + 1
            
            answer.save()
            return Response({'status': 'vote added'})
    
    @action(detail=True, methods=['post'])
    def mark_verified(self, request, pk=None, question_pk=None):
        answer = self.get_object()
        question = answer.question
        
        # Additional validation for nested routes
        if question_pk and int(question.id) != int(question_pk):
            return Response(
                {'error': 'This answer does not belong to the specified question'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify that the request user is the author of the question
        if request.user != question.author:
            return Response(
                {'error': 'Only the question author can mark an answer as verified'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mark this answer as verified
        answer.is_verified = True
        answer.save()
        
        return Response({'status': 'answer marked as verified'})
    
    @action(detail=True, methods=['post'])
    def unmark_verified(self, request, pk=None, question_pk=None):
        answer = self.get_object()
        question = answer.question
        
        # Additional validation for nested routes
        if question_pk and int(question.id) != int(question_pk):
            return Response(
                {'error': 'This answer does not belong to the specified question'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify that the request user is the author of the question
        if request.user != question.author:
            return Response(
                {'error': 'Only the question author can unmark a verified answer'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Unmark this answer
        answer.is_verified = False
        answer.save()
        
        return Response({'status': 'answer unmarked as verified'})
