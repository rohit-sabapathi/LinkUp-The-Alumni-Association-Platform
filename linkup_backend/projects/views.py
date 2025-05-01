from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Project, Workspace, ProjectMember, JoinRequest
from .serializers import (
    ProjectListSerializer, 
    ProjectDetailSerializer, 
    ProjectCreateSerializer,
    WorkspaceSerializer,
    ProjectMemberSerializer,
    JoinRequestSerializer,
    JoinRequestStatusUpdateSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for project management
    """
    queryset = Project.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'short_description', 'detailed_description', 'project_type', 'skills']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ProjectCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return ProjectDetailSerializer
        return ProjectListSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsProjectAdmin()]
        elif self.action in ['create', 'join_request']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter based on query parameters
        project_type = self.request.query_params.get('project_type')
        if project_type:
            queryset = queryset.filter(project_type=project_type)
            
        skills = self.request.query_params.get('skills')
        if skills:
            skill_list = skills.split(',')
            for skill in skill_list:
                queryset = queryset.filter(skills__contains=[skill.strip()])
        
        # Filter for user's projects if requested
        user_projects = self.request.query_params.get('user_projects')
        if user_projects == 'true':
            queryset = queryset.filter(
                Q(creator=self.request.user) | 
                Q(members__user=self.request.user)
            ).distinct()
        
        # Filter for open collaborations if requested
        open_only = self.request.query_params.get('open_only')
        if open_only == 'true':
            queryset = queryset.filter(open_for_collaboration=True)
            
        return queryset
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def join_request(self, request, pk=None):
        """
        Submit a request to join a project
        """
        project = self.get_object()
        user = request.user
        
        # Check if user is already a member
        if ProjectMember.objects.filter(project=project, user=user).exists():
            return Response(
                {"detail": "You are already a member of this project"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if project is open for collaboration
        if not project.open_for_collaboration:
            return Response(
                {"detail": "This project is not open for collaboration"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if there's an existing pending request
        existing_request = JoinRequest.objects.filter(
            project=project, 
            user=user,
            status='pending'
        ).first()
        
        if existing_request:
            return Response(
                {"detail": "You already have a pending request for this project"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the join request
        message = request.data.get('message', '')
        join_request = JoinRequest.objects.create(
            project=project,
            user=user,
            message=message
        )
        
        serializer = JoinRequestSerializer(join_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def join_requests(self, request, pk=None):
        """
        Get all join requests for a project (admin only)
        """
        project = self.get_object()
        
        # Check if user is an admin of the project
        if not ProjectMember.objects.filter(project=project, user=request.user, role='admin').exists():
            return Response(
                {"detail": "You don't have permission to view join requests for this project"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        join_requests = JoinRequest.objects.filter(project=project)
        status_filter = request.query_params.get('status')
        if status_filter:
            join_requests = join_requests.filter(status=status_filter)
            
        serializer = JoinRequestSerializer(join_requests, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def workspace(self, request, pk=None):
        """
        Get the workspace associated with a project
        """
        project = self.get_object()
        
        try:
            workspace = project.workspace
            serializer = WorkspaceSerializer(workspace)
            return Response(serializer.data)
        except Workspace.DoesNotExist:
            return Response(
                {"detail": "No workspace found for this project"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """
        Get all members of a project
        """
        project = self.get_object()
        members = ProjectMember.objects.filter(project=project)
        serializer = ProjectMemberSerializer(members, many=True)
        return Response(serializer.data)


class JoinRequestViewSet(viewsets.GenericViewSet):
    """
    ViewSet for managing join requests
    """
    queryset = JoinRequest.objects.all()
    serializer_class = JoinRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Update the status of a join request (accept/reject)
        """
        join_request = self.get_object()
        project = join_request.project
        
        # Check if user is an admin of the project
        if not ProjectMember.objects.filter(project=project, user=request.user, role='admin').exists():
            return Response(
                {"detail": "You don't have permission to update this join request"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = JoinRequestStatusUpdateSerializer(
            join_request, 
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            JoinRequestSerializer(join_request).data
        )

    def get_queryset(self):
        # Filter requests based on user's admin projects
        admin_projects = Project.objects.filter(
            members__user=self.request.user,
            members__role='admin'
        )
        
        # Show requests for projects where the user is an admin
        return JoinRequest.objects.filter(project__in=admin_projects)


class WorkspaceDetailView(generics.RetrieveAPIView):
    """
    View for retrieving workspace details by slug
    """
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def retrieve(self, request, *args, **kwargs):
        workspace = self.get_object()
        project = workspace.project
        
        # Check if user is a member of the project
        if not ProjectMember.objects.filter(project=project, user=request.user).exists():
            return Response(
                {"detail": "You don't have permission to access this workspace"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(workspace)
        return Response(serializer.data)


class IsProjectAdmin(permissions.BasePermission):
    """
    Custom permission to only allow project admins to edit/delete
    """
    def has_object_permission(self, request, view, obj):
        # Check if the user is an admin for this project
        return ProjectMember.objects.filter(
            project=obj, 
            user=request.user,
            role='admin'
        ).exists()


class UserProjectsView(generics.ListAPIView):
    """
    View for listing user's projects (both created and participating)
    """
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get projects where user is either creator or member
        return Project.objects.filter(
            Q(creator=user) | Q(members__user=user)
        ).distinct()


class UserJoinRequestsView(generics.ListAPIView):
    """
    View for listing user's join requests
    """
    serializer_class = JoinRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('status')
        
        queryset = JoinRequest.objects.filter(user=user)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        return queryset 