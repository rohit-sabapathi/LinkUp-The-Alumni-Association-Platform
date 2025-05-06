from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DailyWord, WordleGame, WordleGuess

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class DailyWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyWord
        fields = ['id', 'date']  # Exclude the actual word to prevent cheating

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

class CreateGuessSerializer(serializers.ModelSerializer):
    class Meta:
        model = WordleGuess
        fields = ['guess']
        
    def validate_guess(self, value):
        if len(value) != 5:
            raise serializers.ValidationError("Guess must be exactly 5 letters.")
        if not value.isalpha():
            raise serializers.ValidationError("Guess must contain only letters.")
        return value.lower() 