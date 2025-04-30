from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, choices=[
        ('TECH', 'Technology'),
        ('EEE', 'Electrical & Electronics'),
        ('ECE', 'Electronics & Communication'),
        ('MECH', 'Mechanical'),
        ('AGRI', 'Agricultural'),
        ('OTHER', 'Other')
    ])

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class CustomUser(AbstractUser):
    class UserType(models.TextChoices):
        ADMIN = 'ADMIN', _('Admin')
        ALUMNI = 'ALUMNI', _('Alumni')
        STUDENT = 'STUDENT', _('Student')
        FACULTY = 'FACULTY', _('Faculty')

    email = models.EmailField(_('email address'), unique=True)
    user_type = models.CharField(
        max_length=10,
        choices=UserType.choices,
        default=UserType.ALUMNI,
    )
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    current_position = models.CharField(max_length=100, blank=True)
    company = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    linkedin_profile = models.URLField(max_length=200, blank=True)
    github_profile = models.URLField(max_length=200, blank=True)
    website = models.URLField(max_length=200, blank=True)
    skills = models.ManyToManyField(Skill, related_name='users', blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class UserFollowing(models.Model):
    user = models.ForeignKey(CustomUser, related_name='following_relationships', on_delete=models.CASCADE)
    following_user = models.ForeignKey(CustomUser, related_name='follower_relationships', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'following_user')

    def __str__(self):
        return f"{self.user} follows {self.following_user}"

class FollowRequest(models.Model):
    from_user = models.ForeignKey(CustomUser, related_name='sent_follow_requests', on_delete=models.CASCADE)
    to_user = models.ForeignKey(CustomUser, related_name='received_follow_requests', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('ACCEPTED', 'Accepted'),
            ('REJECTED', 'Rejected')
        ],
        default='PENDING'
    )

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"Follow request from {self.from_user} to {self.to_user}"

class Notification(models.Model):
    user = models.ForeignKey(CustomUser, related_name='notifications', on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.user}"
