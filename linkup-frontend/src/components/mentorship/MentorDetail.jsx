import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { getMentorProfile, createMeetingRequest } from '../../services/mentorshipService';
import { Spinner } from '../ui/Spinner';
import { toast } from 'react-hot-toast';

const MentorDetail = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    topic: '',
    description: '',
    proposed_date: '',
    proposed_time: '',
    duration_minutes: 30
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        const data = await getMentorProfile(mentorId);
        setMentor(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching mentor:', error);
        setLoading(false);
      }
    };

    fetchMentor();
  }, [mentorId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestForm({
      ...requestForm,
      [name]: value
    });
    
    // Clear validation error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!requestForm.topic.trim()) {
      errors.topic = 'Topic is required';
    }
    
    if (!requestForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!requestForm.proposed_date) {
      errors.proposed_date = 'Date is required';
    } else {
      // Check if date is in the future
      const selectedDate = new Date(requestForm.proposed_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.proposed_date = 'Date must be in the future';
      }
    }
    
    if (!requestForm.proposed_time) {
      errors.proposed_time = 'Time is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setRequestLoading(true);
    
    try {
      const payload = {
        ...requestForm,
        mentor: mentorId
      };
      
      await createMeetingRequest(payload);
      toast.success('Meeting request sent successfully!');
      navigate('/mentorship/requests');
    } catch (error) {
      console.error('Error creating meeting request:', error);
      toast.error('Failed to send meeting request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-12 flex justify-center">
        <Spinner size="large" text="Loading mentor profile..." />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="max-w-4xl mx-auto mt-12">
        <div className="text-center py-12 bg-slate-800/30 rounded-lg">
          <ExclamationCircleIcon className="h-12 w-12 mx-auto text-red-500 mb-3" />
          <h3 className="text-slate-300 font-medium mb-1">Mentor not found</h3>
          <p className="text-slate-500 text-sm mb-4">
            The mentor you're looking for doesn't exist or has been removed
          </p>
          <Link
            to="/mentorship/find"
            className="inline-block px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Browse Mentors
          </Link>
        </div>
      </div>
    );
  }

  const skills = mentor.skills_list || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Link 
          to="/mentorship/find"
          className="mr-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-slate-400" />
        </Link>
        <h1 className="text-3xl font-bold text-blue-400">Mentor Profile</h1>
      </div>

      <div className="bg-slate-800/40 rounded-xl overflow-hidden mb-8">
        {/* Profile header */}
        <div className="p-6 md:p-8 pb-4 border-b border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Profile image */}
            <div className="flex-shrink-0">
              {mentor.user.profile_image ? (
                <img 
                  src={mentor.user.profile_image} 
                  alt={`${mentor.user.first_name} ${mentor.user.last_name}`}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
                  <UserCircleIcon className="w-16 h-16 text-slate-500" />
                </div>
              )}
            </div>
            
            {/* Profile info */}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-slate-200 mb-2">
                {mentor.user.first_name} {mentor.user.last_name}
              </h2>
              
              <div className="flex items-center text-slate-400 mb-4">
                <AcademicCapIcon className="h-5 w-5 mr-2 text-purple-400" />
                <span>{mentor.years_of_experience} years of experience</span>
              </div>
              
              {/* Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300 border border-purple-800/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Request button (on larger screens) */}
            <div className="hidden md:block">
              <button
                onClick={() => setShowRequestForm(!showRequestForm)}
                className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                {showRequestForm ? 'Cancel Request' : 'Request Meeting'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Bio section */}
        <div className="p-6 md:p-8">
          <h3 className="text-lg font-medium text-slate-200 mb-3">About</h3>
          <p className="text-slate-400 whitespace-pre-line">{mentor.bio}</p>
          
          {/* Request button (on mobile) */}
          <div className="mt-6 block md:hidden">
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              {showRequestForm ? 'Cancel Request' : 'Request Meeting'}
            </button>
          </div>
        </div>
      </div>

      {/* Meeting Request Form */}
      {showRequestForm && (
        <div className="bg-slate-800/40 rounded-xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-6">Schedule a Meeting</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Topic *
                </label>
                <input
                  type="text"
                  name="topic"
                  value={requestForm.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., Career Advice, Technical Discussion"
                  className={`w-full p-3 bg-slate-700/50 border ${formErrors.topic ? 'border-red-500' : 'border-slate-600'} rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.topic && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.topic}</p>
                )}
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={requestForm.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Describe what you'd like to discuss in this meeting"
                  className={`w-full p-3 bg-slate-700/50 border ${formErrors.description ? 'border-red-500' : 'border-slate-600'} rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                ></textarea>
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>
              
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Proposed Date *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <CalendarIcon className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      type="date"
                      name="proposed_date"
                      value={requestForm.proposed_date}
                      onChange={handleInputChange}
                      className={`w-full p-3 pl-10 bg-slate-700/50 border ${formErrors.proposed_date ? 'border-red-500' : 'border-slate-600'} rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {formErrors.proposed_date && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.proposed_date}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Proposed Time *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <ClockIcon className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      type="time"
                      name="proposed_time"
                      value={requestForm.proposed_time}
                      onChange={handleInputChange}
                      className={`w-full p-3 pl-10 bg-slate-700/50 border ${formErrors.proposed_time ? 'border-red-500' : 'border-slate-600'} rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {formErrors.proposed_time && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.proposed_time}</p>
                  )}
                </div>
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Duration (minutes)
                </label>
                <select
                  name="duration_minutes"
                  value={requestForm.duration_minutes}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={requestLoading}
                  className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {requestLoading ? (
                    <>
                      <Spinner size="small" text={null} />
                      <span className="ml-2">Sending Request...</span>
                    </>
                  ) : (
                    'Send Meeting Request'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MentorDetail; 