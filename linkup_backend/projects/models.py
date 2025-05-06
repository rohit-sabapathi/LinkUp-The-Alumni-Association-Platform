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
    skills = models.JSONField(default=list, help_text="Skills relevant to this project")
    expertise = models.TextField(blank=True, null=True, help_text="Detailed expertise description")
    motivation = models.TextField(blank=True, null=True, help_text="Motivation for joining the project")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('project', 'user')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Request from {self.user.username} for {self.project.title} - {self.status}"

class ProjectInvitation(models.Model):
    """
    Model to track invitations sent to users to join a project
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
        related_name='invitations'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_invitations'
    )
    message = models.TextField(blank=True, null=True, help_text="Invitation message")
    role = models.CharField(max_length=20, choices=ProjectMember.ROLES, default='member')
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('project', 'user')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitation to {self.user.username} for {self.project.title} - {self.status}"

class ResourceCategory(models.Model):
    """
    Model for organizing resources within workspaces into categories
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='resource_categories'
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='created_categories',
        null=True
    )
    
    class Meta:
        verbose_name_plural = "Resource Categories"
        ordering = ['name']
        unique_together = ('workspace', 'name')
    
    def __str__(self):
        return f"{self.name} ({self.workspace.title})"

class Resource(models.Model):
    """
    Model for storing files and documents within resource categories
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        ResourceCategory,
        on_delete=models.CASCADE,
        related_name='resources'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='workspace_resources/')
    file_type = models.CharField(max_length=50, blank=True, null=True)
    file_size = models.PositiveIntegerField(blank=True, null=True)  # Size in bytes
    
    # Timestamps and user info
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='uploaded_resources',
        null=True
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        # Set file_type based on file extension
        if self.file and not self.file_type:
            filename = self.file.name
            extension = filename.split('.')[-1].lower() if '.' in filename else ''
            self.file_type = extension
            
        # Set file_size based on actual file size
        if self.file and not self.file_size and hasattr(self.file, 'size'):
            self.file_size = self.file.size
            
        super().save(*args, **kwargs)

# Kanban Board Models
class Board(models.Model):
    """
    Model for a Kanban board associated with a workspace
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.OneToOneField(
        Workspace,
        on_delete=models.CASCADE,
        related_name='kanban_board'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Board for {self.workspace.title}"

class Column(models.Model):
    """
    Model for a column within a Kanban board (e.g., To Do, In Progress, Review, Completed)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name='columns'
    )
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)  # For ordering columns on the board
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
        unique_together = ('board', 'title')
    
    def __str__(self):
        return f"{self.title} ({self.board.title})"

class Task(models.Model):
    """
    Model for a task within a Kanban column
    """
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    column = models.ForeignKey(
        Column,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)  # For ordering tasks within a column
    
    # Task attributes
    is_blocked = models.BooleanField(default=False)
    blocked_reason = models.TextField(blank=True, null=True)
    estimated_hours = models.FloatField(blank=True, null=True)
    
    # Attachments
    attachment = models.FileField(upload_to='task_attachments/', blank=True, null=True)
    attachment_name = models.CharField(max_length=255, blank=True, null=True)
    
    # Timestamps and user info
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='created_tasks',
        null=True
    )
    
    class Meta:
        ordering = ['order', 'due_date', '-created_at']
    
    def __str__(self):
        return self.title

class TaskAssignment(models.Model):
    """
    Model to track task assignments to project members
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assigned_tasks'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='task_assignments_made',
        null=True
    )
    
    class Meta:
        unique_together = ('task', 'assignee')
        ordering = ['assigned_at']
    
    def __str__(self):
        return f"{self.task.title} assigned to {self.assignee.username}"

class TaskComment(models.Model):
    """
    Model for comments on tasks
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='task_comments'
    )
    content = models.TextField()
    attachment = models.FileField(upload_to='task_comment_attachments/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.task.title}"

# Progress Log Models
class ProgressLog(models.Model):
    """
    Model for weekly progress logs by project members
    """
    STATUS_CHOICES = (
        ('completed', 'Completed'),
        ('in_progress', 'In Progress'),
        ('blocked', 'Blocked'),
        ('not_started', 'Not Started'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='progress_logs'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='progress_logs'
    )
    week_number = models.PositiveIntegerField(help_text="Week number for this progress log")
    week_start_date = models.DateField(help_text="Start date for the week")
    
    # Log content
    summary = models.TextField(help_text="Summary of work done this week")
    blockers = models.TextField(blank=True, null=True, help_text="Any blockers or challenges faced")
    goals_next_week = models.TextField(blank=True, null=True, help_text="Goals for next week")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-week_start_date', '-created_at']
        unique_together = ('workspace', 'user', 'week_number')
    
    def __str__(self):
        return f"Progress log by {self.user.username} - Week {self.week_number}"

class ProgressLogTask(models.Model):
    """
    Model linking progress logs to specific tasks
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    progress_log = models.ForeignKey(
        ProgressLog,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='progress_updates'
    )
    status = models.CharField(max_length=20, choices=ProgressLog.STATUS_CHOICES)
    contribution = models.TextField(help_text="Work done on this specific task")
    hours_spent = models.PositiveIntegerField(default=0, help_text="Hours spent on this task")
    
    class Meta:
        unique_together = ('progress_log', 'task')
    
    def __str__(self):
        return f"Task update for {self.task.title} in week {self.progress_log.week_number}"

class Funding(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='funding_requests')
    title = models.CharField(max_length=200)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    qr_code = models.ImageField(upload_to='funding_qr_codes/')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.project.title}" 