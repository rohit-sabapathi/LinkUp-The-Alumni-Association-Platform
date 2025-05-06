from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Project, Workspace, ProjectMember, JoinRequest, 
    ResourceCategory, Resource, Board, Column, 
    Task, TaskAssignment, TaskComment, ProgressLog, ProgressLogTask,
    ProjectInvitation, Funding
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
        try:
            # Create project with user as creator
            project = Project.objects.create(**validated_data)
            
            # Create workspace for the project
            workspace = Workspace.objects.create(
                project=project,
                title=project.title,  # Use project title directly
                description=project.short_description
            )
            print(f"Created workspace with slug: {workspace.slug}")
            
            return project
            
        except Exception as e:
            print(f"Error in project creation: {str(e)}")
            raise serializers.ValidationError({"detail": f"Failed to create project: {str(e)}"})

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
        User = get_user_model()
        try:
            user = User.objects.get(id=value)
            # Check if user is a member of the project
            task = self.initial_data.get('task')
            task_obj = Task.objects.get(id=task)
            project = task_obj.column.board.workspace.project
            
            if not ProjectMember.objects.filter(project=project, user=user).exists() and project.creator != user:
                raise serializers.ValidationError("User is not a member of this project")
            
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
    
    def create(self, validated_data):
        assignee = validated_data.pop('assignee_id')
        assigned_by = self.context['request'].user
        
        # Create assignment with assignee
        assignment = TaskAssignment(
            assignee=assignee,
            assigned_by=assigned_by,
            **validated_data
        )
        assignment.save()
        return assignment

class TaskCommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskComment
        fields = ['task', 'content', 'attachment']
    
    def create(self, validated_data):
        author = self.context['request'].user
        comment = TaskComment(
            author=author,
            **validated_data
        )
        comment.save()
        return comment

# Progress Log Serializers
class ProgressLogTaskSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = ProgressLogTask
        fields = [
            'id', 'task', 'task_title', 'status', 
            'contribution', 'hours_spent'
        ]
        read_only_fields = ['id']

class ProgressLogSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    tasks = ProgressLogTaskSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProgressLog
        fields = [
            'id', 'workspace', 'user', 'week_number', 
            'week_start_date', 'summary', 'blockers', 
            'goals_next_week', 'created_at', 'updated_at', 'tasks'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class ProgressLogCreateSerializer(serializers.ModelSerializer):
    task_updates = ProgressLogTaskSerializer(many=True, required=False)
    
    class Meta:
        model = ProgressLog
        fields = [
            'workspace', 'week_number', 'week_start_date', 
            'summary', 'blockers', 'goals_next_week', 'task_updates'
        ]
    
    def validate_workspace(self, value):
        # Check if user is a member of the project
        user = self.context['request'].user
        
        # If value is a string (slug), try to get the workspace by slug
        if isinstance(value, str):
            try:
                # Try to parse as UUID first
                import uuid
                try:
                    uuid_obj = uuid.UUID(value)
                    workspace = Workspace.objects.get(id=uuid_obj)
                except (ValueError, Workspace.DoesNotExist):
                    # If not a valid UUID, try to get by slug
                    workspace = Workspace.objects.get(slug=value)
                value = workspace
            except Workspace.DoesNotExist:
                raise serializers.ValidationError(f"Workspace with ID or slug '{value}' does not exist")
        
        project = value.project
        
        if not (ProjectMember.objects.filter(project=project, user=user).exists() or project.creator == user):
            raise serializers.ValidationError("You don't have access to this workspace")
        
        # For create operation, check if a progress log already exists for this user, workspace, and week
        # This prevents the UNIQUE constraint error and provides a better error message
        if self.instance is None:  # This is a create operation
            week_number = self.initial_data.get('week_number')
            if week_number:
                existing_log = ProgressLog.objects.filter(
                    workspace=value,
                    user=user,
                    week_number=week_number
                ).first()
                
                if existing_log:
                    raise serializers.ValidationError(
                        f"You already have a progress log for week {week_number}. Please update the existing log instead."
                    )
        
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        task_updates = validated_data.pop('task_updates', [])
        
        # Make sure user is not already in validated_data
        if 'user' in validated_data:
            validated_data.pop('user')
        
        # Create the progress log
        try:
            progress_log = ProgressLog.objects.create(
                user=user,
                **validated_data
            )
            
            # Create task updates
            for task_data in task_updates:
                try:
                    ProgressLogTask.objects.create(
                        progress_log=progress_log,
                        **task_data
                    )
                except Exception as e:
                    print(f"Error creating task update: {str(e)}")
                    # Continue with other task updates even if one fails
            
            return progress_log
        except Exception as e:
            error_message = str(e)
            if "UNIQUE constraint failed" in error_message:
                # Handle the uniqueness constraint error more gracefully
                existing_log = ProgressLog.objects.filter(
                    workspace=validated_data['workspace'],
                    user=user,
                    week_number=validated_data['week_number']
                ).first()
                
                if existing_log:
                    # If an existing log was found, return it instead of raising an error
                    return existing_log
            
            # Re-raise the exception for other types of errors
            raise
    
    def update(self, instance, validated_data):
        task_updates = validated_data.pop('task_updates', None)
        
        # Make sure user is not in validated_data
        if 'user' in validated_data:
            validated_data.pop('user')
        
        # Update progress log fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # If task_updates provided, handle them
        if task_updates is not None:
            # Clear existing task updates and create new ones
            instance.tasks.all().delete()
            
            for task_data in task_updates:
                try:
                    ProgressLogTask.objects.create(
                        progress_log=instance,
                        **task_data
                    )
                except Exception as e:
                    print(f"Error creating task update during update: {str(e)}")
                    # Continue with other task updates even if one fails
        
        return instance

class ProgressLogListSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    tasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProgressLog
        fields = [
            'id', 'workspace', 'user', 'week_number', 
            'week_start_date', 'created_at', 'tasks_count'
        ]
        read_only_fields = ['id', 'user', 'created_at']
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()

class ProjectInvitationSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    invited_by = UserMiniSerializer(read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = ProjectInvitation
        fields = ['id', 'project', 'project_title', 'user', 'message', 'role', 'invited_by', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at', 'project_title', 'invited_by']

class ProjectInvitationCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = ProjectInvitation
        fields = ['project', 'user_id', 'message', 'role']
        
    def validate_user_id(self, value):
        User = get_user_model()
        try:
            user = User.objects.get(id=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(f"User with ID {value} does not exist")
    
    def validate(self, data):
        project = data.get('project')
        user_id = data.get('user_id')
        User = get_user_model()
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user_id": "User does not exist"})
        
        # Check if user is already a member
        if ProjectMember.objects.filter(project=project, user=user).exists():
            raise serializers.ValidationError(
                {"user_id": "User is already a member of this project"}
            )
        
        # Check if there's already a pending invitation
        if ProjectInvitation.objects.filter(
            project=project, 
            user=user,
            status='pending'
        ).exists():
            raise serializers.ValidationError(
                {"user_id": "An invitation for this user is already pending"}
            )
        
        return data
        
    def create(self, validated_data):
        user_id = validated_data.pop('user_id')
        invited_by = self.context['request'].user
        User = get_user_model()
        
        # Get the user object
        user = User.objects.get(id=user_id)
        
        # Create the invitation
        return ProjectInvitation.objects.create(
            user=user,
            invited_by=invited_by,
            **validated_data
        )

class ProjectInvitationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectInvitation
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
        
        # Update the invitation status
        instance.status = new_status
        instance.save()
        
        # If status changed to accepted, create project membership
        if old_status != 'accepted' and new_status == 'accepted':
            # Check if there's space on the team
            project = instance.project
            current_members = project.members.count()
            
            if current_members >= project.max_team_members:
                raise serializers.ValidationError(
                    "Cannot accept invitation: maximum number of team members reached"
                )
            
            # Create the membership
            ProjectMember.objects.create(
                project=project,
                user=instance.user,
                role=instance.role
            )
            
        return instance

class FundingSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    project_id = serializers.IntegerField(source='project.id', read_only=True)
    creator_username = serializers.CharField(source='project.creator.username', read_only=True)
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = Funding
        fields = [
            'id', 'project', 'project_id', 'project_title', 'title', 
            'description', 'amount', 'qr_code', 'qr_code_url', 
            'created_at', 'status', 'creator_username'
        ]
        read_only_fields = ['created_at', 'status']

    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
        return None

    def validate_project(self, value):
        # Check if the user is the creator of the project
        if value.creator != self.context['request'].user:
            raise serializers.ValidationError("You can only create funding requests for your own projects")
        return value

    def create(self, validated_data):
        # Set default status to 'active'
        validated_data['status'] = 'active'
        return super().create(validated_data) 