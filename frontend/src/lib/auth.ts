import axios from 'axios';
import { ApiResponse } from '../types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

interface AuthResponse {
  token?: string;
  access_token?: string;
  accessToken?: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

// Create a separate axios instance for auth (since we might not have a token yet)
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await authApi.post<AuthResponse>('/auth/login', credentials);
    
    // Store token if present
    const token = response.data.token || response.data.access_token || response.data.accessToken;
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('access_token', token);
    }
    
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Login failed',
    };
  }
};

export const register = async (credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await authApi.post<AuthResponse>('/auth/register', credentials);
    
    // Store token if present
    const token = response.data.token || response.data.access_token || response.data.accessToken;
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('access_token', token);
    }
    
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Registration failed',
    };
  }
};

export const logout = async (): Promise<ApiResponse<void>> => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    
    if (token) {
      await authApi.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    return { success: true };
  } catch (error: any) {
    // Clear local storage even if API call fails
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Logout failed',
    };
  }
};

export const getCurrentUser = async (): Promise<ApiResponse<any>> => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }
    
    const response = await authApi.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get current user',
    };
  }
};