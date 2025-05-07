from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Tag, Article, ArticleLike, ArticleComment, ArticleBookmark, ArticleMedia
from .serializers import (
    TagSerializer, ArticleSerializer, ArticleCreateSerializer,
    ArticleCommentSerializer, ArticleLikeSerializer, ArticleBookmarkSerializer
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
