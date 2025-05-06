from django.contrib import admin
from .models import (
    DailyWord, 
    WordleGame, 
    WordleGuess,
    ConnectionsSet,
    ConnectionsGroup,
    ConnectionsWord,
    ConnectionsGame
)

@admin.register(DailyWord)
class DailyWordAdmin(admin.ModelAdmin):
    list_display = ('word', 'date')
    search_fields = ('word',)
    date_hierarchy = 'date'

class WordleGuessInline(admin.TabularInline):
    model = WordleGuess
    extra = 0
    readonly_fields = ('guess', 'timestamp')
    can_delete = False

@admin.register(WordleGame)
class WordleGameAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'daily_word', 'attempts', 'is_solved', 'start_time', 'end_time')
    list_filter = ('is_solved', 'daily_word__date')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('start_time',)
    inlines = [WordleGuessInline]

@admin.register(WordleGuess)
class WordleGuessAdmin(admin.ModelAdmin):
    list_display = ('game', 'guess', 'timestamp')
    list_filter = ('game__daily_word__date',)
    search_fields = ('guess', 'game__user__username')

# Connections Game Admin

class ConnectionsWordInline(admin.TabularInline):
    model = ConnectionsWord
    extra = 4
    max_num = 4

class ConnectionsGroupInline(admin.TabularInline):
    model = ConnectionsGroup
    extra = 4
    max_num = 4
    inlines = [ConnectionsWordInline]  # Note: This is not supported directly in Django admin
    fieldsets = [
        (None, {'fields': ['name', 'description', 'difficulty', 'color']}),
    ]

@admin.register(ConnectionsSet)
class ConnectionsSetAdmin(admin.ModelAdmin):
    list_display = ['id', 'date', 'group_count', 'created_at']
    list_filter = ['date']
    inlines = [ConnectionsGroupInline]
    
    def group_count(self, obj):
        return obj.groups.count()
    group_count.short_description = 'Groups'

@admin.register(ConnectionsGroup)
class ConnectionsGroupAdmin(admin.ModelAdmin):
    list_display = ['id', 'connections_set', 'name', 'difficulty', 'word_count']
    list_filter = ['difficulty', 'connections_set__date']
    search_fields = ['name', 'description']
    inlines = [ConnectionsWordInline]
    
    def word_count(self, obj):
        return obj.words.count()
    word_count.short_description = 'Words'

@admin.register(ConnectionsWord)
class ConnectionsWordAdmin(admin.ModelAdmin):
    list_display = ['id', 'word', 'group']
    list_filter = ['group__connections_set__date', 'group__name']
    search_fields = ['word', 'group__name']

@admin.register(ConnectionsGame)
class ConnectionsGameAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'connections_set', 'mistakes', 'is_solved', 'groups_found_count', 'start_time', 'end_time']
    list_filter = ['is_solved', 'connections_set__date']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['start_time', 'groups_found']
    
    def groups_found_count(self, obj):
        return len(obj.groups_found)
    groups_found_count.short_description = 'Groups Found'
