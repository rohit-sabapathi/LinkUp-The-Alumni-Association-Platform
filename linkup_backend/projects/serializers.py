from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, Workspace, ProjectMember, JoinRequest

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
        fields = ['id', 'title', 'description', 'slug', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']

class ProjectListSerializer(serializers.ModelSerializer):
    creator = UserMiniSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    workspace_slug = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'short_description', 'project_type',
            'skills', 'open_for_collaboration', 'project_image',
            'created_at', 'creator', 'member_count', 'workspace_slug'
        ]
        read_only_fields = ['id', 'created_at', 'creator']
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_workspace_slug(self, obj):
        try:
            return obj.workspace.slug
        except Workspace.DoesNotExist:
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
    class Meta:
        model = Project
        fields = [
            'title', 'short_description', 'detailed_description',
            'project_type', 'skills', 'max_team_members', 'open_for_collaboration',
            'github_link', 'project_image'
        ]
    
    def create(self, validated_data):
        user = self.context['request'].user
        project = Project.objects.create(creator=user, **validated_data)
        
        # Automatically add creator as admin member
        ProjectMember.objects.create(
            project=project,
            user=user,
            role='admin'
        )
        
        # Create workspace for the project
        workspace_title = validated_data.get('title', f"Workspace for {project.id}")
        workspace_description = validated_data.get('short_description', None)
        
        Workspace.objects.create(
            project=project,
            title=workspace_title,
            description=workspace_description
        )
        
        return project

class JoinRequestSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = JoinRequest
        fields = ['id', 'project', 'project_title', 'user', 'message', 'status', 'created_at']
        read_only_fields = ['id', 'user', 'status', 'created_at', 'project_title']

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