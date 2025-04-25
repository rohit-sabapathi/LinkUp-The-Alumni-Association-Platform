import { useState, useEffect } from 'react';
import { usersAPI } from '../../services/usersApi';
import UserCard from '../users/UserCard';
import { Spinner } from '../ui/spinner';
import toast from 'react-hot-toast';

const FollowersList = ({ userId }) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersAPI.getFollowers(userId, page);
      
      if (page === 1) {
        setFollowers(response.data.results);
      } else {
        setFollowers(prev => [...prev, ...response.data.results]);
      }
      
      setHasMore(response.data.next !== null);
    } catch (err) {
      console.error('Failed to fetch followers:', err);
      setError('Failed to load followers. Please try again.');
      toast.error('Failed to load followers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFollowers();
    }
  }, [userId, page]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const retry = () => {
    setPage(1);
    fetchFollowers();
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

  if (followers.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        No followers yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {followers.map(user => (
        <UserCard
          key={user.id}
          user={user}
          showFollowButton={false}
        />
      ))}
      
      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
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

export default FollowersList; 