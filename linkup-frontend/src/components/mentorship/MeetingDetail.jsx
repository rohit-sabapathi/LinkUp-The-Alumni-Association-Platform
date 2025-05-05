import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  UserCircleIcon,
  ArrowLeftIcon,
  ClockIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import AuthContext from '../../contexts/AuthContext';
import { getAllMeetings, completeMeeting, cancelMeeting } from '../../services/mentorshipService';
import { Spinner } from '../ui/Spinner';
import { toast } from 'react-hot-toast';

const statusColors = {
  scheduled: 'bg-blue-900/20 text-blue-400',
  ongoing: 'bg-green-900/20 text-green-400',
  completed: 'bg-purple-900/20 text-purple-400',
  cancelled: 'bg-red-900/20 text-red-400'
};

const statusIcons = {
  scheduled: <CalendarIcon className="h-5 w-5" />,
  ongoing: <VideoCameraIcon className="h-5 w-5" />,
  completed: <CheckCircleIcon className="h-5 w-5" />,
  cancelled: <XCircleIcon className="h-5 w-5" />
};

const MeetingDetail = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const meetings = await getAllMeetings();
        const foundMeeting = meetings.find(m => m.id.toString() === meetingId);
        
        if (foundMeeting) {
          setMeeting(foundMeeting);
          
          // Determine user role
          if (user?.id !== foundMeeting.meeting_request.mentor.id && 
              user?.id !== foundMeeting.meeting_request.mentee.id) {
            // User is neither mentor nor mentee
            navigate('/mentorship/meetings');
            toast.error('You do not have access to this meeting');
          } else {
            setUserRole(user?.id === foundMeeting.meeting_request.mentor.id ? 'mentor' : 'mentee');
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching meeting:', error);
        toast.error('Failed to load meeting details');
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId, user, navigate]);

  const handleJoinMeeting = () => {
    setIsJoining(true);
    
    // Add slight delay for better UX
    setTimeout(() => {
      const userDisplayName = `${user?.first_name} ${user?.last_name}`;
      const userRole = user?.id === meeting.meeting_request.mentor.id ? 'mentor' : 'mentee';
      const meetingUrl = `https://meet.jit.si/${meeting.room_name}#userInfo.displayName="${encodeURIComponent(userDisplayName + ' (' + userRole + ')')}"`; 
      
      // Open in new tab
      window.open(meetingUrl, '_blank');
      setIsJoining(false);
    }, 500);
  };

  const handleCompleteMeeting = async () => {
    try {
      const updatedMeeting = await completeMeeting(meetingId);
      setMeeting(updatedMeeting);
      toast.success('Meeting marked as completed');
    } catch (error) {
      console.error('Error completing meeting:', error);
      toast.error('Failed to update meeting status');
    }
  };

  const handleCancelMeeting = async () => {
    if (window.confirm('Are you sure you want to cancel this meeting?')) {
      try {
        const updatedMeeting = await cancelMeeting(meetingId);
        setMeeting(updatedMeeting);
        toast.success('Meeting cancelled successfully');
      } catch (error) {
        console.error('Error cancelling meeting:', error);
        toast.error('Failed to cancel meeting');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-12 flex justify-center">
        <Spinner size="large" text="Loading meeting details..." />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-4xl mx-auto mt-12">
        <div className="text-center py-12 bg-slate-800/30 rounded-lg">
          <ExclamationCircleIcon className="h-12 w-12 mx-auto text-red-500 mb-3" />
          <h3 className="text-slate-300 font-medium mb-1">Meeting not found</h3>
          <p className="text-slate-500 text-sm mb-4">
            The meeting you're looking for doesn't exist or has been removed
          </p>
          <Link
            to="/mentorship/meetings"
            className="inline-block px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            View All Meetings
          </Link>
        </div>
      </div>
    );
  }

  const { meeting_request, scheduled_date, scheduled_time, duration_minutes, status, room_name } = meeting;
  const isMentor = user?.id === meeting_request.mentor.id;
  const otherPerson = isMentor ? meeting_request.mentee : meeting_request.mentor;
  const scheduledDateTime = new Date(`${scheduled_date}T${scheduled_time}`);
  const isUpcoming = status === 'scheduled' && scheduledDateTime > new Date();
  const canJoin = status === 'scheduled' || status === 'ongoing';
  const canCancel = status === 'scheduled';
  const canComplete = status === 'ongoing' || status === 'scheduled';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Link 
          to="/mentorship/meetings"
          className="mr-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-slate-400" />
        </Link>
        <h1 className="text-3xl font-bold text-blue-400">Meeting Details</h1>
      </div>

      {/* Meeting Card */}
      <div className="bg-slate-800/40 rounded-xl overflow-hidden mb-8">
        {/* Meeting Header */}
        <div className="p-6 md:p-8 pb-4 border-b border-slate-700/50">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-200 mb-2">
                {meeting_request.topic}
              </h2>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${statusColors[status]}`}>
                  {statusIcons[status]}
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </span>
                
                <span className="text-sm text-slate-400">
                  <ClockIcon className="inline-block h-4 w-4 mr-1 -mt-0.5" />
                  {duration_minutes} minutes
                </span>
              </div>
            </div>
            
            {canJoin && (
              <button
                onClick={handleJoinMeeting}
                disabled={isJoining}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <>
                    <Spinner size="small" text={null} />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <VideoCameraIcon className="h-5 w-5" />
                    <span>Join Meeting</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Meeting Content */}
        <div className="p-6 md:p-8">
          <div className="space-y-6">
            {/* Meeting Info Section - Always visible */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Date & Time</h3>
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-slate-200">
                      {scheduledDateTime.toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-slate-400">
                      {scheduledDateTime.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' - '}
                      {new Date(scheduledDateTime.getTime() + duration_minutes * 60000).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Participant Info */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">
                  {isMentor ? 'Mentee' : 'Mentor'}
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {otherPerson.profile_image ? (
                      <img 
                        src={otherPerson.profile_image} 
                        alt={`${otherPerson.first_name} ${otherPerson.last_name}`} 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
                        <UserCircleIcon className="h-7 w-7 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">
                      {otherPerson.first_name} {otherPerson.last_name}
                    </p>
                    <p className="text-slate-400 text-sm">{otherPerson.email}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Meeting Description */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Description</h3>
              <p className="text-slate-400 whitespace-pre-line">{meeting_request.description}</p>
            </div>
            
            {/* Meeting Link Info */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Meeting Link</h3>
              <div className="flex items-center justify-between bg-slate-800 p-2 rounded">
                <span className="text-slate-400 text-sm truncate mr-2">{meeting.meeting_link}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(meeting.meeting_link);
                    toast.success('Meeting link copied to clipboard');
                  }}
                  className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Note: Jitsi now requires authentication. When you join, you may need to sign in with a Google, GitHub, or Facebook account.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              {canCancel && (
                <button
                  onClick={handleCancelMeeting}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-900/30 border border-red-800/50 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                >
                  <XCircleIcon className="h-5 w-5" />
                  <span>Cancel Meeting</span>
                </button>
              )}
              
              {canComplete && (
                <button
                  onClick={handleCompleteMeeting}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-900/30 border border-purple-800/50 text-purple-400 rounded-lg hover:bg-purple-900/50 transition-colors"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Mark as Completed</span>
                </button>
              )}
              
              <Link
                to={`/messages/${isMentor ? meeting_request.mentee.id : meeting_request.mentor.id}`}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-900/30 border border-blue-800/50 text-blue-400 rounded-lg hover:bg-blue-900/50 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span>Send Message</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetail; 