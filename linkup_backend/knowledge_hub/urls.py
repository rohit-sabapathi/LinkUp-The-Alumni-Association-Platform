from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from . import views

# Default router for top-level endpoints
router = DefaultRouter()
router.register(r'tags', views.TagViewSet, basename='tag')
router.register(r'articles', views.ArticleViewSet, basename='article')
router.register(r'questions', views.QuestionViewSet, basename='question')

# Nested router for answers under questions
questions_router = routers.NestedSimpleRouter(router, r'questions', lookup='question')
questions_router.register(r'answers', views.AnswerViewSet, basename='question-answer')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(questions_router.urls)),
] 