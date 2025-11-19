/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '@/lib/auth';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  register: (credentials: { email: string; password: string; name: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const result = await apiLogin(credentials);
      
      if (result.success && result.data) {
        const userData = result.data.user;
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        return { success: true };
      }
      
      return { success: false, message: result.error || 'Login failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'An error occurred' };
    }
  };

  const register = async (credentials: { email: string; password: string; name: string }) => {
    try {
      const result = await apiRegister(credentials);
      
      if (result.success && result.data) {
        const userData = result.data.user;
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        return { success: true };
      }
      
      return { success: false, message: result.error || 'Registration failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'An error occurred' };
    }
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};