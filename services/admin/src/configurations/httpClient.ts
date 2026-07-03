import axios from "axios";
import { API, CONFIG } from "./configuration";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { ROUTES } from "@/routes/routes";

const httpClient = axios.create({
  baseURL: CONFIG.API,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
httpClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response, config } = error;
    
    // Handle 401 Unauthorized
    if (response?.status === 401) {
      // Check if this is a login request - if so, let the login component handle it
      const isLoginRequest = config?.url === API.LOGIN || config?.url?.endsWith(API.LOGIN);
      
      if (!isLoginRequest) {
        // This is an authenticated request that failed - session expired
        useAuthStore.getState().clearAuth();
        useNotificationStore.getState().addNotification({
          type: 'error',
          title: 'Authentication Error',
          message: 'Your session has expired. Please login again.',
          duration: 5000
        });
        
        // Redirect to login
        window.location.href = ROUTES.LOGIN;
      }
      // For login requests, just pass the error to the component
      return Promise.reject(error);
    }
    // Handle 403 Forbidden
    if (response?.status === 403) {
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.',
        duration: 5000
      });
    }
    
    // Handle 500 Internal Server Error
    if (response?.status === 500) {
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Server Error',
        message: 'An unexpected error occurred. Please try again later.',
        duration: 5000
      });
    }
    
    return Promise.reject(error);
  }
);

export default httpClient;