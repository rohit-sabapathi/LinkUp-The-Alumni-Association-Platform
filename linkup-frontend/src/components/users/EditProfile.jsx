import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
    profile_photo: null
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        bio: currentUser.bio || '',
        department: currentUser.department || '',
        graduation_year: currentUser.graduation_year || '',
        profile_photo: null
      });
      setImagePreview(currentUser.profile_photo);
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profile_photo: file
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
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('department', formData.department || '');
      formDataToSend.append('graduation_year', formData.graduation_year || '');
      
      // Append profile photo only if a new one is selected
      if (formData.profile_photo) {
        formDataToSend.append('profile_photo', formData.profile_photo);
      }

      await updateProfile(formDataToSend);
      navigate(`/profile/${currentUser.id}`);
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

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
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