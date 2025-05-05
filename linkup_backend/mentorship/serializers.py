from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MentorProfile, MeetingRequest, Meeting

User = get_user_model()

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class MentorProfileSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    skills_list = serializers.SerializerMethodField()
    
    class Meta:
        model = MentorProfile
        fields = ['id', 'user', 'skills', 'skills_list', 'bio', 'years_of_experience', 
                  'is_available', 'created_at', 'updated_at']
    
    def get_skills_list(self, obj):
        return [skill.strip() for skill in obj.skills.split(',') if skill.strip()]


class MentorProfileCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorProfile
        fields = ['skills', 'bio', 'years_of_experience', 'is_available']


class MeetingRequestSerializer(serializers.ModelSerializer):
    mentor = UserBasicSerializer(read_only=True)
    mentee = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = MeetingRequest
        fields = ['id', 'mentor', 'mentee', 'topic', 'description', 
                  'proposed_date', 'proposed_time', 'duration_minutes', 
                  'status', 'created_at', 'updated_at']
        read_only_fields = ['status']


class MeetingRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingRequest
        fields = ['mentor', 'topic', 'description', 'proposed_date', 
                  'proposed_time', 'duration_minutes']


class MeetingSerializer(serializers.ModelSerializer):
    meeting_request = MeetingRequestSerializer(read_only=True)
    
    class Meta:
        model = Meeting
        fields = ['id', 'meeting_request', 'meeting_link', 'room_name', 
                  'status', 'scheduled_date', 'scheduled_time', 'duration_minutes', 
                  'created_at', 'updated_at']
        read_only_fields = ['meeting_link', 'room_name'] 