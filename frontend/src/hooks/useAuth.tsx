/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '@/lib/auth';
import { ApiService, ApiResponse } from '@/lib/api';

type User = { id: number; email: string; name?: string; role?: string; [key: string]: unknown };
type Credentials = { email: string; password: string };
type RegisterPayload = { name: string; email: string; password: string };
type AuthResult = { success: boolean; user?: User; message?: string };

export type AuthContextType = {
  user: User | null;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  login: (creds: Credentials) => Promise<AuthResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// helper to extract error messages from unknown
function getErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    const maybe = err as { body?: { message?: string }; message?: string };
    return maybe?.body?.message || maybe?.message;
  } catch {
    return undefined;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (!token) return;
      try {
        const me = await ApiService.get<User>('/auth/me');
        if (me?.data) setUser(me.data);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        setUser(null);
      }
    };
    init();
  }, []);

  const register = async (payload: RegisterPayload): Promise<AuthResult> => {
    try {
      const resp = await authApi.register(payload) as ApiResponse<{ token?: string; access_token?: string; user?: User }>;
      if (!resp || !resp.success) return { success: false, message: resp?.message || 'Registration failed' };

      // auto-login after register
      const loginResp = await authApi.login({ email: payload.email, password: payload.password }) as ApiResponse<{ token?: string; access_token?: string; user?: User }>;
      const token = loginResp?.data?.token || loginResp?.data?.access_token || (loginResp as { token?: string })?.token;
      if (token) {
        ApiService.setAuthToken(token);
        try {
          const me = await ApiService.get<User>('/auth/me');
          if (me?.data) {
            setUser(me.data);
            return { success: true, user: me.data };
          }
          return { success: true };
        } catch (innerErr: unknown) {
          return { success: true, message: getErrorMessage(innerErr) || 'Registered but failed to fetch user' };
        }
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, message: getErrorMessage(err) || 'Registration failed' };
    }
  };

  const login = async (creds: Credentials): Promise<AuthResult> => {
    try {
      const resp = await authApi.login(creds) as ApiResponse<{ token?: string; access_token?: string; accessToken?: string; user?: User }>;
      const token = resp?.data?.token || (resp as { token?: string })?.token || resp?.data?.access_token || resp?.data?.accessToken;
      if (!token) return { success: false, message: resp?.message || 'Login failed' };

      ApiService.setAuthToken(token);

      const returnedUser = resp?.data?.user;
      if (returnedUser) {
        setUser(returnedUser);
        return { success: true, user: returnedUser };
      }

      try {
        const me = await ApiService.get<User>('/auth/me');
        if (me?.data) {
          setUser(me.data);
          return { success: true, user: me.data };
        }
        return { success: true };
      } catch (innerErr: unknown) {
        return { success: false, message: getErrorMessage(innerErr) || 'Failed to fetch user' };
      }
    } catch (err: unknown) {
      return { success: false, message: getErrorMessage(err) || 'Login failed' };
    }
  };

  const logout = () => {
    ApiService.setAuthToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, register, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};