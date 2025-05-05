from django.contrib import admin
from .models import MentorProfile, MeetingRequest, Meeting

@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_available', 'years_of_experience', 'created_at')
    list_filter = ('is_available', 'years_of_experience')
    search_fields = ('user__username', 'user__email', 'skills')
    date_hierarchy = 'created_at'

@admin.register(MeetingRequest)
class MeetingRequestAdmin(admin.ModelAdmin):
    list_display = ('mentor', 'mentee', 'topic', 'proposed_date', 'proposed_time', 'status')
    list_filter = ('status', 'proposed_date')
    search_fields = ('mentor__username', 'mentee__username', 'topic', 'description')
    date_hierarchy = 'created_at'

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('get_mentor', 'get_mentee', 'scheduled_date', 'scheduled_time', 'status')
    list_filter = ('status', 'scheduled_date')
    search_fields = ('meeting_request__mentor__username', 'meeting_request__mentee__username')
    date_hierarchy = 'scheduled_date'
    
    def get_mentor(self, obj):
        return obj.meeting_request.mentor.username
    get_mentor.short_description = 'Mentor'
    get_mentor.admin_order_field = 'meeting_request__mentor__username'
    
    def get_mentee(self, obj):
        return obj.meeting_request.mentee.username
    get_mentee.short_description = 'Mentee'
    get_mentee.admin_order_field = 'meeting_request__mentee__username'
