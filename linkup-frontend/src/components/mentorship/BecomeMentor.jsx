import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { createMentorProfile } from '../../services/mentorshipService';
import { Spinner } from '../ui/Spinner';
import { toast } from 'react-hot-toast';

const BecomeMentor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    skills: '',
    bio: '',
    years_of_experience: 1,
    is_available: true
  });
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
    
    if (!formData.skills.trim()) {
      errors.skills = 'Skills are required';
    }
    
    if (!formData.bio.trim()) {
      errors.bio = 'Bio is required';
    } else if (formData.bio.length < 20) {
      errors.bio = 'Bio should be at least 20 characters';
    }
    
    if (formData.years_of_experience < 0) {
      errors.years_of_experience = 'Years of experience must be positive';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await createMentorProfile(formData);
      toast.success('You are now registered as a mentor!');
      navigate('/mentorship/my-profile');
    } catch (error) {
      console.error('Error creating mentor profile:', error);
      toast.error('Failed to create mentor profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Link 
          to="/smartnest/mentorship"
          className="mr-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-slate-400" />
        </Link>
        <h1 className="text-3xl font-bold text-purple-400">Become a Mentor</h1>
      </div>

      <div className="bg-slate-800/40 rounded-xl overflow-hidden mb-8">
        <div className="p-6 md:p-8 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-slate-200 mb-3">Share Your Knowledge</h2>
          <p className="text-slate-400 mb-4">
            Join our community of mentors and help others grow by sharing your expertise and experience.
            Fill out the form below to create your mentor profile.
          </p>
          
          <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4 text-sm">
            <h3 className="font-medium text-purple-300 mb-2">What does becoming a mentor involve?</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Your profile will be visible to other members looking for mentors</li>
              <li>You'll receive meeting requests from members seeking guidance</li>
              <li>You can accept or decline meeting requests based on your availability</li>
              <li>You can update your availability status or opt out at any time</li>
            </ul>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Skills *
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="e.g., JavaScript, React, Career Coaching (comma separated)"
                  className={`w-full p-3 bg-slate-700/50 border ${formErrors.skills ? 'border-red-500' : 'border-slate-600'} rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.skills ? (
                  <p className="mt-1 text-sm text-red-500">{formErrors.skills}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Separate skills with commas</p>
                )}
              </div>
              
              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Bio *
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Tell us about yourself, your expertise, and how you can help others"
                  className={`w-full p-3 bg-slate-700/50 border ${formErrors.bio ? 'border-red-500' : 'border-slate-600'} rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                ></textarea>
                {formErrors.bio ? (
                  <p className="mt-1 text-sm text-red-500">{formErrors.bio}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Minimum 20 characters</p>
                )}
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
                  className={`w-full p-3 bg-slate-700/50 border ${formErrors.years_of_experience ? 'border-red-500' : 'border-slate-600'} rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.years_of_experience && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.years_of_experience}</p>
                )}
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
                  Available for mentorship (you can change this anytime)
                </label>
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Spinner size="small" text={null} />
                      <span className="ml-2">Creating Profile...</span>
                    </>
                  ) : (
                    'Become a Mentor'
                  )}
                </button>
                <p className="mt-3 text-xs text-slate-400 text-center">
                  By becoming a mentor, you agree to share your expertise with the community.
                  You can update your profile or change your availability at any time.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeMentor; 