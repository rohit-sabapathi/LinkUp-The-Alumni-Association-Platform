from rest_framework import serializers
from .models import Tag, Article, ArticleLike, ArticleComment, ArticleBookmark, ArticleMedia
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'is_predefined']

class ArticleMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleMedia
        fields = ['id', 'file', 'media_type', 'url']

class ArticleCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = ArticleComment
        fields = ['id', 'author', 'content', 'created_at', 'updated_at', 'replies']
        read_only_fields = ['author']

    def get_replies(self, obj):
        if obj.parent is None:  # Only get replies for top-level comments
            replies = ArticleComment.objects.filter(parent=obj)
            return ArticleCommentSerializer(replies, many=True).data
        return []

class ArticleSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    media = ArticleMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'author', 'tags',
            'view_count', 'created_at', 'updated_at', 'is_published',
            'likes_count', 'comments_count', 'is_liked', 'is_bookmarked',
            'media'
        ]
        read_only_fields = ['author', 'slug', 'view_count']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

class ArticleCreateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(),
        write_only=True
    )
    media = ArticleMediaSerializer(many=True, required=False)

    class Meta:
        model = Article
        fields = ['title', 'content', 'tags', 'media']

    def create(self, validated_data):
        tags_data = validated_data.pop('tags')
        media_data = validated_data.pop('media', [])
        
        # Create article (without duplicate author field)
        article = Article.objects.create(
            author=self.context['request'].user,
            title=validated_data.get('title'),
            content=validated_data.get('content')
        )

        # Handle tags
        for tag_name in tags_data:
            tag, created = Tag.objects.get_or_create(
                name=tag_name,
                defaults={'is_predefined': False}
            )
            article.tags.add(tag)

        # Handle media
        for media_item in media_data:
            ArticleMedia.objects.create(article=article, **media_item)

        return article

class ArticleLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleLike
        fields = ['id', 'created_at']
        read_only_fields = ['user', 'article']

class ArticleBookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleBookmark
        fields = ['id', 'created_at']
        read_only_fields = ['user', 'article'] 