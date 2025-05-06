from django.shortcuts import render
from django.utils import timezone
from django.db.models import F, Window, Count
from django.db.models.functions import Rank
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import (
    DailyWord, 
    WordleGame, 
    WordleGuess,
    ConnectionsSet,
    ConnectionsGroup,
    ConnectionsWord,
    ConnectionsGame
)
from .serializers import (
    DailyWordSerializer, 
    WordleGameSerializer, 
    WordleGuessSerializer,
    CreateGuessSerializer,
    LeaderboardEntrySerializer,
    ConnectionsSetSerializer,
    ConnectionsGroupSerializer,
    ConnectionsWordSerializer,
    ConnectionsGameSerializer,
    ConnectionsGuessSerializer
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

# Connections Game Views
class ConnectionsGameViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConnectionsGameSerializer
    
    def get_queryset(self):
        return ConnectionsGame.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def domains(self, request):
        """Get available domains for connections game"""
        domains = [
            {'id': 'computer_science', 'name': 'Computer Science', 'color': 'bg-blue-500'},
            {'id': 'electrical_electronics', 'name': 'Electrical & Electronics', 'color': 'bg-yellow-500'},
            {'id': 'mechanical', 'name': 'Mechanical', 'color': 'bg-red-500'},
            {'id': 'aeronautical', 'name': 'Aeronautical', 'color': 'bg-green-500'},
        ]
        
        # Get today's connections set
        today = timezone.now().date()
        try:
            connections_set = ConnectionsSet.objects.get(date=today)
            # For each domain, check if user has already completed it
            for domain in domains:
                game = ConnectionsGame.objects.filter(
                    user=request.user,
                    connections_set=connections_set,
                    domain=domain['id']
                ).first()
                
                domain['completed'] = game.is_solved if game else False
                domain['in_progress'] = game is not None and not game.is_solved
                
        except ConnectionsSet.DoesNotExist:
            # If no connections set exists, just return domains without completion status
            for domain in domains:
                domain['completed'] = False
                domain['in_progress'] = False
        
        return Response(domains)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current day's connections game for the authenticated user"""
        today = timezone.now().date()
        domain = request.query_params.get('domain', 'computer_science')
        
        try:
            connections_set = ConnectionsSet.objects.get(date=today)
        except ConnectionsSet.DoesNotExist:
            return Response(
                {"detail": "No connections set for today"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Get or create game for this domain
        game, created = ConnectionsGame.objects.get_or_create(
            user=request.user,
            connections_set=connections_set,
            domain=domain
        )
        
        serializer = self.get_serializer(game)
        
        # Get all groups for this domain
        domain_groups = connections_set.groups.filter(domain=domain)
        
        # Prepare the words for these groups
        words = []
        for group in domain_groups:
            for word in group.words.all():
                words.append({
                    'id': word.id,
                    'word': word.word
                })
        
        # Get hints for each group
        hints = []
        for group in domain_groups:
            if group.hint:
                hints.append({
                    'id': group.id,
                    'text': group.hint
                })
        
        return Response({
            'game': serializer.data,
            'words': words,
            'max_mistakes': 4,  # 4 is standard for NY Connections
            'hints': hints,
            'domain': domain
        })
    
    @action(detail=False, methods=['post'])
    def guess(self, request):
        """Submit a guess for connections game"""
        today = timezone.now().date()
        domain = request.data.get('domain', 'computer_science')
        
        try:
            connections_set = ConnectionsSet.objects.get(date=today)
        except ConnectionsSet.DoesNotExist:
            return Response(
                {"detail": "No connections set for today"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create game for this domain
        game, created = ConnectionsGame.objects.get_or_create(
            user=request.user,
            connections_set=connections_set,
            domain=domain
        )
        
        # Check if game is already completed
        if game.is_solved or game.mistakes >= 4:
            return Response(
                {"detail": "Game already completed"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate guess
        serializer = ConnectionsGuessSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        word_ids = serializer.validated_data['word_ids']
        
        # Get the words
        try:
            words = ConnectionsWord.objects.filter(id__in=word_ids)
            
            # Check if we got exactly 4 words
            if words.count() != 4:
                return Response(
                    {"detail": "Invalid word selection"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if all words belong to the same group
            groups = set(word.group_id for word in words)
            
            if len(groups) == 1:
                # Correct guess!
                group_id = list(groups)[0]
                group = ConnectionsGroup.objects.get(id=group_id)
                
                # Check if this group was already found
                if group_id in game.groups_found:
                    return Response(
                        {"detail": "Group already found"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Add this group to the found groups
                game.groups_found.append(group_id)
                
                # Check if all groups in this domain are found
                domain_groups = connections_set.groups.filter(domain=domain)
                if len(game.groups_found) == domain_groups.count():
                    game.complete_game(solved=True)
                
                game.save()
                
                return Response({
                    'correct': True,
                    'group': {
                        'id': group.id,
                        'name': group.name,
                        'description': group.description,
                        'color': group.color,
                        'difficulty': group.difficulty,
                        'hint': group.hint
                    },
                    'mistakes': game.mistakes,
                    'groups_found': len(game.groups_found),
                    'total_groups': domain_groups.count(),
                    'game_over': game.is_solved
                })
            else:
                # Incorrect guess
                game.mistakes += 1
                
                # Check if game is over
                game_over = game.mistakes >= 4
                if game_over:
                    game.complete_game(solved=False)
                
                game.save()
                
                return Response({
                    'correct': False,
                    'mistakes': game.mistakes,
                    'groups_found': len(game.groups_found),
                    'total_groups': connections_set.groups.filter(domain=domain).count(),
                    'game_over': game_over
                })
                
        except ConnectionsWord.DoesNotExist:
            return Response(
                {"detail": "Invalid word selection"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def solution(self, request):
        """Get the solution for today's game (only if game is over)"""
        today = timezone.now().date()
        domain = request.query_params.get('domain', 'computer_science')
        
        try:
            connections_set = ConnectionsSet.objects.get(date=today)
        except ConnectionsSet.DoesNotExist:
            return Response(
                {"detail": "No connections set for today"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the user's game for this domain
        try:
            game = ConnectionsGame.objects.get(
                user=request.user,
                connections_set=connections_set,
                domain=domain
            )
            
            # Only show solution if game is over
            if not game.end_time:
                return Response(
                    {"detail": "Cannot view solution for active game"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Return all groups for this domain with their words
            groups = []
            for group in connections_set.groups.filter(domain=domain):
                groups.append({
                    'id': group.id,
                    'name': group.name,
                    'description': group.description,
                    'color': group.color,
                    'difficulty': group.difficulty,
                    'hint': group.hint,
                    'words': [word.word for word in group.words.all()]
                })
                
            return Response({
                'groups': groups,
                'user_found': game.groups_found,
                'is_solved': game.is_solved
            })
            
        except ConnectionsGame.DoesNotExist:
            return Response(
                {"detail": "No game found for this domain"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ConnectionsLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get leaderboard for today's connections game"""
        today = timezone.now().date()
        
        try:
            connections_set = ConnectionsSet.objects.get(date=today)
        except ConnectionsSet.DoesNotExist:
            return Response(
                {"detail": "No connections set for today"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all completed games for today's set
        completed_games = ConnectionsGame.objects.filter(
            connections_set=connections_set,
            end_time__isnull=False
        ).order_by(
            # First, put successful games at the top
            F('is_solved').desc(),
            # Then sort by fewer mistakes
            F('mistakes'),
            # Then sort by time taken
            F('end_time') - F('start_time')
        )
        
        # Add rank to each game
        games_with_rank = completed_games.annotate(
            rank=Window(
                expression=Rank(),
                order_by=[
                    F('is_solved').desc(),
                    F('mistakes'),
                    F('end_time') - F('start_time')
                ]
            )
        )
        
        # Serialize games with user info
        result = []
        for game in games_with_rank:
            result.append({
                'user': {
                    'id': game.user.id,
                    'username': game.user.username,
                    'profile_image': game.user.profile_image if hasattr(game.user, 'profile_image') else None
                },
                'is_solved': game.is_solved,
                'mistakes': game.mistakes,
                'time_taken': (game.end_time - game.start_time).total_seconds(),
                'groups_found': len(game.groups_found),
                'rank': game.rank
            })
        
        # Find user's rank
        user_entry = next(
            (item for item in result if item['user']['id'] == request.user.id),
            None
        )
        
        return Response({
            'leaderboard': result,
            'user_entry': user_entry
        })
