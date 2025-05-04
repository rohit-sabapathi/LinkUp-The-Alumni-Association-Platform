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
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        return response;
      })
      .catch(error => {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        throw error;
      }),
  
  unfollowUser: (userId) => 
    api.post('/auth/unfollow/', { user_id: userId })
      .then(response => {
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        return response;
      })
      .catch(error => {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        throw error;
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
