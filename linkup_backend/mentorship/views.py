from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from .models import MentorProfile, MeetingRequest, Meeting
from .serializers import (
    MentorProfileSerializer, MentorProfileCreateUpdateSerializer,
    MeetingRequestSerializer, MeetingRequestCreateSerializer,
    MeetingSerializer
)


class MentorProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for mentor profiles
    """
    queryset = MentorProfile.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ['skills', 'user__username', 'user__first_name', 'user__last_name']
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MentorProfileCreateUpdateSerializer
        return MentorProfileSerializer

    def perform_create(self, serializer):
        # Associate the current user with the mentor profile
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get the current user's mentor profile if it exists, otherwise return 404"""
        try:
            profile = MentorProfile.objects.get(user=request.user)
            serializer = MentorProfileSerializer(profile)
            return Response(serializer.data)
        except MentorProfile.DoesNotExist:
            return Response(
                {"detail": "You are not registered as a mentor."},
                status=status.HTTP_404_NOT_FOUND
            )


class MeetingRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for meeting requests
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Return requests where the user is either mentor or mentee
        return MeetingRequest.objects.filter(
            Q(mentor=self.request.user) | Q(mentee=self.request.user)
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MeetingRequestCreateSerializer
        return MeetingRequestSerializer
    
    def perform_create(self, serializer):
        # Set the current user as mentee
        serializer.save(mentee=self.request.user)
    
    @action(detail=False, methods=['get'])
    def as_mentor(self, request):
        """Get all meeting requests where the user is a mentor"""
        queryset = MeetingRequest.objects.filter(mentor=request.user).order_by('-created_at')
        serializer = MeetingRequestSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def as_mentee(self, request):
        """Get all meeting requests where the user is a mentee"""
        queryset = MeetingRequest.objects.filter(mentee=request.user).order_by('-created_at')
        serializer = MeetingRequestSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a meeting request and create a meeting"""
        meeting_request = self.get_object()
        
        # Ensure the current user is the mentor
        if meeting_request.mentor != request.user:
            return Response(
                {"detail": "Only the mentor can accept this request."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update the meeting request status
        meeting_request.status = 'accepted'
        meeting_request.save()
        
        # Create a meeting
        meeting = Meeting.objects.create(
            meeting_request=meeting_request,
            scheduled_date=meeting_request.proposed_date,
            scheduled_time=meeting_request.proposed_time,
            duration_minutes=meeting_request.duration_minutes
        )
        
        # Return the meeting details
        meeting_serializer = MeetingSerializer(meeting)
        return Response(meeting_serializer.data)
    
    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a meeting request"""
        meeting_request = self.get_object()
        
        # Ensure the current user is the mentor
        if meeting_request.mentor != request.user:
            return Response(
                {"detail": "Only the mentor can decline this request."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update the meeting request status
        meeting_request.status = 'declined'
        meeting_request.save()
        
        serializer = MeetingRequestSerializer(meeting_request)
        return Response(serializer.data)


class MeetingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for meetings (read-only, created via MeetingRequest)
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MeetingSerializer
    
    def get_queryset(self):
        # Return meetings where the user is either mentor or mentee
        return Meeting.objects.filter(
            Q(meeting_request__mentor=self.request.user) | 
            Q(meeting_request__mentee=self.request.user)
        ).order_by('-scheduled_date', '-scheduled_time')
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a meeting"""
        meeting = self.get_object()
        
        # Ensure the current user is either the mentor or mentee
        if request.user not in [meeting.meeting_request.mentor, meeting.meeting_request.mentee]:
            return Response(
                {"detail": "Only the mentor or mentee can cancel this meeting."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update the meeting status
        meeting.status = 'cancelled'
        meeting.save()
        
        # Also update the meeting request status
        meeting.meeting_request.status = 'cancelled'
        meeting.meeting_request.save()
        
        serializer = MeetingSerializer(meeting)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a meeting as completed"""
        meeting = self.get_object()
        
        # Ensure the current user is either the mentor or mentee
        if request.user not in [meeting.meeting_request.mentor, meeting.meeting_request.mentee]:
            return Response(
                {"detail": "Only the mentor or mentee can complete this meeting."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update the meeting status
        meeting.status = 'completed'
        meeting.save()
        
        # Also update the meeting request status
        meeting.meeting_request.status = 'completed'
        meeting.meeting_request.save()
        
        serializer = MeetingSerializer(meeting)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming meetings for the current user"""
        now = timezone.now()
        today = now.date()
        
        # Get meetings scheduled for today or in the future
        queryset = Meeting.objects.filter(
            Q(meeting_request__mentor=request.user) | 
            Q(meeting_request__mentee=request.user),
            scheduled_date__gte=today,
            status__in=['scheduled', 'ongoing']
        ).order_by('scheduled_date', 'scheduled_time')
        
        serializer = MeetingSerializer(queryset, many=True)
        return Response(serializer.data)
