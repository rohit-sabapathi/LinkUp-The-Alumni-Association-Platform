import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI, handleApiError } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token) {
        console.log('No token found in localStorage');
        setLoading(false);
        return;
      }
      
      try {
        // Try to get current user with existing token
        const response = await userAPI.getCurrentUser();
        setUser(response.data);
        console.log('Authentication successful with existing token');
      } catch (error) {
        console.log('Token validation failed, attempting refresh:', error);
        
        // If the token is invalid and we have a refresh token, try to refresh
        if (refreshToken) {
          try {
            const refreshResponse = await authAPI.refreshToken(refreshToken);
            const { access } = refreshResponse.data;
            
            // Update the token
            localStorage.setItem('token', access);
            
            // Try again with the new token
            const userResponse = await userAPI.getCurrentUser();
            setUser(userResponse.data);
            console.log('Authentication successful after token refresh');
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
          }
        } else {
          // No refresh token available
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      setUser(userData);
      
      toast.success('Logged in successfully');
      return true;
    } catch (error) {
      handleApiError(error);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user: registeredUser, access, refresh } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      setUser(registeredUser);
      
      toast.success('Registration successful');
      return true;
    } catch (error) {
      handleApiError(error);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await userAPI.updateProfile(userData);
      setUser(response.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      handleApiError(error);
    }
  };

  const isAdmin = user?.user_type?.toLowerCase() === 'admin';  
  const isAlumni = user?.user_type?.toLowerCase() === 'alumni';  
  const isStudent = user?.user_type?.toLowerCase() === 'student';  

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAdmin,
    isAlumni,
    isStudent,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
