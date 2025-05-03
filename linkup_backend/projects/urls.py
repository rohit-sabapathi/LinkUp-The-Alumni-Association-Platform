from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, 
    JoinRequestViewSet, 
    WorkspaceDetailView,
    UserProjectsView,
    UserJoinRequestsView,
    UserWorkspacesView,
    ResourceCategoryViewSet,
    ResourceViewSet,
    WorkspaceResourcesView
)

router = DefaultRouter()
router.register(r'resource-categories', ResourceCategoryViewSet, basename='resource-category')
router.register(r'join-requests', JoinRequestViewSet, basename='join-request')
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
    path('user/projects/', UserProjectsView.as_view(), name='user-projects'),
    path('user/join-requests/', UserJoinRequestsView.as_view(), name='user-join-requests'),
    path('user/workspaces/', UserWorkspacesView.as_view(), name='user-workspaces'),
    path('workspace/<slug:slug>/', WorkspaceDetailView.as_view(), name='workspace-detail'),
    path('workspace/<slug:workspace_slug>/resources/', WorkspaceResourcesView.as_view(), name='workspace-resources'),
] 