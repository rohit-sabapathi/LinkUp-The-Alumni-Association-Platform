from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Project, Workspace, ProjectMember, JoinRequest, 
    ResourceCategory, Resource, Board, Column, 
    Task, TaskAssignment, TaskComment
)

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'profile_picture']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']

class WorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ['id', 'title', 'description', 'slug', 'created_at', 'project']
        read_only_fields = ['id', 'slug', 'created_at']

class ProjectListSerializer(serializers.ModelSerializer):
    creator = UserMiniSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    workspace_slug = serializers.SerializerMethodField()
    workspace = WorkspaceSerializer(read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'short_description', 'project_type',
            'skills', 'open_for_collaboration', 'project_image',
            'created_at', 'creator', 'member_count', 'workspace_slug',
            'workspace'
        ]
        read_only_fields = ['id', 'created_at', 'creator', 'workspace']
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_workspace_slug(self, obj):
        try:
            workspace = obj.workspace
            if workspace:
                print(f"Found workspace for project {obj.id}: {workspace.slug}")
                return workspace.slug
            print(f"No workspace found for project {obj.id}")
            return None
        except Workspace.DoesNotExist:
            print(f"Workspace does not exist for project {obj.id}")
            return None

class ProjectDetailSerializer(serializers.ModelSerializer):
    creator = UserMiniSerializer(read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True, source='members.all')
    workspace = WorkspaceSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'short_description', 'detailed_description',
            'project_type', 'skills', 'max_team_members', 'open_for_collaboration',
            'github_link', 'project_image', 'created_at', 'updated_at',
            'creator', 'members', 'workspace', 'member_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'creator']
    
    def get_member_count(self, obj):
        return obj.members.count()

class ProjectCreateSerializer(serializers.ModelSerializer):
    creator = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'short_description', 'detailed_description',
            'project_type', 'skills', 'max_team_members', 'open_for_collaboration',
            'github_link', 'project_image', 'creator', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'creator']
    
    def create(self, validated_data):
        # Make sure we don't have creator in validated_data
        if 'creator' in validated_data:
            validated_data.pop('creator')
        
        # Get the user from context
        user = self.context['request'].user
        
        # Create project with user as creator
        project = Project(creator=user, **validated_data)
        project.save()
        
        # Create workspace for the project
        try:
            workspace = Workspace.objects.create(
                project=project,
                title=f"Workspace for {project.title}",
                description=project.short_description
            )
            print(f"Created workspace with slug: {workspace.slug}")
        except Exception as e:
            print(f"Error creating workspace: {str(e)}")
        
        return project

class JoinRequestSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = JoinRequest
        fields = ['id', 'project', 'project_title', 'user', 'message', 'skills', 'expertise', 'motivation', 'status', 'created_at']
        read_only_fields = ['id', 'user', 'status', 'created_at', 'project_title']

class JoinRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JoinRequest
        fields = ['project', 'message', 'skills', 'expertise', 'motivation']
        
    def create(self, validated_data):
        user = self.context['request'].user
        
        # Check if user is already a member
        if ProjectMember.objects.filter(project=validated_data['project'], user=user).exists():
            raise serializers.ValidationError(
                {"detail": "You are already a member of this project"}
            )
        
        # Check if project is open for collaboration
        if not validated_data['project'].open_for_collaboration:
            raise serializers.ValidationError(
                {"detail": "This project is not open for collaboration"}
            )
        
        # Check if there's an existing pending request
        existing_request = JoinRequest.objects.filter(
            project=validated_data['project'], 
            user=user,
            status='pending'
        ).first()
        
        if existing_request:
            raise serializers.ValidationError(
                {"detail": "You already have a pending request for this project"}
            )
        
        # Create the join request
        return JoinRequest.objects.create(user=user, **validated_data)

class JoinRequestStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JoinRequest
        fields = ['status']
        
    def validate_status(self, value):
        valid_transitions = {
            'pending': ['accepted', 'rejected'],
            'accepted': ['rejected'],
            'rejected': ['accepted']
        }
        
        current_status = self.instance.status
        if value not in valid_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Cannot transition from '{current_status}' to '{value}'"
            )
        return value
        
    def update(self, instance, validated_data):
        new_status = validated_data.get('status')
        old_status = instance.status
        
        # Update the join request status
        instance.status = new_status
        instance.save()
        
        # If status changed to accepted, create project membership
        if old_status != 'accepted' and new_status == 'accepted':
            # Check if there's space on the team
            project = instance.project
            current_members = project.members.count()
            
            if current_members >= project.max_team_members:
                raise serializers.ValidationError(
                    "Cannot accept request: maximum number of team members reached"
                )
            
            # Create the membership
            ProjectMember.objects.create(
                project=project,
                user=instance.user,
                role='member'
            )
            
        return instance

# New serializers for resource sharing feature

class ResourceSerializer(serializers.ModelSerializer):
    uploaded_by = UserMiniSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'file', 'file_url',
            'file_type', 'file_size', 'created_at', 'updated_at',
            'uploaded_by', 'category'
        ]
        read_only_fields = ['id', 'file_url', 'file_type', 'file_size', 
                           'created_at', 'updated_at', 'uploaded_by']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url') and request is not None:
            return request.build_absolute_uri(obj.file.url)
        return None
    
class ResourceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['title', 'description', 'file', 'category']
    
    def create(self, validated_data):
        user = self.context['request'].user
        
        # Create the resource with the current user as uploader
        # Make sure uploaded_by is not in validated_data to avoid conflicts
        if 'uploaded_by' in validated_data:
            validated_data.pop('uploaded_by')
            
        resource = Resource.objects.create(uploaded_by=user, **validated_data)
        return resource

class ResourceCategorySerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    resources_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ResourceCategory
        fields = [
            'id', 'workspace', 'name', 'description', 
            'created_at', 'created_by', 'resources_count'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'resources_count']
    
    def get_resources_count(self, obj):
        return obj.resources.count()

class ResourceCategoryDetailSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    resources = ResourceSerializer(many=True, read_only=True, source='resources.all')
    
    class Meta:
        model = ResourceCategory
        fields = [
            'id', 'workspace', 'name', 'description', 
            'created_at', 'created_by', 'resources'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']

class ResourceCategoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceCategory
        fields = ['workspace', 'name', 'description']
    
    def create(self, validated_data):
        user = self.context['request'].user
        
        # Create the category with the current user as creator
        category = ResourceCategory(created_by=user, **validated_data)
        category.save()
        
        return category

# Kanban Board Serializers
class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    attachment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskComment
        fields = [
            'id', 'task', 'author', 'content', 'attachment', 
            'attachment_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'author']
    
    def get_attachment_url(self, obj):
        request = self.context.get('request')
        if obj.attachment and hasattr(obj.attachment, 'url') and request is not None:
            return request.build_absolute_uri(obj.attachment.url)
        return None

class TaskAssignmentSerializer(serializers.ModelSerializer):
    assignee = UserMiniSerializer(read_only=True)
    assigned_by = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = TaskAssignment
        fields = ['id', 'task', 'assignee', 'assigned_at', 'assigned_by']
        read_only_fields = ['id', 'assigned_at', 'assigned_by']

class TaskSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    assignments = TaskAssignmentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'column', 'title', 'description', 'priority',
            'due_date', 'order', 'is_blocked', 'blocked_reason',
            'estimated_hours', 'attachment', 'attachment_name',
            'attachment_url', 'created_at', 'updated_at',
            'created_by', 'assignments', 'comments_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_attachment_url(self, obj):
        request = self.context.get('request')
        if obj.attachment and hasattr(obj.attachment, 'url') and request is not None:
            return request.build_absolute_uri(obj.attachment.url)
        return None

class TaskDetailSerializer(TaskSerializer):
    comments = TaskCommentSerializer(many=True, read_only=True, source='comments.all')
    
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ['comments']

class ColumnSerializer(serializers.ModelSerializer):
    tasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Column
        fields = [
            'id', 'board', 'title', 'description', 
            'order', 'created_at', 'updated_at', 'tasks_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()

class ColumnDetailSerializer(ColumnSerializer):
    tasks = TaskSerializer(many=True, read_only=True, source='tasks.all')
    
    class Meta(ColumnSerializer.Meta):
        fields = ColumnSerializer.Meta.fields + ['tasks']

class BoardSerializer(serializers.ModelSerializer):
    columns_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Board
        fields = [
            'id', 'workspace', 'title', 'description',
            'created_at', 'updated_at', 'columns_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_columns_count(self, obj):
        return obj.columns.count()

class BoardDetailSerializer(BoardSerializer):
    columns = ColumnSerializer(many=True, read_only=True, source='columns.all')
    
    class Meta(BoardSerializer.Meta):
        fields = BoardSerializer.Meta.fields + ['columns']

# Task Creation and Update Serializers
class TaskCreateSerializer(serializers.ModelSerializer):
    # Add board and workspace as write-only fields for permission checks
    board = serializers.UUIDField(required=False, write_only=True)
    workspace = serializers.UUIDField(required=False, write_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'column', 'title', 'description', 'priority',
            'due_date', 'order', 'is_blocked', 'blocked_reason',
            'estimated_hours', 'attachment', 'attachment_name',
            'board', 'workspace',  # Added for permission checks
            'created_at', 'updated_at'  # Include timestamps
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Remove the board and workspace fields since they're not part of the Task model
        if 'board' in validated_data:
            validated_data.pop('board')
        if 'workspace' in validated_data:
            validated_data.pop('workspace')
            
        # Create the task instance
        task = Task(**validated_data)
        
        # Save to generate the UUID
        task.save()
        
        # Return the saved task with its ID
        return task

class TaskMoveSerializer(serializers.Serializer):
    target_column = serializers.UUIDField()
    order = serializers.IntegerField(required=False)
    
    def validate_target_column(self, value):
        try:
            column = Column.objects.get(id=value)
            return column
        except Column.DoesNotExist:
            raise serializers.ValidationError("Target column does not exist")

class TaskAssignmentCreateSerializer(serializers.ModelSerializer):
    assignee_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = TaskAssignment
        fields = ['task', 'assignee_id']
    
    def validate_assignee_id(self, value):
        try:
            user = User.objects.get(id=value)
            # Check if user is a member of the project
            task = self.initial_data.get('task')
            if task:
                task_obj = Task.objects.get(id=task)
                project = task_obj.column.board.workspace.project
                if not ProjectMember.objects.filter(project=project, user=user).exists():
                    raise serializers.ValidationError("User is not a member of this project")
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
    
    def create(self, validated_data):
        assignee = validated_data.pop('assignee_id')
        assigned_by = self.context['request'].user
        return TaskAssignment.objects.create(
            assignee=assignee,
            assigned_by=assigned_by,
            **validated_data
        )

class TaskCommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskComment
        fields = ['task', 'content', 'attachment']
    
    def create(self, validated_data):
        author = self.context['request'].user
        return TaskComment.objects.create(author=author, **validated_data) 