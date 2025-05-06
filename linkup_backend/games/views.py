from django.shortcuts import render
from django.utils import timezone
from django.db.models import F, Window, Count
from django.db.models.functions import Rank
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import DailyWord, WordleGame, WordleGuess
from .serializers import (
    DailyWordSerializer, 
    WordleGameSerializer, 
    WordleGuessSerializer,
    CreateGuessSerializer,
    LeaderboardEntrySerializer
)

# Create your views here.

class WordleGameViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WordleGameSerializer
    
    def get_queryset(self):
        return WordleGame.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current day's game for the authenticated user"""
        today = timezone.now().date()
        
        try:
            daily_word = DailyWord.objects.get(date=today)
        except DailyWord.DoesNotExist:
            return Response(
                {"detail": "No word set for today"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        game, created = WordleGame.objects.get_or_create(
            user=request.user,
            daily_word=daily_word
        )
        
        serializer = self.get_serializer(game)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def guess(self, request):
        """Submit a guess for today's word"""
        today = timezone.now().date()
        
        try:
            daily_word = DailyWord.objects.get(date=today)
        except DailyWord.DoesNotExist:
            return Response(
                {"detail": "No word set for today"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create game
        game, created = WordleGame.objects.get_or_create(
            user=request.user,
            daily_word=daily_word
        )
        
        # Check if game is already completed
        if game.is_solved or game.attempts >= 6:
            return Response(
                {"detail": "Game already completed"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate guess
        serializer = CreateGuessSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        guess = serializer.validated_data['guess']
        
        # Create guess record
        WordleGuess.objects.create(
            game=game,
            guess=guess
        )
        
        # Update game attempts
        game.attempts += 1
        
        # Check if guess is correct
        is_correct = (guess.lower() == daily_word.word.lower())
        
        # Process result
        result = self._process_guess(guess, daily_word.word)
        
        if is_correct:
            game.complete_game(solved=True)
        elif game.attempts >= 6:
            game.complete_game(solved=False)
        
        game.save()
        
        return Response({
            'result': result,
            'correct': is_correct,
            'attempts': game.attempts,
            'game_over': is_correct or game.attempts >= 6
        })
    
    def _process_guess(self, guess, target):
        """
        Process a guess and return the correctness of each letter.
        Returns a list of dictionaries with letter and status (correct, present, absent).
        """
        guess = guess.lower()
        target = target.lower()
        
        # First pass: Mark correct letters
        result = [{'letter': letter, 'status': 'absent'} for letter in guess]
        target_letters = list(target)
        
        # First check for correct positions
        for i in range(5):
            if guess[i] == target[i]:
                result[i]['status'] = 'correct'
                target_letters[i] = None  # Mark as used
        
        # Then check for letters in wrong positions
        for i in range(5):
            if result[i]['status'] == 'absent' and guess[i] in target_letters:
                pos = target_letters.index(guess[i])
                result[i]['status'] = 'present'
                target_letters[pos] = None  # Mark as used
        
        return result


class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get leaderboard for today's word"""
        today = timezone.now().date()
        
        try:
            daily_word = DailyWord.objects.get(date=today)
        except DailyWord.DoesNotExist:
            return Response(
                {"detail": "No word set for today"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all completed games for today's word
        completed_games = WordleGame.objects.filter(
            daily_word=daily_word,
            end_time__isnull=False
        ).order_by(
            # First, put successful games at the top
            F('is_solved').desc(),
            # Then sort by fewer attempts
            F('attempts'),
            # Then sort by time taken
            F('end_time') - F('start_time')
        )
        
        # Add rank to each game
        games_with_rank = completed_games.annotate(
            rank=Window(
                expression=Rank(),
                order_by=[
                    F('is_solved').desc(),
                    F('attempts'),
                    F('end_time') - F('start_time')
                ]
            )
        )
        
        serializer = LeaderboardEntrySerializer(games_with_rank, many=True)
        
        # Find user's rank
        user_entry = next(
            (item for item in serializer.data if item['user']['id'] == request.user.id),
            None
        )
        
        return Response({
            'leaderboard': serializer.data,
            'user_entry': user_entry
        })
