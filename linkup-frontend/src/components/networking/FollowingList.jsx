import { useState, useEffect } from 'react';
import { usersAPI } from '../../services/usersApi';
import UserCard from '../users/UserCard';
import { Spinner } from '../ui/spinner';
import toast from 'react-hot-toast';

const FollowingList = ({ userId }) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersAPI.getFollowing(userId, page);
      
      if (page === 1) {
        setFollowing(response.data.results);
      } else {
        setFollowing(prev => [...prev, ...response.data.results]);
      }
      
      setHasMore(response.data.next !== null);
    } catch (err) {
      console.error('Failed to fetch following:', err);
      setError('Failed to load following users. Please try again.');
      toast.error('Failed to load following users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFollowing();
    }
  }, [userId, page]);

  const handleUnfollow = async (unfollowedUserId) => {
    try {
      await usersAPI.unfollowUser(unfollowedUserId);
      setFollowing(prev => prev.filter(user => user.id !== unfollowedUserId));
      toast.success('User unfollowed successfully');
    } catch (err) {
      console.error('Failed to unfollow user:', err);
      toast.error('Failed to unfollow user. Please try again.');
    }
  };

  const retry = () => {
    setPage(1);
    fetchFollowing();
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        Not following anyone yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {following.map(user => (
        <UserCard
          key={user.id}
          user={user}
          showUnfollowButton={true}
          onUnfollow={() => handleUnfollow(user.id)}
        />
      ))}
      
      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FollowingList; 