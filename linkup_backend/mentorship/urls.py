from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'mentors', views.MentorProfileViewSet, basename='mentors')
router.register(r'meeting-requests', views.MeetingRequestViewSet, basename='meeting-requests')
router.register(r'meetings', views.MeetingViewSet, basename='meetings')

urlpatterns = [
    path('', include(router.urls)),
] 