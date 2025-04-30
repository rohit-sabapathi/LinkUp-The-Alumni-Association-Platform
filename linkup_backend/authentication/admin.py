from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Skill, UserFollowing, FollowRequest, Notification

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'user_type', 'is_staff', 'is_active')
    list_filter = ('user_type', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('username', 'first_name', 'last_name', 'profile_picture', 'bio')}),
        ('Academic info', {'fields': ('graduation_year', 'department')}),
        ('Professional info', {'fields': ('current_position', 'company', 'location')}),
        ('Social profiles', {'fields': ('linkedin_profile', 'github_profile', 'website')}),
        ('Skills', {'fields': ('skills',)}),
        ('Permissions', {'fields': ('user_type', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('email', 'username')
    ordering = ('email',)

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Skill)
admin.site.register(UserFollowing)
admin.site.register(FollowRequest)
admin.site.register(Notification)
