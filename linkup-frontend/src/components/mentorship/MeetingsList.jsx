import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  VideoCameraIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { getAllMeetings } from '../../services/mentorshipService';
import { Spinner } from '../ui/Spinner';

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

const MeetingsList = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await getAllMeetings();
        setMeetings(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching meetings:', error);
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-12 flex justify-center">
        <Spinner size="large" text="Loading meetings..." />
      </div>
    );
  }

  // Group meetings by status
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled');
  const ongoingMeetings = meetings.filter(m => m.status === 'ongoing');
  const completedMeetings = meetings.filter(m => m.status === 'completed');
  const cancelledMeetings = meetings.filter(m => m.status === 'cancelled');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Link 
          to="/smartnest/mentorship"
          className="mr-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-slate-400" />
        </Link>
        <h1 className="text-3xl font-bold text-blue-400">My Meetings</h1>
      </div>

      {/* Ongoing & Upcoming Meetings */}
      {(ongoingMeetings.length > 0 || upcomingMeetings.length > 0) ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Ongoing & Upcoming Meetings</h2>
          <div className="space-y-4">
            {ongoingMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
            {upcomingMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/30 p-6 rounded-lg mb-8 text-center">
          <p className="text-slate-400">No upcoming meetings scheduled</p>
        </div>
      )}

      {/* Past Meetings */}
      {completedMeetings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Past Meetings</h2>
          <div className="space-y-4">
            {completedMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Meetings */}
      {cancelledMeetings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Cancelled Meetings</h2>
          <div className="space-y-4">
            {cancelledMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {meetings.length === 0 && (
        <div className="text-center py-12 bg-slate-800/30 rounded-lg">
          <CalendarIcon className="h-12 w-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-slate-300 font-medium mb-1">No meetings found</h3>
          <p className="text-slate-500 text-sm mb-4">Book a mentorship session to get started</p>
          <Link 
            to="/mentorship/find"
            className="inline-block px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Find a Mentor
          </Link>
        </div>
      )}
    </div>
  );
};

const MeetingCard = ({ meeting }) => {
  const { id, meeting_request, scheduled_date, scheduled_time, duration_minutes, status } = meeting;
  const scheduledDateTime = new Date(`${scheduled_date}T${scheduled_time}`);

  return (
    <Link 
      to={`/mentorship/meetings/${id}`}
      className="block p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/80 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${status === 'ongoing' ? 'bg-green-900/20' : 'bg-slate-700/50'}`}>
            {statusIcons[status]}
          </div>
          <div>
            <h3 className="font-medium text-slate-200">
              {meeting_request.topic}
            </h3>
            <p className="text-sm text-slate-400">
              {status === 'scheduled' ? 'With ' : 'Had with '}
              {meeting_request.mentor.first_name} {meeting_request.mentor.last_name}
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-400">
                {scheduledDateTime.toLocaleString()} • {duration_minutes} min
              </span>
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </Link>
  );
};

export default MeetingsList; 