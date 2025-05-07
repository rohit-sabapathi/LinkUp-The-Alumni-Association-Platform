import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Add a request interceptor to add the auth token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Enhanced error logging
        console.error('API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: originalRequest?.url,
            method: originalRequest?.method,
            data: error.response?.data
        });
        
        // If error is 401 and we haven't tried to refresh token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    // Try to refresh the token
                    const response = await axios.post(`${instance.defaults.baseURL}/api/auth/refresh/`, {
                        refresh: refreshToken
                    });
                    
                    if (response.data.access) {
                        // Update token in localStorage
                        localStorage.setItem('token', response.data.access);
                        
                        // Update Authorization header and retry original request
                        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                        return instance(originalRequest);
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }
            
            // If refresh failed or no refresh token available, clear auth and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
        }
        
        return Promise.reject(error);
    }
);

export default instance; 