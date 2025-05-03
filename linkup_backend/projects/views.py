from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import serializers

from .models import Project, Workspace, ProjectMember, JoinRequest, ResourceCategory, Resource
from .serializers import (
    ProjectListSerializer, 
    ProjectDetailSerializer, 
    ProjectCreateSerializer,
    WorkspaceSerializer,
    ProjectMemberSerializer,
    JoinRequestSerializer,
    JoinRequestCreateSerializer,
    JoinRequestStatusUpdateSerializer,
    ResourceCategorySerializer,
    ResourceCategoryDetailSerializer,
    ResourceCategoryCreateSerializer,
    ResourceSerializer,
    ResourceCreateSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects
    """
    queryset = Project.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'short_description', 'detailed_description', 'project_type', 'skills']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ProjectCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return ProjectDetailSerializer
        return ProjectListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Add filters based on query parameters
        project_type = self.request.query_params.get('project_type', None)
        skills = self.request.query_params.get('skills', None)
        user_projects = self.request.query_params.get('user_projects', None)
        open_only = self.request.query_params.get('open_only', None)
        search = self.request.query_params.get('search', None)
        
        if project_type:
            queryset = queryset.filter(project_type=project_type)
        
        if skills:
            skill_list = skills.split(',')
            queryset = queryset.filter(skills__overlap=skill_list)
        
        if user_projects:
            queryset = queryset.filter(creator=self.request.user)
        
        if open_only:
            queryset = queryset.filter(open_for_collaboration=True)
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(detailed_description__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
        print("Creating new project...")
        # Pass user directly instead of as a parameter to avoid double creator issue
        user = self.request.user
        project = serializer.save()
        
        # Automatically add creator as admin member
        try:
            ProjectMember.objects.create(
                project=project,
                user=user,
                role='admin'
            )
            print(f"Added user {user.username} as admin to project {project.id}")
        except Exception as e:
            print(f"Error adding creator as admin: {str(e)}")
        
        print(f"Project created: {project.id}")
        
        return project
    
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
        print(f"Fetching workspace for project {project.id}")
        
        try:
            workspace = project.workspace
            print(f"Found workspace: {workspace.slug}")
            serializer = WorkspaceSerializer(workspace)
            return Response(serializer.data)
        except Workspace.DoesNotExist:
            print(f"No workspace found for project {project.id}")
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


class UserWorkspacesView(generics.ListAPIView):
    """
    View for listing workspaces for projects where the user is either a creator or member
    """
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Get projects where the user is a member
        member_projects = ProjectMember.objects.filter(user=user).values_list('project', flat=True)
        
        # Get workspaces for those projects
        return Workspace.objects.filter(
            Q(project__creator=user) | Q(project__id__in=member_projects)
        )
        
# New views for resource sharing feature

class IsWorkspaceMember(permissions.BasePermission):
    """
    Permission to check if user is a member of the workspace's project
    """
    def has_permission(self, request, view):
        # For create methods, check if user is member of the workspace
        if request.method == 'POST':
            workspace_id = request.data.get('workspace')
            category_id = request.data.get('category')
            
            try:
                if workspace_id:
                    workspace = Workspace.objects.get(id=workspace_id)
                elif category_id:
                    category = ResourceCategory.objects.get(id=category_id)
                    workspace = category.workspace
                else:
                    return False
                    
                return ProjectMember.objects.filter(
                    project=workspace.project,
                    user=request.user
                ).exists() or workspace.project.creator == request.user
            except (Workspace.DoesNotExist, ResourceCategory.DoesNotExist):
                return False
                
        return True
    
    def has_object_permission(self, request, view, obj):
        # Get the workspace - either directly or through the category
        if isinstance(obj, ResourceCategory):
            workspace = obj.workspace
        elif isinstance(obj, Resource):
            workspace = obj.category.workspace
        else:
            return False
            
        # Check if user is a member of the workspace's project
        return ProjectMember.objects.filter(
            project=workspace.project,
            user=request.user
        ).exists() or workspace.project.creator == request.user

class ResourceCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for resource categories within workspaces
    """
    queryset = ResourceCategory.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceMember]
    filterset_fields = ['workspace']
    http_method_names = ['get', 'post', 'patch', 'delete']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ResourceCategoryCreateSerializer
        elif self.action == 'retrieve':
            return ResourceCategoryDetailSerializer
        return ResourceCategorySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by workspace if provided
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
            
        # Filter to only show categories from workspaces where user is a member
        user = self.request.user
        member_projects = ProjectMember.objects.filter(user=user).values_list('project', flat=True)
        
        return queryset.filter(
            Q(workspace__project__creator=user) | 
            Q(workspace__project__id__in=member_projects)
        )
    
    def perform_create(self, serializer):
        serializer.save()
        
    @action(detail=True, methods=['get'])
    def resources(self, request, pk=None):
        """
        Get all resources in a category
        """
        category = self.get_object()
        resources = category.resources.all()
        serializer = ResourceSerializer(
            resources, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)

class ResourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for resources (files) within categories
    """
    queryset = Resource.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceMember]
    filterset_fields = ['category']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ResourceCreateSerializer
        return ResourceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category if provided
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        # Filter to only show resources from categories/workspaces where user is a member
        user = self.request.user
        member_projects = ProjectMember.objects.filter(user=user).values_list('project', flat=True)
        
        return queryset.filter(
            Q(category__workspace__project__creator=user) | 
            Q(category__workspace__project__id__in=member_projects)
        )
    
    def perform_create(self, serializer):
        # Let the serializer handle setting uploaded_by
        serializer.save()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context

class WorkspaceResourcesView(generics.ListAPIView):
    """
    View for listing all resource categories in a workspace
    """
    serializer_class = ResourceCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceMember]
    
    def get_queryset(self):
        workspace_slug = self.kwargs.get('workspace_slug')
        workspace = get_object_or_404(Workspace, slug=workspace_slug)
        
        # Check permissions manually since we're not using the object permission on the workspace
        if not ProjectMember.objects.filter(project=workspace.project, user=self.request.user).exists() and \
           workspace.project.creator != self.request.user:
            return ResourceCategory.objects.none()
            
        return ResourceCategory.objects.filter(workspace=workspace) 