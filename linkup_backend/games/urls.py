from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WordleGameViewSet, 
    LeaderboardView,
    ConnectionsGameViewSet,
    ConnectionsLeaderboardView
)

router = DefaultRouter()
router.register(r'wordle', WordleGameViewSet, basename='wordle')
router.register(r'connections', ConnectionsGameViewSet, basename='connections')

urlpatterns = [
    path('', include(router.urls)),
    path('wordle/leaderboard/', LeaderboardView.as_view(), name='wordle-leaderboard'),
    path('connections/leaderboard/', ConnectionsLeaderboardView.as_view(), name='connections-leaderboard'),
] 