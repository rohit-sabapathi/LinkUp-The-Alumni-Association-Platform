from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import serializers
from datetime import datetime

from .models import (
    Project, Workspace, ProjectMember, JoinRequest, 
    ResourceCategory, Resource, Board, Column, 
    Task, TaskAssignment, TaskComment, ProgressLog, ProgressLogTask
)
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
    ResourceCreateSerializer,
    # Kanban Board Serializers
    BoardSerializer,
    BoardDetailSerializer,
    ColumnSerializer,
    ColumnDetailSerializer,
    TaskSerializer,
    TaskDetailSerializer,
    TaskCreateSerializer,
    TaskMoveSerializer,
    TaskAssignmentSerializer,
    TaskAssignmentCreateSerializer,
    TaskCommentSerializer,
    TaskCommentCreateSerializer,
    ProgressLogSerializer,
    ProgressLogCreateSerializer,
    ProgressLogListSerializer,
    ProgressLogTaskSerializer
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
        print("Creating new project...")
        # Create the project with the user as creator
        project = serializer.save(creator=self.request.user)
        
        # Automatically add creator as admin member
        try:
            ProjectMember.objects.create(
                project=project,
                user=self.request.user,
                role='admin'
            )
            print(f"Added user {self.request.user.username} as admin to project {project.id}")
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
        # Special handling for task assignment action
        if view.__class__.__name__ == 'TaskViewSet' and getattr(view, 'action', None) == 'assign':
            # Skip the generic permission check for assign action
            # We'll handle permissions in the method itself
            return True
            
        # For create methods, check if user is member of the workspace
        if request.method == 'POST':
            try:
                workspace_id = request.data.get('workspace')
                category_id = request.data.get('category')
                column_id = request.data.get('column')
                board_id = request.data.get('board')
                
                # Skip any undefined values or invalid UUIDs
                if workspace_id == 'undefined':
                    workspace_id = None
                if category_id == 'undefined':
                    category_id = None
                if column_id == 'undefined':
                    column_id = None
                if board_id == 'undefined':
                    board_id = None
                
                # Try to get workspace information from whatever field is available
                if workspace_id:
                    workspace = Workspace.objects.get(id=workspace_id)
                elif category_id:
                    category = ResourceCategory.objects.get(id=category_id)
                    workspace = category.workspace
                elif column_id:
                    column = Column.objects.get(id=column_id)
                    workspace = column.board.workspace
                elif board_id:
                    board = Board.objects.get(id=board_id)
                    workspace = board.workspace
                else:
                    # For task creation always allow if we can't determine workspace
                    # Column ID should be required for tasks, and we'll check that later
                    if 'column' in request.data and view.__class__.__name__ == 'TaskViewSet':
                        column_id = request.data.get('column')
                        column = Column.objects.get(id=column_id)
                        workspace = column.board.workspace
                    else:
                        return False
                    
                return ProjectMember.objects.filter(
                    project=workspace.project,
                    user=request.user
                ).exists() or workspace.project.creator == request.user
            except (Workspace.DoesNotExist, ResourceCategory.DoesNotExist, Column.DoesNotExist, Board.DoesNotExist, ValueError, TypeError):
                # If there's any error in finding the workspace, let the view handle it
                if 'column' in request.data and view.__class__.__name__ == 'TaskViewSet':
                    try:
                        column_id = request.data.get('column')
                        column = Column.objects.get(id=column_id)
                        workspace = column.board.workspace
                        return ProjectMember.objects.filter(
                            project=workspace.project, 
                            user=request.user
                        ).exists() or workspace.project.creator == request.user
                    except (Column.DoesNotExist, ValueError, TypeError):
                        return False
                return False
                
        return True
    
    def has_object_permission(self, request, view, obj):
        # Get the workspace - either directly or through related objects
        try:
            if isinstance(obj, (Workspace, ResourceCategory)):
                workspace = getattr(obj, 'workspace', obj)
            elif isinstance(obj, Resource):
                workspace = obj.category.workspace
            elif isinstance(obj, Board):
                workspace = obj.workspace
            elif isinstance(obj, Column):
                workspace = obj.board.workspace
            elif isinstance(obj, Task):
                workspace = obj.column.board.workspace
            elif isinstance(obj, TaskAssignment):
                workspace = obj.task.column.board.workspace
            elif isinstance(obj, TaskComment):
                workspace = obj.task.column.board.workspace
            elif isinstance(obj, ProgressLog):
                workspace = obj.workspace
            elif isinstance(obj, ProgressLogTask):
                workspace = obj.progress_log.workspace
            else:
                return False
                
            # Check if user is a member of the workspace's project
            return ProjectMember.objects.filter(
                project=workspace.project,
                user=request.user
            ).exists() or workspace.project.creator == request.user
        except (AttributeError, Workspace.DoesNotExist):
            return False

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

