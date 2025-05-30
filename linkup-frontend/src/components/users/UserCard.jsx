import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FollowButton from './FollowButton';

const UserCard = ({ user: userProfile, onFollowChange }) => {
  const { user } = useAuth();
  const isOwnProfile = user?.id === userProfile.id;

  return (
    <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
      <Link to={`/profile/${userProfile.id}`} className="flex items-center space-x-3 flex-1">
        {userProfile.profile_picture ? (
          <img
            src={userProfile.profile_picture}
            alt={userProfile.full_name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
            <span className="text-xl text-slate-300">
              {userProfile.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h3 className="text-slate-200 font-medium">{userProfile.full_name}</h3>
          <p className="text-slate-400 text-sm">{userProfile.email}</p>
        </div>
      </Link>
      
      {!isOwnProfile && (
        <FollowButton
          userId={userProfile.id}
          initialIsFollowing={userProfile.is_following}
          onFollowChange={onFollowChange}
        />
      )}
    </div>
  );
};

export default UserCard;
