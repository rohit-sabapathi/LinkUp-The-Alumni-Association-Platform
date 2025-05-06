from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinLengthValidator, MaxLengthValidator

class DailyWord(models.Model):
    word = models.CharField(max_length=5, validators=[MinLengthValidator(5), MaxLengthValidator(5)])
    date = models.DateField(unique=True)
    
    def __str__(self):
        return f"{self.word} ({self.date})"
    
    class Meta:
        ordering = ['-date']

class WordleGame(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wordle_games')
    daily_word = models.ForeignKey(DailyWord, on_delete=models.CASCADE, related_name='games')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    is_solved = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username}'s game on {self.daily_word.date}"
    
    def complete_game(self, solved=False):
        self.end_time = timezone.now()
        self.is_solved = solved
        self.save()
    
    def time_taken(self):
        if not self.end_time:
            return None
        return (self.end_time - self.start_time).total_seconds()
    
    class Meta:
        unique_together = ['user', 'daily_word']
        ordering = ['-daily_word__date', 'end_time']

class WordleGuess(models.Model):
    game = models.ForeignKey(WordleGame, on_delete=models.CASCADE, related_name='guesses')
    guess = models.CharField(max_length=5, validators=[MinLengthValidator(5), MaxLengthValidator(5)])
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.guess} ({self.game.user.username})"
    
    class Meta:
        ordering = ['timestamp']

# Connections Game Models
class ConnectionsSet(models.Model):
    date = models.DateField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Connections Set for {self.date}"
    
    class Meta:
        ordering = ['-date']

class ConnectionsGroup(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('very_hard', 'Very Hard'),
    ]
    
    DOMAIN_CHOICES = [
        ('computer_science', 'Computer Science'),
        ('electrical_electronics', 'Electrical & Electronics'),
        ('mechanical', 'Mechanical'),
        ('aeronautical', 'Aeronautical'),
    ]
    
    connections_set = models.ForeignKey(ConnectionsSet, on_delete=models.CASCADE, related_name='groups')
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    color = models.CharField(max_length=20)  # CSS color value or name
    domain = models.CharField(max_length=50, choices=DOMAIN_CHOICES, default='computer_science')
    hint = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"{self.name} ({self.connections_set.date})"

class ConnectionsWord(models.Model):
    group = models.ForeignKey(ConnectionsGroup, on_delete=models.CASCADE, related_name='words')
    word = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.word} ({self.group.name})"

class ConnectionsGame(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='connections_games')
    connections_set = models.ForeignKey(ConnectionsSet, on_delete=models.CASCADE, related_name='games')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    mistakes = models.PositiveSmallIntegerField(default=0)
    is_solved = models.BooleanField(default=False)
    groups_found = models.JSONField(default=list)  # Store IDs of found groups
    domain = models.CharField(max_length=50, blank=True, null=True)  # To store the current domain the user is playing
    
    def __str__(self):
        return f"{self.user.username}'s connections game on {self.connections_set.date}"
    
    def complete_game(self, solved=False):
        self.end_time = timezone.now()
        self.is_solved = solved
        self.save()
    
    def time_taken(self):
        if not self.end_time:
            return None
        return (self.end_time - self.start_time).total_seconds()
    
    class Meta:
        unique_together = ['user', 'connections_set', 'domain']
        ordering = ['-connections_set__date', 'end_time']
