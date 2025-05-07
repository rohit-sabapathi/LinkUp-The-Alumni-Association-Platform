from rest_framework import serializers
from .models import Tag, Article, ArticleLike, ArticleComment, ArticleBookmark, ArticleMedia, Question, Answer, QuestionVote, AnswerVote
from django.contrib.auth import get_user_model

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
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
        fields = ['id', 'file', 'media_type', 'url', 'created_at']

class ArticleCommentSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = ArticleComment
        fields = ['id', 'content', 'author', 'parent', 'created_at', 'updated_at', 'replies']

    def get_replies(self, obj):
        if not hasattr(obj, 'replies'):
            return []
        return ArticleCommentSerializer(obj.replies.all(), many=True).data

class ArticleLikeSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ArticleLike
        fields = ['id', 'user', 'created_at']

class ArticleBookmarkSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ArticleBookmark
        fields = ['id', 'user', 'created_at']

class ArticleSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    media = ArticleMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'slug', 'content', 'author', 'tags', 'view_count', 
                 'created_at', 'updated_at', 'is_published', 'is_liked', 'is_bookmarked',
                 'like_count', 'comment_count', 'media']

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ArticleLike.objects.filter(article=obj, user=request.user).exists()
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ArticleBookmark.objects.filter(article=obj, user=request.user).exists()
        return False

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_comment_count(self, obj):
        return obj.comments.count()

class ArticleCreateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), write_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'tags', 'is_published']

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        article = Article.objects.create(**validated_data)
        
        for tag_name in tags_data:
            tag_name = tag_name.lower().strip()
            try:
                tag = Tag.objects.get(name__iexact=tag_name)
            except Tag.DoesNotExist:
                tag = Tag.objects.create(
                    name=tag_name,
                    is_predefined=False
                )
            article.tags.add(tag)
            
        return article

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        instance = super().update(instance, validated_data)
        
        if tags_data is not None:
            instance.tags.clear()
            for tag_name in tags_data:
                tag_name = tag_name.lower().strip()
                try:
                    tag = Tag.objects.get(name__iexact=tag_name)
                except Tag.DoesNotExist:
                    tag = Tag.objects.create(
                        name=tag_name,
                        is_predefined=False
                    )
                instance.tags.add(tag)
                
        return instance

# Discussion Forum Serializers
class AnswerSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)
    is_upvoted = serializers.SerializerMethodField()
    is_downvoted = serializers.SerializerMethodField()
    
    class Meta:
        model = Answer
        fields = ['id', 'content', 'author', 'is_verified', 'upvote_count', 'downvote_count',
                  'created_at', 'updated_at', 'is_upvoted', 'is_downvoted']
    
    def get_is_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return AnswerVote.objects.filter(answer=obj, user=request.user, value=1).exists()
        return False
    
    def get_is_downvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return AnswerVote.objects.filter(answer=obj, user=request.user, value=-1).exists()
        return False

class QuestionSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    is_upvoted = serializers.SerializerMethodField()
    is_downvoted = serializers.SerializerMethodField()
    answer_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Question
        fields = ['id', 'title', 'slug', 'content', 'author', 'tags', 'view_count',
                  'upvote_count', 'downvote_count', 'created_at', 'updated_at', 'is_upvoted', 
                  'is_downvoted', 'answer_count']
    
    def get_is_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return QuestionVote.objects.filter(question=obj, user=request.user, value=1).exists()
        return False
    
    def get_is_downvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return QuestionVote.objects.filter(question=obj, user=request.user, value=-1).exists()
        return False
    
    def get_answer_count(self, obj):
        return obj.answers.count()

class QuestionDetailSerializer(QuestionSerializer):
    answers = serializers.SerializerMethodField()
    
    class Meta(QuestionSerializer.Meta):
        fields = QuestionSerializer.Meta.fields + ['answers']
    
    def get_answers(self, obj):
        answers = obj.answers.all()
        return AnswerSerializer(answers, many=True, context=self.context).data

class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), write_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'title', 'content', 'tags']
    
    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        question = Question.objects.create(**validated_data)
        
        for tag_name in tags_data:
            tag_name = tag_name.lower().strip()
            try:
                tag = Tag.objects.get(name__iexact=tag_name)
            except Tag.DoesNotExist:
                tag = Tag.objects.create(
                    name=tag_name,
                    is_predefined=False
                )
            question.tags.add(tag)
            
        return question
    
    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        instance = super().update(instance, validated_data)
        
        if tags_data is not None:
            instance.tags.clear()
            for tag_name in tags_data:
                tag_name = tag_name.lower().strip()
                try:
                    tag = Tag.objects.get(name__iexact=tag_name)
                except Tag.DoesNotExist:
                    tag = Tag.objects.create(
                        name=tag_name,
                        is_predefined=False
                    )
                instance.tags.add(tag)
                
        return instance

class AnswerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'content'] 