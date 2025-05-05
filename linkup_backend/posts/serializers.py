from rest_framework import serializers
from .models import Post, Comment, Poll, PollOption
from django.contrib.auth import get_user_model

User = get_user_model()

class UserBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'profile_picture']
        
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class CommentSerializer(serializers.ModelSerializer):
    author = UserBriefSerializer(read_only=True)
    like_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content', 'created_at', 'updated_at', 'author', 'like_count', 'is_liked']

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

class PollOptionSerializer(serializers.ModelSerializer):
    vote_count = serializers.ReadOnlyField()
    percentage = serializers.ReadOnlyField()
    has_voted = serializers.SerializerMethodField()
    
    class Meta:
        model = PollOption
        fields = ['id', 'text', 'vote_count', 'percentage', 'has_voted']
    
    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.votes.filter(id=request.user.id).exists()
        return False

class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    total_votes = serializers.ReadOnlyField()
    is_ended = serializers.ReadOnlyField()
    
    class Meta:
        model = Poll
        fields = ['id', 'question', 'options', 'end_date', 'total_votes', 'is_ended']

class PostSerializer(serializers.ModelSerializer):
    author = UserBriefSerializer(read_only=True)
    like_count = serializers.ReadOnlyField()
    comment_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    poll = PollSerializer(read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'content', 'media', 'created_at', 'updated_at', 
            'author', 'like_count', 'comment_count', 
            'is_liked', 'is_saved', 'is_poll', 'poll'
        ]

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by.filter(id=request.user.id).exists()
        return False

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

class CreatePollSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=255)
    options = serializers.ListField(
        child=serializers.CharField(max_length=255),
        min_length=2,
        max_length=10
    )
    end_date = serializers.DateTimeField(required=False, allow_null=True)
