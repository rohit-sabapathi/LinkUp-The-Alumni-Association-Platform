"""
URL configuration for linkup_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/events/', include('events.urls')),
    path('api/preferences/', include('preferences.urls')),
    path('api/donations/', include('donations.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/mentorship/', include('mentorship.urls')),
    path('api/games/', include('games.urls')),
    path('api/knowledge-hub/', include('knowledge_hub.urls')),
    
    # Django allauth URLs
    path('accounts/', include('allauth.urls')),
    path('api/auth/dj-rest-auth/', include('dj_rest_auth.urls')),
    path('api/auth/dj-rest-auth/registration/', include('dj_rest_auth.registration.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
