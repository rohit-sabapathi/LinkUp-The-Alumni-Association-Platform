import { useState, useRef, useEffect } from 'react';
import { ChartBarSquareIcon, PaperClipIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import { postsAPI } from '../../services/postsApi';
import { useAuth } from '../../contexts/AuthContext';
import CreatePoll from './CreatePoll';

const CreatePost = ({ onPostCreated = () => {} }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState('none');
  const [mediaPreview, setMediaPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef(null);
  const attachButtonRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showAttachMenu &&
        attachMenuRef.current && 
        !attachMenuRef.current.contains(event.target) &&
        attachButtonRef.current &&
        !attachButtonRef.current.contains(event.target)
      ) {
        setShowAttachMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachMenu]);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setMedia(file);
    const fileType = file.type.split('/')[0];
    setMediaType(fileType === 'video' ? 'video' : 'image');

    if (fileType === 'video') {
      const videoURL = URL.createObjectURL(file);
      setMediaPreview(videoURL);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentClick = () => {
    setShowAttachMenu(!showAttachMenu);
  };

  const handleImageClick = () => {
    fileInputRef.current.accept = "image/*";
    fileInputRef.current.click();
    setShowAttachMenu(false);
  };

  const handleVideoClick = () => {
    fileInputRef.current.accept = "video/*";
    fileInputRef.current.click();
    setShowAttachMenu(false);
  };

  const handlePollClick = () => {
    setShowPollCreator(true);
    setShowAttachMenu(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !media) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (media) {
        formData.append('media', media);
        formData.append('media_type', mediaType);
      }

      const response = await postsAPI.createPost(formData);
      setContent('');
      setMedia(null);
      setMediaPreview('');
      setMediaType('none');
      onPostCreated(response.data);
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePollCreated = (pollPost) => {
    onPostCreated(pollPost);
    setShowPollCreator(false);
  };

  if (showPollCreator) {
    return (
      <CreatePoll 
        onPollCreated={handlePollCreated}
        onCancel={() => setShowPollCreator(false)}
      />
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center space-x-3 mb-4">
        {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={`${user.first_name} ${user.last_name}`}
                className="w-10 h-10 rounded-full object-cover border-4 border-blue-600"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                <span className="text-l text-slate-300">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
        <div className="text-slate-200 font-medium">{user?.full_name}</div>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {mediaPreview && (
          <div className="mt-3 relative">
            {mediaType === 'video' ? (
              <video
                src={mediaPreview}
                controls
                className="rounded-lg max-h-60 w-full"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={mediaPreview}
                alt="Preview"
                className="rounded-lg max-h-60 w-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => {
                setMedia(null);
                setMediaPreview('');
                setMediaType('none');
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 text-red-500 text-sm">{error}</div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="relative">
            <button
              type="button"
              ref={attachButtonRef}
              onClick={handleAttachmentClick}
              className="text-slate-300 hover:text-blue-500 transition-colors"
            >
              <PaperClipIcon className="h-6 w-6" />
            </button>
            
            {showAttachMenu && (
              <div 
                ref={attachMenuRef}
                className="absolute left-0 bottom-10 bg-slate-700 rounded-md shadow-lg p-2 z-10"
              >
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="flex items-center space-x-2 text-slate-300 hover:text-blue-500 p-2 transition-colors w-full text-left"
                >
                  <PhotoIcon className="h-5 w-5" />
                  <span>Image</span>
                </button>
                <button
                  type="button"
                  onClick={handleVideoClick}
                  className="flex items-center space-x-2 text-slate-300 hover:text-blue-500 p-2 transition-colors w-full text-left"
                >
                  <VideoCameraIcon className="h-5 w-5" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={handlePollClick}
                  className="flex items-center space-x-2 text-slate-300 hover:text-blue-500 p-2 transition-colors w-full text-left"
                >
                  <ChartBarSquareIcon className="h-5 w-5" />
                  <span>Poll</span>
                </button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleMediaChange}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!content.trim() && !media)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
