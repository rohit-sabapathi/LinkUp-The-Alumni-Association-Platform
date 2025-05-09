import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ClockIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  getMeetingRequestsAsMentor, 
  getMeetingRequestsAsMentee,
  acceptMeetingRequest,
  declineMeetingRequest
} from '../../services/mentorshipService';
import { Spinner } from '../ui/Spinner';
import { toast } from 'react-hot-toast';

const MeetingRequests = () => {
  const [mentorRequests, setMentorRequests] = useState([]);
  const [menteeRequests, setMenteeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mentor');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Set loading state first
        setLoading(true);
        setError(null);
        
        // Use Promise.all to fetch both types of requests in parallel
        const [mentorData, menteeData] = await Promise.all([
          getMeetingRequestsAsMentor(),
          getMeetingRequestsAsMentee()
        ]);
        
        console.log('Mentor Requests:', mentorData);
        
        // Only filter for pending requests
        setMentorRequests(mentorData);
        setMenteeRequests(menteeData);
        
        // Set loading to false once data is fetched
        setLoading(false);
      } catch (error) {
        console.error('Error fetching meeting requests:', error);
        setError('Failed to load meeting requests');
        toast.error('Failed to load meeting requests');
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Filter the requests to display based on status
  const pendingMentorRequests = mentorRequests.filter(req => req.status === 'pending');
  const pendingMenteeRequests = menteeRequests.filter(req => req.status === 'pending');

  const handleAccept = async (requestId) => {
    try {
      await acceptMeetingRequest(requestId);
      toast.success('Meeting request accepted');
      // Update the local state by filtering out the accepted request
      setMentorRequests(mentorRequests.map(req => 
        req.id === requestId ? {...req, status: 'accepted'} : req
      ));
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept meeting request');
    }
  };

  const handleDecline = async (requestId) => {
    try {
      await declineMeetingRequest(requestId);
      toast.success('Meeting request declined');
      // Update the local state by filtering out the declined request
      setMentorRequests(mentorRequests.map(req => 
        req.id === requestId ? {...req, status: 'declined'} : req
      ));
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Failed to decline meeting request');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-12 flex justify-center">
        <Spinner size="large" text="Loading meeting requests..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12">
        <div className="text-center py-8 bg-red-900/20 rounded-lg border border-red-800/30">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-slate-700 rounded-md text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Link 
          to="/smartnest/mentorship"
          className="mr-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-slate-400" />
        </Link>
        <h1 className="text-3xl font-bold text-blue-400">Meeting Requests</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'mentor'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('mentor')}
        >
          Requests to Me
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'mentee'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('mentee')}
        >
          My Requests
        </button>
      </div>

      {/* Requests Content */}
      {activeTab === 'mentor' ? (
        pendingMentorRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingMentorRequests.map((request) => (
              <div 
                key={request.id} 
                className="p-4 bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-full bg-slate-700/50">
                      <UserIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-200">
                        Request from {request.mentee.first_name} {request.mentee.last_name}
                      </h3>
                      <p className="text-sm text-slate-400">{request.topic}</p>
                      <p className="text-xs text-slate-500 mt-1">{request.description}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 text-slate-500" />
                        <span className="text-xs text-slate-400">
                          {new Date(request.proposed_date + 'T' + request.proposed_time).toLocaleString()} • {request.duration_minutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="p-2 bg-green-600/20 text-green-400 rounded-full hover:bg-green-600/30"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      className="p-2 bg-red-600/20 text-red-400 rounded-full hover:bg-red-600/30"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-800/30 rounded-lg">
            <ClockIcon className="h-12 w-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-slate-300 font-medium mb-1">No pending requests</h3>
            <p className="text-slate-500 text-sm">
              You don't have any pending mentorship requests to review
            </p>
          </div>
        )
      ) : (
        pendingMenteeRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingMenteeRequests.map((request) => (
              <div 
                key={request.id} 
                className="p-4 bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-slate-700/50">
                    <ClockIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-200">
                      Request to {request.mentor.first_name} {request.mentor.last_name}
                    </h3>
                    <p className="text-sm text-slate-400">{request.topic}</p>
                    <p className="text-xs text-slate-500 mt-1">{request.description}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-slate-500" />
                      <span className="text-xs text-slate-400">
                        {new Date(request.proposed_date + 'T' + request.proposed_time).toLocaleString()} • {request.duration_minutes} min
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-800/30 rounded-lg">
            <ClockIcon className="h-12 w-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-slate-300 font-medium mb-1">No pending requests</h3>
            <p className="text-slate-500 text-sm mb-4">
              You haven't sent any meeting requests that are pending
            </p>
            <Link 
              to="/mentorship/find"
              className="inline-block px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Find a Mentor
            </Link>
          </div>
        )
      )}
    </div>
  );
};

export default MeetingRequests; 