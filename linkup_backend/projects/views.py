from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import serializers

from .models import Project, Workspace, ProjectMember, JoinRequest
from .serializers import (
    ProjectListSerializer, 
    ProjectDetailSerializer, 
    ProjectCreateSerializer,
    WorkspaceSerializer,
    ProjectMemberSerializer,
    JoinRequestSerializer,
    JoinRequestCreateSerializer,
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
        Submit a request to join a project with detailed information
        """
        project = self.get_object()
        user = request.user
        
        print(f"[JOIN REQUEST] User {user.id} ({user.username}) is requesting to join project {project.id} ({project.title})")
        print(f"[JOIN REQUEST] Project creator: {project.creator.id} ({project.creator.username})")
        print(f"[JOIN REQUEST] Request data: {request.data}")
        
        # Use the create serializer with the request context
        serializer = JoinRequestCreateSerializer(
            data={**request.data, 'project': project.id},
            context={'request': request}
        )
        
        try:
            serializer.is_valid(raise_exception=True)
            join_request = serializer.save()
            
            print(f"[JOIN REQUEST] Successfully created join request {join_request.id}")
            
            # Return the full serialized join request
            return Response(
                JoinRequestSerializer(join_request).data,
                status=status.HTTP_201_CREATED
            )
        except serializers.ValidationError as e:
            print(f"[JOIN REQUEST] Validation error: {str(e)}")
            raise
        except Exception as e:
            print(f"[JOIN REQUEST] Unexpected error: {str(e)}")
            return Response(
                {"detail": f"Error creating join request: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def join_requests(self, request, pk=None):
        """
        Get all join requests for a project
        """
        # Important: Log the request parameters
        print(f"🔍 JOIN REQUESTS ACTION - Project ID: {pk}, User ID: {request.user.id}")
        
        try:
            project = self.get_object()
            user = request.user
            
            print(f"🔍 Project found: {project.id} (title: {project.title})")
            print(f"👤 Request user: {user.id} (username: {user.username})")
            print(f"👤 Project creator: {project.creator.id} (username: {project.creator.username})")
            
            # Check if user is the creator
            is_creator = (project.creator.id == user.id)
            
            # Check if user is an admin
            is_admin = ProjectMember.objects.filter(
                project=project, 
                user=user, 
                role='admin'
            ).exists()
            
            print(f"🔑 Is creator: {is_creator}, Is admin: {is_admin}")
            
            # Allow both creator and admin to view join requests
            if not (is_creator or is_admin):
                print("❌ Permission denied: User is neither creator nor admin")
                return Response(
                    {"detail": "You don't have permission to view join requests for this project"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Directly query join requests by project ID to avoid any potential cache issues
            join_requests = JoinRequest.objects.filter(project_id=project.id)
            
            if join_requests.exists():
                print(f"✅ Found {join_requests.count()} join requests")
                for jr in join_requests:
                    print(f"  - Request {jr.id}: from {jr.user.username}, status: {jr.status}")
            else:
                print("ℹ️ No join requests found for this project")
            
            serializer = JoinRequestSerializer(join_requests, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"❌ Error in join_requests action: {str(e)}")
            return Response(
                {"detail": f"Error retrieving join requests: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
        
        # Check if user is the creator or an admin of the project
        if not (project.creator == request.user or 
                ProjectMember.objects.filter(project=project, user=request.user, role='admin').exists()):
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
        # Show requests for projects where the user is a creator or admin
        user = self.request.user
        print(f"🔍 JoinRequestViewSet.get_queryset - User: {user.id} ({user.username})")
        
        try:
            # Find projects where user is creator
            user_created_projects = Project.objects.filter(creator=user)
            print(f"👑 Projects created by user: {user_created_projects.count()}")
            
            # Find projects where user is admin
            admin_projects = Project.objects.filter(
                members__user=user,
                members__role='admin'
            )
            print(f"🔑 Projects where user is admin: {admin_projects.count()}")
            
            # Use Q objects to combine filters with OR
            all_requests = JoinRequest.objects.filter(
                Q(project__in=user_created_projects) | 
                Q(project__in=admin_projects)
            ).select_related('project', 'user').distinct()
            
            print(f"📨 Total join requests: {all_requests.count()}")
            for req in all_requests:
                print(f"  - Request {req.id}: Project '{req.project.title}', From '{req.user.username}', Status: {req.status}")
            
            return all_requests
        except Exception as e:
            print(f"❌ Error in JoinRequestViewSet.get_queryset: {str(e)}")
            return JoinRequest.objects.none()


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
        
        queryset = JoinRequest.objects.filter(user=user).select_related('project')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        return queryset
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in UserJoinRequestsView: {str(e)}")
            return Response(
                {"detail": "Failed to fetch join requests"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 