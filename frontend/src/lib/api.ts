import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Dataset,
  Insight,
  ColumnAnalysis,
  ApiResponse,
} from '../types/api.types';

// Additional type definitions for API responses
export interface DatasetAnalysis {
  id: number;
  dataset_id: number;
  total_rows: number;
  total_columns: number;
  memory_usage: number;
  column_types: Record<string, string>;
  missing_values: Record<string, number>;
  duplicate_rows: number;
  numeric_columns: string[];
  categorical_columns: string[];
  datetime_columns: string[];
  text_columns: string[];
  summary_statistics: Record<string, ColumnStatistics>;
  correlations?: Record<string, Record<string, number>>;
  quality_score?: number;
  columns: AnalysisColumn[];
  preview: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface AnalysisColumn {
  name: string;
  type: string;
  nullCount?: number;
  uniqueCount?: number;
  completeness?: number;
  sampleValues?: (string | number)[];
  mean?: number;
  median?: number;
  std?: number;
  min?: string | number;
  max?: string | number;
  mode?: string | number;
  [key: string]: unknown;
}

export interface ColumnStatistics {
  count: number;
  unique: number;
  top?: string | number;
  freq?: number;
  mean?: number;
  std?: number;
  min?: number | string;
  max?: number | string;
  '25%'?: number;
  '50%'?: number;
  '75%'?: number;
  null_count: number;
  null_percentage: number;
}

export interface ChartData {
  id: number;
  dataset_id: number;
  chart_type: string;
  title: string;
  description?: string;
  config: ChartConfig;
  data: ChartDataPoints;
  created_at: string;
  updated_at: string;
}

export interface ChartConfig {
  x_column: string;
  y_column?: string;
  group_by?: string;
  aggregation?: string;
  filters?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export interface ChartDataPoints {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface DataPreviewResponse {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DataQualityReport {
  quality_score: number;
  issues: Array<{
    type: string;
    column: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendations: string[];
}

export interface CleaningResult {
  cleaned_rows: number;
  removed_duplicates?: number;
  handled_missing?: number;
  removed_outliers?: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface ColumnOperation {
  column: string;
  operation: string;
  value?: string | number | boolean;
}

export interface DataCleaningOptions {
  remove_duplicates?: boolean;
  handle_missing?: 'drop' | 'fill_mean' | 'fill_median' | 'fill_mode';
  remove_outliers?: boolean;
  standardize_columns?: boolean;
  trim_whitespace?: boolean;
  column_operations?: ColumnOperation[];
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle response errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Dataset endpoints
  async getDatasets(): Promise<ApiResponse<Dataset[]>> {
    try {
      const response = await this.api.get<Dataset[]>('/datasets');
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getDataset(id: number): Promise<ApiResponse<Dataset>> {
    try {
      const response = await this.api.get<Dataset>(`/datasets/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async uploadDataset(file: File, description?: string): Promise<ApiResponse<Dataset>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }

      const response = await this.api.post<Dataset>('/datasets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteDataset(id: number): Promise<ApiResponse<void>> {
    try {
      await this.api.delete(`/datasets/${id}`);
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateDataset(
    id: number,
    updates: Partial<Dataset>
  ): Promise<ApiResponse<Dataset>> {
    try {
      const response = await this.api.patch<Dataset>(`/datasets/${id}`, updates);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Analysis endpoints
  async getDatasetAnalysis(datasetId: number): Promise<ApiResponse<DatasetAnalysis>> {
    try {
      const response = await this.api.get<DatasetAnalysis>(
        `/datasets/${datasetId}/analysis`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async analyzeDataset(datasetId: number): Promise<ApiResponse<DatasetAnalysis>> {
    try {
      const response = await this.api.post<DatasetAnalysis>(
        `/datasets/${datasetId}/analyze`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getColumnAnalysis(
    datasetId: number,
    columnName: string
  ): Promise<ApiResponse<ColumnAnalysis>> {
    try {
      const response = await this.api.get<ColumnAnalysis>(
        `/datasets/${datasetId}/columns/${columnName}/analysis`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Insights endpoints
  async getInsights(datasetId: number): Promise<ApiResponse<Insight[]>> {
    try {
      const response = await this.api.get<Insight[]>(`/datasets/${datasetId}/insights`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async generateInsights(datasetId: number): Promise<ApiResponse<Insight[]>> {
    try {
      const response = await this.api.post<Insight[]>(
        `/datasets/${datasetId}/insights/generate`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getInsight(datasetId: number, insightId: number): Promise<ApiResponse<Insight>> {
    try {
      const response = await this.api.get<Insight>(
        `/datasets/${datasetId}/insights/${insightId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Chart endpoints
  async generateChart(
    datasetId: number,
    config: {
      chart_type: string;
      x_column: string;
      y_column?: string;
      group_by?: string;
      aggregation?: string;
      filters?: Record<string, unknown>;
    }
  ): Promise<ApiResponse<ChartData>> {
    try {
      const response = await this.api.post<ChartData>(
        `/datasets/${datasetId}/charts`,
        config
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCharts(datasetId: number): Promise<ApiResponse<ChartData[]>> {
    try {
      const response = await this.api.get<ChartData[]>(
        `/datasets/${datasetId}/charts`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteChart(datasetId: number, chartId: number): Promise<ApiResponse<void>> {
    try {
      await this.api.delete(`/datasets/${datasetId}/charts/${chartId}`);
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Data preview
  async getDataPreview(
    datasetId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<ApiResponse<DataPreviewResponse>> {
    try {
      const response = await this.api.get<DataPreviewResponse>(
        `/datasets/${datasetId}/preview?limit=${limit}&offset=${offset}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Export endpoints
  async exportDataset(
    datasetId: number,
    format: 'csv' | 'json' | 'excel' = 'csv'
  ): Promise<Blob> {
    const response = await this.api.get(`/datasets/${datasetId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  async exportAnalysis(datasetId: number, format: 'pdf' | 'json' = 'pdf'): Promise<Blob> {
    const response = await this.api.get(`/datasets/${datasetId}/analysis/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  // Data cleaning endpoints
  async applyDataCleaning(
    datasetId: number,
    operations: DataCleaningOptions
  ): Promise<ApiResponse<CleaningResult>> {
    try {
      const response = await this.api.post<CleaningResult>(
        `/datasets/${datasetId}/clean`,
        operations
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getDataQualityReport(
    datasetId: number
  ): Promise<ApiResponse<DataQualityReport>> {
    try {
      const response = await this.api.get<DataQualityReport>(
        `/datasets/${datasetId}/quality`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Statistics endpoints
  async getDatasetStatistics(
    datasetId: number
  ): Promise<ApiResponse<Record<string, ColumnStatistics>>> {
    try {
      const response = await this.api.get<Record<string, ColumnStatistics>>(
        `/datasets/${datasetId}/statistics`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getColumnStatistics(
    datasetId: number,
    columnName: string
  ): Promise<ApiResponse<ColumnStatistics>> {
    try {
      const response = await this.api.get<ColumnStatistics>(
        `/datasets/${datasetId}/columns/${columnName}/statistics`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Search and filter
  async searchDatasets(query: string): Promise<ApiResponse<Dataset[]>> {
    try {
      const response = await this.api.get<Dataset[]>('/datasets/search', {
        params: { q: query },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Batch operations
  async batchDeleteDatasets(ids: number[]): Promise<ApiResponse<{ deleted: number }>> {
    try {
      const response = await this.api.post<{ deleted: number }>('/datasets/batch/delete', { ids });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async batchAnalyzeDatasets(
    ids: number[]
  ): Promise<ApiResponse<{ analyzed: number }>> {
    try {
      const response = await this.api.post<{ analyzed: number }>('/datasets/batch/analyze', { ids });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Error handler
  private handleError(error: unknown): ApiResponse<never> {
    console.error('API Error:', error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const message =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        'An error occurred';

      return {
        success: false,
        error: message,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
const api = new ApiService();
export default api;