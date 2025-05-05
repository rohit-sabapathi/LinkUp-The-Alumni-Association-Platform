import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon,
  XMarkIcon,
  UserCircleIcon, 
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { getMyMentorProfile, updateMentorProfile, getMeetingRequestsAsMentor } from '../../services/mentorshipService';
import { Spinner } from '../ui/Spinner';
import { toast } from 'react-hot-toast';

const MentorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    skills: '',
    bio: '',
    years_of_experience: 0,
    is_available: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get mentor profile
        const profileData = await getMyMentorProfile();
        setProfile(profileData);
        setFormData({
          skills: profileData.skills,
          bio: profileData.bio,
          years_of_experience: profileData.years_of_experience,
          is_available: profileData.is_available
        });
        
        // Get pending requests
        const requestsData = await getMeetingRequestsAsMentor();
        setRequests(requestsData.filter(req => req.status === 'pending'));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching mentor data:', error);
        toast.error('Failed to load mentor profile');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const updatedProfile = await updateMentorProfile(formData);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-12 flex justify-center">
        <Spinner size="large" text="Loading mentor profile..." />
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
        <h1 className="text-3xl font-bold text-purple-400">My Mentor Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-800/40 rounded-xl overflow-hidden mb-8">
        <div className="flex justify-between items-center p-6 md:p-8 pb-4 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-slate-200">Profile Information</h2>
          
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 text-slate-400 hover:text-slate-300 rounded-full hover:bg-slate-700/50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center text-sm text-slate-400 hover:text-slate-300 space-x-1 px-3 py-1 rounded hover:bg-slate-700/50"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
        </div>
        
        <div className="p-6 md:p-8">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Skills
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="e.g., JavaScript, React, Career Coaching (comma separated)"
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">Separate skills with commas</p>
              </div>
              
              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Tell us about yourself, your expertise, and how you can help others"
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              
              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="years_of_experience"
                  value={formData.years_of_experience}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Availability */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_available"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_available" className="ml-2 text-sm font-medium text-slate-300">
                  Available for mentorship
                </label>
              </div>
              
              {/* Submit Button */}
              <div className="flex space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {profile.user?.profile_image ? (
                    <img 
                      src={profile.user.profile_image} 
                      alt={`${profile.user.first_name} ${profile.user.last_name}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                      <UserCircleIcon className="w-12 h-12 text-slate-500" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-slate-200">
                    {profile.user?.first_name} {profile.user?.last_name}
                  </h3>
                  
                  <div className="flex items-center mt-1">
                    <AcademicCapIcon className="h-4 w-4 text-purple-400 mr-1" />
                    <span className="text-sm text-slate-400">
                      {profile.years_of_experience} years of experience
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center">
                    <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${profile.is_available ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                      {profile.is_available ? (
                        <>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Available for mentorship
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="h-3 w-3 mr-1" />
                          Not available
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Bio</h3>
                <p className="text-slate-400 whitespace-pre-line">{profile.bio}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills_list?.map((skill, index) => (
                    <span 
                      key={index} 
                      className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300 border border-purple-800/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Pending Requests Section */}
      <div className="bg-slate-800/40 rounded-xl overflow-hidden mb-8">
        <div className="p-6 md:p-8 pb-4 border-b border-slate-700/50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-200">Pending Requests</h2>
            <Link 
              to="/mentorship/requests"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all
            </Link>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <Link 
                  key={request.id} 
                  to={`/mentorship/requests/${request.id}`}
                  className="block p-4 bg-slate-800/80 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center mb-1">
                        <h3 className="font-medium text-slate-200 mr-2">
                          {request.topic}
                        </h3>
                        <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-1">
                        From: {request.mentee.first_name} {request.mentee.last_name}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-slate-500">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(request.proposed_date + 'T' + request.proposed_time).toLocaleString()} 
                          ({request.duration_minutes} min)
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <ClockIcon className="h-10 w-10 mx-auto text-slate-600 mb-2" />
              <p>No pending requests</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link 
          to="/mentorship/requests"
          className="p-4 bg-slate-800/40 rounded-lg hover:bg-slate-800 text-center transition-colors"
        >
          <span className="block text-slate-300 font-medium">View Requests</span>
          <span className="text-sm text-slate-500">Manage incoming meeting requests</span>
        </Link>
        
        <Link 
          to="/mentorship/meetings"
          className="p-4 bg-slate-800/40 rounded-lg hover:bg-slate-800 text-center transition-colors"
        >
          <span className="block text-slate-300 font-medium">My Meetings</span>
          <span className="text-sm text-slate-500">View upcoming and past meetings</span>
        </Link>
      </div>
    </div>
  );
};

export default MentorProfile; 