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
