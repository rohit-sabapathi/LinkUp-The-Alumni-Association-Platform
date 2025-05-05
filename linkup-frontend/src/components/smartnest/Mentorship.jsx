import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon, CalendarIcon, PlusCircleIcon,
  AcademicCapIcon, CheckCircleIcon, ClockIcon 
} from '@heroicons/react/24/outline';
import { getMyMentorProfile, getUpcomingMeetings } from '../../services/mentorshipService';
import { Spinner } from '../ui/Spinner';
import AuthContext from '../../contexts/AuthContext';

const Mentorship = () => {
  const [isMentor, setIsMentor] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is a mentor
        try {
          const mentorProfile = await getMyMentorProfile();
          setIsMentor(true);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // User is not a mentor - this is expected
            setIsMentor(false);
          } else {
            console.error('Error checking mentor status:', error);
          }
        }

        // Get upcoming meetings
        try {
          const meetings = await getUpcomingMeetings();
          setUpcomingMeetings(meetings);
        } catch (error) {
          console.error('Error fetching meetings:', error);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-12 flex justify-center">
        <Spinner size="large" text="Loading mentorship data..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-400 mb-8">Knowledge Sharing & Mentorship</h1>
      
      {/* Become a Mentor Section - Only shown to non-mentors */}
      {!isMentor && (
        <div className="mb-10 p-6 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl border border-purple-800/50">
          <div className="flex flex-col md:flex-row items-center text-center md:text-left md:justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-semibold text-purple-300 mb-2">Share Your Knowledge</h2>
              <p className="text-slate-400">Become a mentor and help others grow by sharing your expertise and experience.</p>
            </div>
            <Link 
              to="/mentorship/become-mentor"
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
            >
              Become a Mentor
            </Link>
          </div>
        </div>
      )}
      
      {/* Upcoming Meetings Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-slate-200">Upcoming Meetings</h2>
          <Link to="/mentorship/meetings" className="text-sm text-blue-400 hover:text-blue-300">
            View all
          </Link>
        </div>
        
        {upcomingMeetings.length > 0 ? (
          <div className="space-y-4">
            {upcomingMeetings.slice(0, 3).map((meeting) => (
              <Link 
                key={meeting.id} 
                to={`/mentorship/meetings/${meeting.id}`}
                className="block p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <CalendarIcon className="h-5 w-5 text-purple-400 mt-1" />
                    <div>
                      <h3 className="font-medium text-slate-200">
                        Meeting with {meeting.meeting_request.mentor.id === user?.id ? 
                          meeting.meeting_request.mentee.first_name : meeting.meeting_request.mentor.first_name}
                      </h3>
                      <p className="text-sm text-slate-400">{meeting.meeting_request.topic}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 text-slate-500" />
                        <span className="text-xs text-slate-400">
                          {new Date(meeting.scheduled_date + 'T' + meeting.scheduled_time).toLocaleString()} 
                          ({meeting.duration_minutes} min)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 bg-green-900/20 py-1 px-2 rounded text-xs text-green-400">
                    <CheckCircleIcon className="h-3 w-3" />
                    <span>Scheduled</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-800/30 rounded-lg">
            <CalendarIcon className="h-12 w-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-slate-400 font-medium mb-1">No upcoming meetings</h3>
            <p className="text-slate-500 text-sm mb-4">Schedule a session with a mentor to get started</p>
            <Link 
              to="/mentorship/find"
              className="inline-block px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Find a Mentor
            </Link>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link 
          to="/mentorship/requests"
          className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 text-center transition-colors"
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2 rounded-full bg-slate-700/50">
              <ClockIcon className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-300">Meeting Requests</span>
          </div>
        </Link>
        
        <Link 
          to="/mentorship/meetings"
          className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 text-center transition-colors"
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2 rounded-full bg-slate-700/50">
              <CalendarIcon className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-sm text-slate-300">My Meetings</span>
          </div>
        </Link>
        
        <Link 
          to="/mentorship/find"
          className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 text-center transition-colors"
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2 rounded-full bg-slate-700/50">
              <UserGroupIcon className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-300">Browse Mentors</span>
          </div>
        </Link>
        
        {isMentor ? (
          <Link 
            to="/mentorship/my-profile"
            className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 text-center transition-colors"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="p-2 rounded-full bg-slate-700/50">
                <AcademicCapIcon className="h-5 w-5 text-orange-400" />
              </div>
              <span className="text-sm text-slate-300">My Mentor Profile</span>
            </div>
          </Link>
        ) : (
          <Link 
            to="/mentorship/become-mentor"
            className="p-4 bg-purple-800/50 rounded-lg hover:bg-purple-800 text-center transition-colors border border-purple-700/50"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="p-2 rounded-full bg-purple-700/50">
                <PlusCircleIcon className="h-5 w-5 text-purple-300" />
              </div>
              <span className="text-sm text-purple-300">Become a Mentor</span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Mentorship; 