import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Sync localStorage fallback token if cookie blocked
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for handling 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      // If unauthorized on protected route, clean token
      localStorage.removeItem('taskflow_token');
    }
    return Promise.reject(error);
  }
);
