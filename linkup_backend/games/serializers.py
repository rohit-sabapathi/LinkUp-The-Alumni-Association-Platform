from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    DailyWord, 
    WordleGame, 
    WordleGuess,
    ConnectionsSet,
    ConnectionsGroup,
    ConnectionsWord,
    ConnectionsGame
)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class DailyWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyWord
        fields = ['id', 'word', 'date']

class WordleGuessSerializer(serializers.ModelSerializer):
    class Meta:
        model = WordleGuess
        fields = ['id', 'guess', 'timestamp']

class WordleGameSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    guesses = WordleGuessSerializer(many=True, read_only=True)
    daily_word = DailyWordSerializer(read_only=True)
    time_taken = serializers.SerializerMethodField()
    
    class Meta:
        model = WordleGame
        fields = ['id', 'user', 'daily_word', 'start_time', 'end_time', 
                  'attempts', 'is_solved', 'guesses', 'time_taken']
    
    def get_time_taken(self, obj):
        return obj.time_taken()

class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    time_taken = serializers.SerializerMethodField()
    rank = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = WordleGame
        fields = ['id', 'user', 'attempts', 'is_solved', 'time_taken', 'rank']
    
    def get_time_taken(self, obj):
        return obj.time_taken()

class CreateGuessSerializer(serializers.Serializer):
    guess = serializers.CharField(
        min_length=5,
        max_length=5,
        required=True
    )
    
    def validate_guess(self, value):
        if not value.isalpha():
            raise serializers.ValidationError("Guess must contain only alphabetic characters")
        return value.upper()  # Convert to uppercase

class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_image']

class ConnectionsWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionsWord
        fields = ['id', 'word']

class ConnectionsGroupSerializer(serializers.ModelSerializer):
    words = ConnectionsWordSerializer(many=True, read_only=True)
    
    class Meta:
        model = ConnectionsGroup
        fields = ['id', 'name', 'description', 'difficulty', 'color', 'words']

class ConnectionsSetSerializer(serializers.ModelSerializer):
    groups = ConnectionsGroupSerializer(many=True, read_only=True)
    
    class Meta:
        model = ConnectionsSet
        fields = ['id', 'date', 'groups']

class ConnectionsGameSerializer(serializers.ModelSerializer):
    connections_set = ConnectionsSetSerializer(read_only=True)
    
    class Meta:
        model = ConnectionsGame
        fields = [
            'id', 'connections_set', 'start_time', 'end_time', 
            'mistakes', 'is_solved', 'groups_found'
        ]

class ConnectionsGuessSerializer(serializers.Serializer):
    word_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=4,
        max_length=4
    ) 