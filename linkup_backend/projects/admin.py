from django.contrib import admin
from .models import (
    Project, 
    Workspace, 
    ProjectMember, 
    JoinRequest,
    ResourceCategory,
    Resource
)

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
    list_display = ('title', 'project_type', 'creator', 'created_at', 'open_for_collaboration')
    list_filter = ('project_type', 'open_for_collaboration', 'created_at')
    search_fields = ('title', 'short_description', 'detailed_description')
    readonly_fields = ('id', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    inlines = [ProjectMemberInline, JoinRequestInline]

@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'slug', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'description', 'slug')
    readonly_fields = ('id', 'slug', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    prepopulated_fields = {'slug': ('title',)}

@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'project', 'role', 'joined_at')
    list_filter = ('role', 'joined_at')
    search_fields = ('user__username', 'project__title')
    readonly_fields = ('id', 'joined_at')
    date_hierarchy = 'joined_at'

@admin.register(JoinRequest)
class JoinRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'project', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'project__title', 'message')
    readonly_fields = ('id', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'

@admin.register(ResourceCategory)
class ResourceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'workspace', 'created_by', 'created_at', 'resources_count')
    list_filter = ('created_at',)
    search_fields = ('name', 'description', 'workspace__title')
    readonly_fields = ('id', 'created_at', 'updated_at')

    def resources_count(self, obj):
        return obj.resources.count()
    resources_count.short_description = 'Resources'

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'file_type', 'uploaded_by', 'created_at')
    list_filter = ('file_type', 'created_at')
    search_fields = ('title', 'description', 'category__name')
    readonly_fields = ('id', 'file_type', 'file_size', 'created_at', 'updated_at')
    date_hierarchy = 'created_at' 