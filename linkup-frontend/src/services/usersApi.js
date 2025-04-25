import { api } from './api';

export const usersAPI = {
  // User profile
  getUserProfile: (userId) => 
    api.get(`/auth/profile/${userId}/`),
  
  // Update user profile
  updateProfile: (data) => 
    api.patch('/auth/me/', data, {
      headers: {
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    }),
  
  // Follow/unfollow
  followUser: (userId) => 
    api.post('/auth/follow/', { user_id: userId })
      .then(response => {
        if (response.data.status !== 'follow_request_sent') {
          throw new Error(response.data.error || 'Failed to follow user');
        }
        return response;
      }),
  
  unfollowUser: (userId) => 
    api.post('/auth/unfollow/', { user_id: userId })
      .then(response => {
        if (response.data.status !== 'unfollowed') {
          throw new Error(response.data.error || 'Failed to unfollow user');
        }
        return response;
      }),
  
  // Get followers/following with pagination support
  getFollowers: (userId, page = 1) => 
    api.get(`/auth/followers/${userId}/`, { params: { page } }),
  
  getFollowing: (userId, page = 1) => 
    api.get(`/auth/following/${userId}/`, { params: { page } }),
  
  // Search users
  searchUsers: async (query, filters = {}) => {
    const { department, graduationYear, userType } = filters;
    const params = new URLSearchParams({
      q: query,
      ...(department && { department }),
      ...(graduationYear && { graduationYear }),
      ...(userType && { userType })
    });
    return await api.get(`/auth/search/?${params.toString()}`);
  },
};
