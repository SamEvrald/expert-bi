import api from './api';

interface DashboardData {
  name: string;
  description: string;
  layout: unknown[];
  globalFilters: unknown[];
  dataset_id?: number;
}

interface ChartConfig {
  chart_type: string;
  config: Record<string, unknown>;
  filters: unknown[];
}

export const dashboardService = {
  async createDashboard(dashboardData: DashboardData) {
    const response = await api.post(
      `/datasets/${dashboardData.dataset_id}/dashboards`,
      dashboardData
    );
    return response.data;
  },

  async getDashboards(datasetId: string) {
    const response = await api.get(`/datasets/${datasetId}/dashboards`);
    return response.data;
  },

  async getDashboard(dashboardId: string) {
    const response = await api.get(`/dashboards/${dashboardId}`);
    return response.data;
  },

  async updateDashboard(dashboardId: string, updates: DashboardData) {
    const response = await api.put(`/dashboards/${dashboardId}`, updates);
    return response.data;
  },

  async deleteDashboard(dashboardId: string) {
    const response = await api.delete(`/dashboards/${dashboardId}`);
    return response.data;
  },

  async getDatasetColumns(datasetId: string) {
    const response = await api.get(`/datasets/${datasetId}/columns`);
    return response.data;
  },

  async getChartData(datasetId: string, chartConfig: ChartConfig) {
    const response = await api.post(`/datasets/${datasetId}/chart-data`, chartConfig);
    return response.data;
  }
};