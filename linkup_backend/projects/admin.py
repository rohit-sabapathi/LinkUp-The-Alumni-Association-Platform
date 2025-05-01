from django.contrib import admin
from .models import Project, Workspace, ProjectMember, JoinRequest

class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 0
    readonly_fields = ['joined_at']

class JoinRequestInline(admin.TabularInline):
    model = JoinRequest
    extra = 0
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'project_type', 'open_for_collaboration', 'creator', 'created_at']
    list_filter = ['project_type', 'open_for_collaboration', 'created_at']
    search_fields = ['title', 'short_description', 'detailed_description']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProjectMemberInline, JoinRequestInline]

@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'project', 'slug', 'created_at']
    search_fields = ['title', 'description', 'slug']
    readonly_fields = ['created_at', 'updated_at']
    prepopulated_fields = {'slug': ('title',)}

@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ['id', 'project', 'user', 'role', 'joined_at']
    list_filter = ['role', 'joined_at']
    search_fields = ['project__title', 'user__username', 'user__email']
    readonly_fields = ['joined_at']

@admin.register(JoinRequest)
class JoinRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'project', 'user', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['project__title', 'user__username', 'user__email', 'message']
    readonly_fields = ['created_at', 'updated_at'] 