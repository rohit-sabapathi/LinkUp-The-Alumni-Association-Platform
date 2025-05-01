from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, 
    JoinRequestViewSet, 
    WorkspaceDetailView,
    UserProjectsView,
    UserJoinRequestsView
)

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')
router.register(r'join-requests', JoinRequestViewSet, basename='join-request')

urlpatterns = [
    path('', include(router.urls)),
    path('user/projects/', UserProjectsView.as_view(), name='user-projects'),
    path('user/join-requests/', UserJoinRequestsView.as_view(), name='user-join-requests'),
    path('workspace/<slug:slug>/', WorkspaceDetailView.as_view(), name='workspace-detail'),
] 