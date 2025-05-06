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
    WorkspaceResourcesView,
    # Kanban Board views
    BoardViewSet,
    ColumnViewSet,
    TaskViewSet,
    TaskCommentViewSet,
    WorkspaceBoardView,
    # Progress Log views
    ProgressLogViewSet,
    WorkspaceProgressLogsView,
    UserProgressLogsView,
    CurrentWeekProgressLogView,
    # Project invitation views
    ProjectInvitationViewSet,
    UserInvitationsView,
    FundingViewSet,
    close_funding_request,
    delete_funding_request,
    get_completed_funding_requests
)

router = DefaultRouter()
router.register(r'resource-categories', ResourceCategoryViewSet, basename='resource-category')
router.register(r'join-requests', JoinRequestViewSet, basename='join-request')
router.register(r'resources', ResourceViewSet, basename='resource')
# Register Kanban Board endpoints
router.register(r'boards', BoardViewSet, basename='board')
router.register(r'columns', ColumnViewSet, basename='column')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'task-comments', TaskCommentViewSet, basename='task-comment')
# Register Progress Log endpoints
router.register(r'progress-logs', ProgressLogViewSet, basename='progress-log')
# Register Project Invitation endpoints
router.register(r'project-invitations', ProjectInvitationViewSet, basename='project-invitation')
router.register(r'funding', FundingViewSet, basename='funding')
router.register(r'', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
    path('user/projects/', UserProjectsView.as_view(), name='user-projects'),
    path('user/join-requests/', UserJoinRequestsView.as_view(), name='user-join-requests'),
    path('user/invitations/', UserInvitationsView.as_view(), name='user-invitations'),
    path('user/workspaces/', UserWorkspacesView.as_view(), name='user-workspaces'),
    path('user/progress-logs/', UserProgressLogsView.as_view(), name='user-progress-logs'),
    path('workspace/<slug:slug>/', WorkspaceDetailView.as_view(), name='workspace-detail'),
    path('workspace/<slug:workspace_slug>/resources/', WorkspaceResourcesView.as_view(), name='workspace-resources'),
    # Kanban Board routes
    path('workspace/<slug:workspace_slug>/board/', WorkspaceBoardView.as_view(), name='workspace-board'),
    # Progress Log routes
    path('workspace/<slug:workspace_slug>/progress-logs/', WorkspaceProgressLogsView.as_view(), name='workspace-progress-logs'),
    path('workspace/<slug:workspace_slug>/current-week-log/', CurrentWeekProgressLogView.as_view(), name='current-week-log'),
    path('funding/<int:funding_id>/close/', close_funding_request, name='close-funding'),
    path('funding/<int:funding_id>/delete/', delete_funding_request, name='delete-funding'),
] 