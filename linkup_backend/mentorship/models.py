from django.db import models
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string

User = get_user_model()

class MentorProfile(models.Model):
    user = models.OneToOneField(User, related_name='mentor_profile', on_delete=models.CASCADE)
    skills = models.TextField(help_text="Comma-separated skills")
    bio = models.TextField()
    years_of_experience = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Mentor Profile"


class MeetingRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    mentor = models.ForeignKey(User, related_name='mentor_meeting_requests', on_delete=models.CASCADE)
    mentee = models.ForeignKey(User, related_name='mentee_meeting_requests', on_delete=models.CASCADE)
    topic = models.CharField(max_length=255)
    description = models.TextField()
    proposed_date = models.DateField()
    proposed_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Meeting request from {self.mentee.username} to {self.mentor.username}"


class Meeting(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    meeting_request = models.OneToOneField(MeetingRequest, related_name='meeting', on_delete=models.CASCADE)
    meeting_link = models.CharField(max_length=255)
    room_name = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Meeting between {self.meeting_request.mentee.username} and {self.meeting_request.mentor.username}"

    def save(self, *args, **kwargs):
        if not self.room_name:
            # Generate a unique room name
            self.room_name = get_random_string(16).lower()
        
        if not self.meeting_link:
            # Create Jitsi meeting link
            self.meeting_link = f"https://meet.jit.si/{self.room_name}"
        
        super().save(*args, **kwargs)
