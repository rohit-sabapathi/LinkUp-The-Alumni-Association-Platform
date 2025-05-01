import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI } from '../../services/usersApi';
import { postsAPI } from '../../services/postsApi';
import { useAuth } from '../../contexts/AuthContext';
import UserList from './UserList';
import FollowButton from './FollowButton';
import PostCard from '../posts/PostCard';

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const isOwnProfile = Number(currentUser?.id) === Number(userId);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.getUserProfile(userId);
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPosts = async () => {
      try {
        setLoadingPosts(true);
        const response = await postsAPI.getUserPosts(userId);
        setUserPosts(response.data);
      } catch (err) {
        console.error('Failed to fetch user posts:', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    if (userId) {
      fetchUserData();
      fetchUserPosts();
    }
  }, [userId]);

  const handleFollowChange = (isFollowing) => {
    setUser(prev => ({ ...prev, is_following: isFollowing }));
  };

  const handlePostUpdate = (updatedPost) => {
    setUserPosts(posts =>
      posts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center text-red-500 py-8">
        {error || 'User not found'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={`${user.first_name} ${user.last_name}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-600 flex items-center justify-center">
                <span className="text-3xl text-slate-300">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-200">{user.full_name}</h1>
              <p className="text-slate-400">{user.email}</p>
              {user.bio && (
                <p className="text-slate-300 mt-2">{user.bio}</p>
              )}
              <div className="flex items-center space-x-4 mt-4">
                <div>
                  <div className="text-lg font-semibold text-slate-200">
                    {user.followers_count || 0}
                  </div>
                  <div className="text-sm text-slate-400">Followers</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-200">
                    {user.following_count || 0}
                  </div>
                  <div className="text-sm text-slate-400">Following</div>
                </div>
              </div>
            </div>
          </div>
          {isOwnProfile ? (
            <Link
              to="/profile/edit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Edit Profile
            </Link>
          ) : (
            <FollowButton
              userId={user.id}
              initialIsFollowing={user.is_following}
              onFollowChange={handleFollowChange}
            />
          )}
        </div>
        
        {/* Additional Info */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {user.department && (
              <div className="text-slate-400">
                <span className="block text-slate-500">Department</span>
                {user.department}
              </div>
            )}
            {user.graduation_year && (
              <div className="text-slate-400">
                <span className="block text-slate-500">Graduation Year</span>
                {user.graduation_year}
              </div>
            )}
          </div>

          {/* Skills Section */}
          {user.skills && user.skills.length > 0 && (
            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Professional Info */}
          {(user.current_position || user.company || user.location) && (
            <div className="pt-4 border-t border-slate-700 grid grid-cols-2 gap-4 text-sm">
              {user.current_position && (
                <div className="text-slate-400">
                  <span className="block text-slate-500">Current Position</span>
                  {user.current_position}
                </div>
              )}
              {user.company && (
                <div className="text-slate-400">
                  <span className="block text-slate-500">Company</span>
                  {user.company}
                </div>
              )}
              {user.location && (
                <div className="text-slate-400">
                  <span className="block text-slate-500">Location</span>
                  {user.location}
                </div>
              )}
            </div>
          )}

          {/* Social Links */}
          {(user.linkedin_profile || user.github_profile || user.website) && (
            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Social Links</h3>
              <div className="flex space-x-4">
                {user.linkedin_profile && (
                  <a
                    href={user.linkedin_profile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    LinkedIn
                  </a>
                )}
                {user.github_profile && (
                  <a
                    href={user.github_profile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    GitHub
                  </a>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-4 px-1 relative ${
              activeTab === 'posts'
                ? 'text-blue-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Posts
            {activeTab === 'posts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`py-4 px-1 relative ${
              activeTab === 'followers'
                ? 'text-blue-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Followers
            {activeTab === 'followers' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`py-4 px-1 relative ${
              activeTab === 'following'
                ? 'text-blue-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Following
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : userPosts.length > 0 ? (
              userPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  onPostUpdate={handlePostUpdate}
                />
              ))
            ) : (
              <div className="text-center text-slate-400 py-8">
                No posts yet
              </div>
            )}
          </div>
        )}
        {activeTab === 'followers' && <UserList type="followers" userId={user.id} />}
        {activeTab === 'following' && <UserList type="following" userId={user.id} />}
      </div>
    </div>
  );
};

export default UserProfile;
