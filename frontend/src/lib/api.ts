const API_BASE_URL = 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

export class ApiService {
  private static getAuthHeader(): { Authorization?: string } {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  }

  private static async requestFormData<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader(),
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  static async login(email: string, password: string) {
    const response = await this.request<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.data.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
    }
    
    return response;
  }

  static async register(name: string, email: string, password: string) {
    const response = await this.request<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    
    if (response.data.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
    }
    
    return response;
  }

  static async getCurrentUser() {
    return this.request('/auth/me', {
      method: 'GET',
    });
  }

  static logout() {
    localStorage.removeItem('auth_token');
  }

  // Projects endpoints
  static async getProjects() {
    return this.request('/projects', {
      method: 'GET',
    });
  }

  static async createProject(name: string, description?: string) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  // Dataset endpoints
  static async uploadDataset(file: File, projectId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    return this.requestFormData('/datasets/upload', formData);
  }

  static async getDatasets() {
    return this.request('/datasets', {
      method: 'GET',
    });
  }

  static async getDatasetAnalysis(datasetId: string) {
    return this.request(`/datasets/${datasetId}/analysis`, {
      method: 'GET',
    });
  }

  static async getDataset(datasetId: string) {
    return this.request(`/datasets/${datasetId}`, {
      method: 'GET',
    });
  }
}