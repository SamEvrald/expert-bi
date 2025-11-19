import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API Functions
const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const response = await axiosInstance.post('/api/auth/login', credentials);
    return response.data;
  },

  register: async (data: { email: string; password: string; name: string }) => {
    const response = await axiosInstance.post('/api/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post('/api/auth/logout');
    return response.data;
  },

  // Datasets
  getDatasets: async () => {
    const response = await axiosInstance.get('/api/datasets');
    return response.data;
  },

  getDataset: async (id: number | string) => {
    const response = await axiosInstance.get(`/api/datasets/${id}`);
    return response.data;
  },

  uploadDataset: async (formData: FormData) => {
    const response = await axiosInstance.post('/api/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteDataset: async (id: number) => {
    const response = await axiosInstance.delete(`/api/datasets/${id}`);
    return response.data;
  },

  exportDataset: async (id: number, format: string = 'csv') => {
    const response = await axiosInstance.get(`/api/datasets/${id}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getDatasetPreview: async (id: number, limit: number = 100) => {
    const response = await axiosInstance.get(`/api/datasets/${id}/preview?limit=${limit}`);
    return response.data;
  },

  // Analytics
  analyzeDataset: async (datasetId: number, analysisType: string) => {
    const response = await axiosInstance.post('/api/analytics/analyze', {
      dataset_id: datasetId,
      analysis_type: analysisType,
    });
    return response.data;
  },

  getAnalyses: async (datasetId: number) => {
    const response = await axiosInstance.get(`/api/analytics/${datasetId}`);
    return response.data;
  },

  getDatasetAnalysis: async (datasetId: number | string) => {
    const response = await axiosInstance.get(`/api/datasets/${datasetId}/analysis`);
    return response.data;
  },

  detectTypes: async (datasetId: number) => {
    const response = await axiosInstance.post(`/api/datasets/${datasetId}/detect-types`);
    return response.data;
  },

  // Insights
  getInsights: async (datasetId: number) => {
    const response = await axiosInstance.get(`/api/datasets/${datasetId}/insights`);
    return response.data;
  },

  deleteInsight: async (datasetId: number, insightId: number) => {
    const response = await axiosInstance.delete(`/api/datasets/${datasetId}/insights/${insightId}`);
    return response.data;
  },
};

export default api;