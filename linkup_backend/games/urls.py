from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WordleGameViewSet, LeaderboardView

router = DefaultRouter()
router.register(r'wordle', WordleGameViewSet, basename='wordle')

urlpatterns = [
    path('', include(router.urls)),
    path('wordle/leaderboard/', LeaderboardView.as_view(), name='wordle-leaderboard'),
] 