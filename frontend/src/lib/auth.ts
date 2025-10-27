import { ApiService } from './api';

export async function register(payload: { name: string; email: string; password: string }) {
  return ApiService.post('/auth/register', payload);
}

export async function login(payload: { email: string; password: string }) {
  const resp = await ApiService.post('/auth/login', payload);
  // backend returns token in resp.data.token or resp.token
  const token = resp?.data?.token || resp?.token || resp?.data?.accessToken || resp?.access_token;
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('access_token', token);
  }
  return resp; // return full resp so callers can inspect success/data
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export class AuthService {
  private static readonly CURRENT_USER_KEY = 'expert-bi-current-user';
  private static readonly REFRESH_TOKEN_KEY = 'expert-bi-refresh-token';
  
  static async login(email: string, password: string): Promise<User> {
    try {
      const response = await login({ email, password });
      const user = response.data.user;
      
      // Store user data
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      
      // Store refresh token if provided
      if (response.data.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.data.refreshToken);
      }
      
      return user;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }
  
  static async register(email: string, password: string, name: string): Promise<User> {
    try {
      const response = await register({ name, email, password });
      const user = response.data.user;
      
      // Store user data
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      
      // Store refresh token if provided
      if (response.data.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.data.refreshToken);
      }
      
      return user;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }
  
  static logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    logout();
  }
  
  static getCurrentUser(): User | null {
    const stored = localStorage.getItem(this.CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
  
  static async refreshCurrentUser(): Promise<User | null> {
    try {
      const response = await ApiService.get('/auth/me');
      const user = response.data as User;
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      // Token might be invalid, clear stored user
      this.logout();
      return null;
    }
  }
  
  static isAuthenticated(): boolean {
    const hasUser = this.getCurrentUser() !== null;
    const hasToken = localStorage.getItem('auth_token') !== null;
    return hasUser && hasToken;
  }
}

export default { register, login, logout };