# Kanban Board Views
class BoardViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Kanban boards
    """
    queryset = Board.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceMember]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BoardDetailSerializer
        return BoardSerializer
    
    def get_queryset(self):
        return self.queryset.all()
    
    def perform_create(self, serializer):
        # Ensure the workspace exists and user has access
        workspace_id = self.request.data.get('workspace')
        workspace = get_object_or_404(Workspace, id=workspace_id)
        
        # Check if a board already exists for this workspace
        if Board.objects.filter(workspace=workspace).exists():
            raise serializers.ValidationError(
                {"detail": "A board already exists for this workspace"}
            )
        
        # Create the board with default title if not provided
        title = self.request.data.get('title', f"Board for {workspace.title}")
        serializer.save(title=title)
    
    @action(detail=False, methods=['get'])
    def for_workspace(self, request):
        """
        Get the board for a specific workspace
        """
        workspace_id = request.query_params.get('workspace_id')
        if not workspace_id:
            return Response(
                {"detail": "workspace_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        workspace = get_object_or_404(Workspace, id=workspace_id)
        
        # Check if user has access to the workspace
        project = workspace.project
        if not (project.creator == request.user or 
                ProjectMember.objects.filter(project=project, user=request.user).exists()):
            return Response(
                {"detail": "You don't have access to this workspace"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Try to get the board, create if it doesn't exist
        board, created = Board.objects.get_or_create(
            workspace=workspace,
            defaults={
                'title': f"Board for {workspace.title}"
            }
        )
        
        # If board was just created, create default columns
        if created:
            default_columns = [
                {"title": "To Do", "order": 0},
                {"title": "In Progress", "order": 1},
                {"title": "Review", "order": 2},
                {"title": "Completed", "order": 3}
            ]
            
            for col in default_columns:
                Column.objects.create(board=board, **col)
        
        serializer = BoardDetailSerializer(board, context={'request': request})
        return Response(serializer.data)

class ColumnViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing columns in Kanban boards
    """
    queryset = Column.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceMember]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ColumnDetailSerializer
        return ColumnSerializer
    
    def get_queryset(self):
        board_id = self.request.query_params.get('board')
        if board_id:
            return self.queryset.filter(board_id=board_id)
        return self.queryset.all()
    
    def perform_create(self, serializer):
        # Check if the board exists and the user has access
        board_id = self.request.data.get('board')
        board = get_object_or_404(Board, id=board_id)
        
        # Get the max order and add 1 for new column
        max_order = Column.objects.filter(board=board).order_by('-order').first()
        new_order = (max_order.order + 1) if max_order else 0
        
        serializer.save(order=new_order)
    
    @action(detail=True, methods=['patch'])
    def reorder(self, request, pk=None):
        """
        Update the order of a column
        """
        column = self.get_object()
        new_order = request.data.get('order')
        
        if new_order is None:
            return Response(
                {"detail": "order parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update all affected columns
        columns = Column.objects.filter(board=column.board).order_by('order')
        
        # Save current order
        old_order = column.order
        
        if new_order < old_order:
            # Moving up: increment order of columns in between
            for col in columns:
                if new_order <= col.order < old_order:
                    col.order += 1
                    col.save()
        else:
            # Moving down: decrement order of columns in between
            for col in columns:
                if old_order < col.order <= new_order:
                    col.order -= 1
                    col.save()
        
        # Update this column's order
        column.order = new_order
        column.save()
        
        return Response(ColumnSerializer(column).data)

class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tasks in Kanban columns
    """
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceMember]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action == 'retrieve':
            return TaskDetailSerializer
        return TaskSerializer
    
    def get_queryset(self):
        column_id = self.request.query_params.get('column')
        if column_id:
            return self.queryset.filter(column_id=column_id)
        
        board_id = self.request.query_params.get('board')
        if board_id:
            columns = Column.objects.filter(board_id=board_id)
            return self.queryset.filter(column__in=columns)
        
        return self.queryset.all()
    
    def perform_create(self, serializer):
        column_id = self.request.data.get('column')
        column = get_object_or_404(Column, id=column_id)
        
        # Get max order in the column and add 1
        max_order = Task.objects.filter(column=column).order_by('-order').first()
        new_order = (max_order.order + 1) if max_order else 0
        
        serializer.save(created_by=self.request.user, order=new_order)
    
    @action(detail=True, methods=['patch'])
    def move(self, request, pk=None):
        """
        Move a task to a different column or change its order
        """
        task = self.get_object()
        
        # Validate request data
        serializer = TaskMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        target_column = serializer.validated_data['target_column']
        new_order = serializer.validated_data.get('order')
        
        # If moving to a different column
        if task.column.id != target_column.id:
            # Get max order in target column if not specified
            if new_order is None:
                max_order = Task.objects.filter(column=target_column).order_by('-order').first()
                new_order = (max_order.order + 1) if max_order else 0
            
            # Reorder tasks in old column
            for t in Task.objects.filter(column=task.column, order__gt=task.order):
                t.order -= 1
                t.save()
            
            # Reorder tasks in new column
            for t in Task.objects.filter(column=target_column, order__gte=new_order):
                t.order += 1
                t.save()
            
            # Update task
            task.column = target_column
            task.order = new_order
            task.save()
        
        # If just changing order in the same column
        elif new_order is not None and task.order != new_order:
            old_order = task.order
            
            if new_order < old_order:
                # Moving up: increment order of tasks in between
                for t in Task.objects.filter(column=task.column, order__gte=new_order, order__lt=old_order):
                    t.order += 1
                    t.save()
            else:
                # Moving down: decrement order of tasks in between
                for t in Task.objects.filter(column=task.column, order__gt=old_order, order__lte=new_order):
                    t.order -= 1
                    t.save()
            
            # Update task order
            task.order = new_order
            task.save()
        
        return Response(TaskSerializer(task, context={'request': request}).data)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign a task to a user
        """
        task = self.get_object()
        print(f"Task assign request for task: {pk}, user: {request.user.id}")
        
        # Include task in the request data
        request_data = request.data.copy()
        request_data['task'] = str(task.id)
        
        try:
            serializer = TaskAssignmentCreateSerializer(
                data=request_data, 
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            
            # Check if assignment already exists
            assignee = serializer.validated_data['assignee_id']
            if TaskAssignment.objects.filter(task=task, assignee=assignee).exists():
                return Response(
                    {"detail": "This user is already assigned to this task"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify user permissions by getting project and checking membership
            try:
                project = task.column.board.workspace.project
                print(f"Project for task: {project.id} ({project.title})")
                print(f"Current user: {request.user.id} ({request.user.username})")
                print(f"Project creator: {project.creator.id} ({project.creator.username})")
                
                user_is_member = ProjectMember.objects.filter(
                    project=project,
                    user=request.user
                ).exists()
                
                user_is_creator = (project.creator.id == request.user.id)
                
                print(f"User is member: {user_is_member}, User is creator: {user_is_creator}")
                
                if not (user_is_member or user_is_creator):
                    print("PERMISSION DENIED: User is neither member nor creator")
                    return Response(
                        {"detail": "You do not have permission to assign tasks in this project"},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Create the assignment
                print(f"Creating assignment: Task {task.id}, Assignee: {assignee.id}")
                assignment = serializer.save()
                return Response(
                    TaskAssignmentSerializer(assignment).data, 
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                print(f"Error in permission check: {str(e)}")
                return Response(
                    {"detail": f"Error checking permissions: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except serializers.ValidationError as e:
            print(f"Validation error in task assignment: {str(e)}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Unexpected error in task assignment: {str(e)}")
            return Response(
                {"detail": f"Error assigning task: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'])
    def unassign(self, request, pk=None):
        """
        Remove a user assignment from a task
        """
        task = self.get_object()
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response(
                {"detail": "user_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find and delete the assignment
        try:
            assignment = TaskAssignment.objects.get(task=task, assignee__id=user_id)
            assignment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TaskAssignment.DoesNotExist:
            return Response(
                {"detail": "Assignment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        """
        Add a comment to a task
        """
        task = self.get_object()
        
        # Include task in the request data
        request_data = request.data.copy()
        request_data['task'] = str(task.id)
        
        serializer = TaskCommentCreateSerializer(
            data=request_data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        comment = serializer.save()
        return Response(
            TaskCommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """
        Get all comments for a task
        """
        task = self.get_object()
        comments = TaskComment.objects.filter(task=task).order_by('created_at')
        serializer = TaskCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)
        
class TaskCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing task comments
    """
    queryset = TaskComment.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceMember]
    serializer_class = TaskCommentSerializer
    http_method_names = ['get', 'post', 'patch', 'delete']
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task')
        if task_id:
            return self.queryset.filter(task_id=task_id)
        return self.queryset.all()
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    def perform_update(self, serializer):
        # Only allow the author to update their comment
        comment = self.get_object()
        if comment.author != self.request.user:
            raise permissions.PermissionDenied("You can only edit your own comments")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only allow the author or project admin to delete comments
        if instance.author != self.request.user:
            # Check if user is project admin
            project = instance.task.column.board.workspace.project
            is_admin = ProjectMember.objects.filter(
                project=project, 
                user=self.request.user, 
                role='admin'
            ).exists()
            
            if not is_admin and project.creator != self.request.user:
                raise permissions.PermissionDenied(
                    "You can only delete your own comments unless you're a project admin"
                )
        
        instance.delete()

class WorkspaceBoardView(generics.RetrieveAPIView):
    """
    View for retrieving a board for a workspace by its slug
    """
    serializer_class = BoardDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        workspace_slug = self.kwargs.get('workspace_slug')
        workspace = get_object_or_404(Workspace, slug=workspace_slug)
        
        # Check if user has access to the workspace
        project = workspace.project
        if not (project.creator == self.request.user or 
                ProjectMember.objects.filter(project=project, user=self.request.user).exists()):
            raise permissions.PermissionDenied("You don't have access to this workspace")
        
        # Get or create the board
        board, created = Board.objects.get_or_create(
            workspace=workspace,
            defaults={
                'title': f"Board for {workspace.title}"
            }
        )
        
        # If board was just created, create default columns
        if created:
            default_columns = [
                {"title": "To Do", "order": 0},
                {"title": "In Progress", "order": 1},
                {"title": "Review", "order": 2},
                {"title": "Completed", "order": 3}
            ]
            
            for col in default_columns:
                Column.objects.create(board=board, **col)
        
        return board 

# Add these new views after the TaskComment related views

class ProgressLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing progress logs
    """
    queryset = ProgressLog.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'update' or self.action == 'partial_update':
            return ProgressLogCreateSerializer
        elif self.action == 'list':
            return ProgressLogListSerializer
        return ProgressLogSerializer
    
    def get_queryset(self):
        # First, filter logs from workspaces the user has access to
        user_projects = Project.objects.filter(
            Q(creator=self.request.user) | 
            Q(members__user=self.request.user)
        ).distinct()
        
        user_workspaces = Workspace.objects.filter(project__in=user_projects)
        
        # Start with logs from workspaces the user has access to
        queryset = self.queryset.filter(workspace__in=user_workspaces)
        
        # Apply additional filters
        workspace_id = self.request.query_params.get('workspace')
        user_id = self.request.query_params.get('user')
        week = self.request.query_params.get('week')
        
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
            
        if user_id:
            # If requesting other users' logs, ensure the user has access to those logs
            if str(user_id) != str(self.request.user.id):
                # Only include logs for other users if they're in the same workspace
                queryset = queryset.filter(user_id=user_id)
            else:
                # For the current user, show all their logs in their workspaces
                queryset = queryset.filter(user_id=self.request.user.id)
        
        if week:
            queryset = queryset.filter(week_number=week)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Get the workspace and check if user has access
        workspace = instance.workspace
        project = workspace.project
        
        # Check if user is either the creator of the project, a member of the project,
        # or the author of the progress log
        if not (
            project.creator == request.user or 
            ProjectMember.objects.filter(project=project, user=request.user).exists() or
            instance.user == request.user
        ):
            return Response(
                {"detail": "You do not have permission to view this progress log."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class WorkspaceProgressLogsView(generics.ListAPIView):
    """
    View for listing progress logs for a workspace by its slug
    """
    serializer_class = ProgressLogListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        workspace_slug = self.kwargs.get('workspace_slug')
        workspace = get_object_or_404(Workspace, slug=workspace_slug)
        
        # Check if user has access to the workspace
        project = workspace.project
        if not (project.creator == self.request.user or 
                ProjectMember.objects.filter(project=project, user=self.request.user).exists()):
            raise permissions.PermissionDenied("You don't have access to this workspace")
        
        # Get week parameter if provided
        week = self.request.query_params.get('week')
        user_id = self.request.query_params.get('user')
        
        queryset = ProgressLog.objects.filter(workspace=workspace)
        
        if week:
            queryset = queryset.filter(week_number=week)
            
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset

class UserProgressLogsView(generics.ListAPIView):
    """
    View for listing a user's progress logs across all workspaces
    """
    serializer_class = ProgressLogListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ProgressLog.objects.filter(user=self.request.user)

class CurrentWeekProgressLogView(generics.RetrieveAPIView):
    """
    View for getting the progress log for the current week for a workspace
    If it doesn't exist, returns 404
    """
    serializer_class = ProgressLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        workspace_slug = self.kwargs.get('workspace_slug')
        workspace = get_object_or_404(Workspace, slug=workspace_slug)
        
        # Check if user has access to the workspace
        project = workspace.project
        if not (project.creator == self.request.user or 
                ProjectMember.objects.filter(project=project, user=self.request.user).exists()):
            raise permissions.PermissionDenied("You don't have access to this workspace")
        
        # Calculate the current week number
        today = datetime.now().date()
        current_week = today.isocalendar()[1]  # ISO week number
        
        # Try to find progress log for current user and current week
        progress_log = get_object_or_404(
            ProgressLog, 
            workspace=workspace,
            user=self.request.user,
            week_number=current_week
        )
        
        return progress_log 