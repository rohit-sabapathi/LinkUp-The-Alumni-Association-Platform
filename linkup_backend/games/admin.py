from django.contrib import admin
from .models import DailyWord, WordleGame, WordleGuess

@admin.register(DailyWord)
class DailyWordAdmin(admin.ModelAdmin):
    list_display = ('word', 'date')
    search_fields = ('word',)
    date_hierarchy = 'date'

class WordleGuessInline(admin.TabularInline):
    model = WordleGuess
    extra = 0
    readonly_fields = ('guess', 'timestamp')

@admin.register(WordleGame)
class WordleGameAdmin(admin.ModelAdmin):
    list_display = ('user', 'daily_word', 'attempts', 'is_solved', 'start_time', 'end_time')
    list_filter = ('is_solved', 'daily_word__date')
    search_fields = ('user__username', 'daily_word__word')
    date_hierarchy = 'start_time'
    inlines = [WordleGuessInline]

@admin.register(WordleGuess)
class WordleGuessAdmin(admin.ModelAdmin):
    list_display = ('game', 'guess', 'timestamp')
    list_filter = ('game__daily_word__date',)
    search_fields = ('guess', 'game__user__username')
