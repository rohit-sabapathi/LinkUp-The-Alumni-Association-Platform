from django.contrib.auth import get_user_model
from .models import CustomUser

User = get_user_model()

def get_profile_data(backend, user, response, *args, **kwargs):
    """
    Pipeline function for creating/updating user profile data from social auth.
    This is called after the user has been created/authenticated.
    """
    if backend.name == 'google-oauth2':
        if not user.first_name and 'given_name' in response:
            user.first_name = response['given_name']

        if not user.last_name and 'family_name' in response:
            user.last_name = response['family_name']

        # Set profile picture from Google if available and user doesn't have one yet
        if 'picture' in response and not user.profile_picture:
            # This depends on how your CustomUser model handles profile pictures
            # You might need to download the image from URL or just store the URL
            profile_picture_url = response.get('picture')
            # Here you would save the profile picture - implementation depends on your model

        # Make sure the user has the necessary profile data
        if isinstance(user, CustomUser):
            # Set default user type if not set already
            if not user.user_type:
                user.user_type = 'STUDENT'  # Default type, adjust as needed
            
            # You can add more profile data mapping here
            # Example: user.department = response.get('department', '')
        
        user.save()
    
    return {
        'user': user,
        'is_new': kwargs.get('is_new', False)
    } 