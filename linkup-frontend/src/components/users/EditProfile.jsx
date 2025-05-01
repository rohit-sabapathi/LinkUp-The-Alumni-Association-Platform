import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SkillsInput from '../common/SkillsInput';
import toast from 'react-hot-toast';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user: currentUser, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    department: '',
    graduation_year: '',
    profile_picture: null,
    current_position: '',
    company: '',
    location: '',
    linkedin_profile: '',
    github_profile: '',
    website: '',
    skills: []
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        bio: currentUser.bio || '',
        department: currentUser.department || '',
        graduation_year: currentUser.graduation_year || '',
        profile_picture: null,
        current_position: currentUser.current_position || '',
        company: currentUser.company || '',
        location: currentUser.location || '',
        linkedin_profile: currentUser.linkedin_profile || '',
        github_profile: currentUser.github_profile || '',
        website: currentUser.website || '',
        skills: currentUser.skills?.map(skill => skill.name) || []
      });
      setImagePreview(currentUser.profile_picture);
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (newSkills) => {
    setFormData(prev => ({
      ...prev,
      skills: newSkills
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profile_picture: file
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (key === 'profile_picture' || key === 'skills') return;
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append skills as JSON string
      formDataToSend.append('skills', JSON.stringify(formData.skills));
      
      // Append profile photo only if a new one is selected
      if (formData.profile_picture) {
        formDataToSend.append('profile_picture', formData.profile_picture);
      }

      await updateProfile(formDataToSend);
      navigate(`/profile/${currentUser.id}`);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-slate-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-slate-200 mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-600 flex items-center justify-center">
                  <span className="text-3xl text-slate-300">
                    {formData.first_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm text-slate-200
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700"
              />
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-300">Basic Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-slate-300">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-slate-300">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-slate-300">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Academic Info Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-300">Academic Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-slate-300">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Graduation Year */}
              <div>
                <label htmlFor="graduation_year" className="block text-sm font-medium text-slate-300">
                  Graduation Year
                </label>
                <input
                  type="number"
                  id="graduation_year"
                  name="graduation_year"
                  value={formData.graduation_year}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Professional Info Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-300">Professional Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Current Position */}
              <div>
                <label htmlFor="current_position" className="block text-sm font-medium text-slate-300">
                  Current Position
                </label>
                <input
                  type="text"
                  id="current_position"
                  name="current_position"
                  value={formData.current_position}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-300">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-300">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-300">Skills</h2>
            <SkillsInput
              selectedSkills={formData.skills}
              onSkillsChange={handleSkillsChange}
            />
          </div>

          {/* Social Links Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-300">Social Links</h2>
            
            <div className="space-y-4">
              {/* LinkedIn */}
              <div>
                <label htmlFor="linkedin_profile" className="block text-sm font-medium text-slate-300">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  id="linkedin_profile"
                  name="linkedin_profile"
                  value={formData.linkedin_profile}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* GitHub */}
              <div>
                <label htmlFor="github_profile" className="block text-sm font-medium text-slate-300">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  id="github_profile"
                  name="github_profile"
                  value={formData.github_profile}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Personal Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-300">
                  Personal Website URL
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                loading ? 'cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile; 