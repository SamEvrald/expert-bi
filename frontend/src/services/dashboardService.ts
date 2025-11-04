import { apiClient } from './apiClient';

export interface DashboardResponse {
  success: boolean;
  data: any;
  message?: string;
}

class DashboardService {
  async generateDashboard(datasetId: string, dashboardName?: string): Promise<DashboardResponse> {
    const response = await apiClient.post(`/dashboard/datasets/${datasetId}/dashboard`, {
      dashboard_name: dashboardName
    });
    return response.data;
  }

  async getDashboard(datasetId: string): Promise<DashboardResponse> {
    const response = await apiClient.get(`/dashboard/datasets/${datasetId}/dashboard`);
    return response.data;
  }

  async getDashboardStatus(datasetId: string): Promise<DashboardResponse> {
    const response = await apiClient.get(`/dashboard/datasets/${datasetId}/dashboard/status`);
    return response.data;
  }

  async getChartData(datasetId: string, chartId: string, filters?: any[]): Promise<DashboardResponse> {
    const response = await apiClient.post(`/dashboard/datasets/${datasetId}/dashboard/charts/${chartId}/data`, {
      filters: filters || []
    });
    return response.data;
  }

  async updateDashboard(datasetId: string, updates: any): Promise<DashboardResponse> {
    const response = await apiClient.put(`/dashboard/datasets/${datasetId}/dashboard`, updates);
    return response.data;
  }

  async regenerateDashboard(datasetId: string): Promise<DashboardResponse> {
    const response = await apiClient.post(`/dashboard/datasets/${datasetId}/dashboard/regenerate`);
    return response.data;
  }

  async exportDashboard(datasetId: string): Promise<Blob> {
    const response = await apiClient.get(`/dashboard/datasets/${datasetId}/dashboard/export`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const dashboardService = new DashboardService();