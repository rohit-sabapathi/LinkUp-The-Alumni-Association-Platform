from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tags', views.TagViewSet, basename='tag')
router.register(r'articles', views.ArticleViewSet, basename='article')

urlpatterns = [
    path('', include(router.urls)),
] 