from django.db import models
from django.conf import settings
from django.utils.text import slugify
import uuid

class Project(models.Model):
    """
    Model for collaborative projects created by users
    """
    PROJECT_TYPES = (
        ('Startup', 'Startup'),
        ('Research', 'Research'),
        ('Social Impact', 'Social Impact'),
        ('Open Source', 'Open Source'),
        ('Other', 'Other'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    short_description = models.CharField(max_length=255)
    detailed_description = models.TextField()
    project_type = models.CharField(max_length=50, choices=PROJECT_TYPES)
    skills = models.JSONField(default=list)
    max_team_members = models.PositiveIntegerField(default=3)
    open_for_collaboration = models.BooleanField(default=True)
    github_link = models.URLField(blank=True, null=True)
    project_image = models.ImageField(upload_to='project_images/', blank=True, null=True)
    
    # Timestamps and user info
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='created_projects'
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class Workspace(models.Model):
    """
    Model for collaborative workspaces associated with projects
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(
        Project, 
        on_delete=models.CASCADE,
        related_name='workspace'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Workspace for {self.project.title}"
    
    def save(self, *args, **kwargs):
        # Create a unique slug based on project title
        if not self.slug:
            # Add project id to ensure uniqueness
            base_slug = slugify(self.title)
            self.slug = f"{base_slug}-{str(self.project.id)[:8]}"
        super().save(*args, **kwargs)

class ProjectMember(models.Model):
    """
    Model to track members of a project
    """
    ROLES = (
        ('admin', 'Admin'),
        ('member', 'Member'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('project', 'user')
        ordering = ['joined_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.project.title} ({self.role})"

class JoinRequest(models.Model):
    """
    Model to track requests to join a project
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='join_requests'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_requests'
    )
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('project', 'user')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Request from {self.user.username} for {self.project.title} - {self.status}" 