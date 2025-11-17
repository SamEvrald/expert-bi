import { Database } from '../config/database';
import { S3StorageService } from './S3StorageService';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import csvParser from 'csv-parser';

// Define the result type for INSERT queries
interface InsertResult {
  insertId: number;
  affectedRows: number;
}

export class DashboardGenerationService {
  /**
   * Create a new dashboard
   */
  static async createDashboard(
    datasetId: number,
    userId: number,
    dashboardData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      const query = `
        INSERT INTO dashboards (dataset_id, user_id, name, description, layout, global_filters, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await Database.query(query, [
        datasetId,
        userId,
        dashboardData.name || 'New Dashboard',
        dashboardData.description || '',
        JSON.stringify(dashboardData.layout || []),
        JSON.stringify(dashboardData.globalFilters || [])
      ]) as InsertResult;

      return {
        id: result.insertId,
        ...dashboardData,
        dataset_id: datasetId
      };
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw error;
    }
  }

  /**
   * Get all dashboards for dataset
   */
  static async getDashboards(datasetId: number, userId: number): Promise<unknown[]> {
    try {
      const query = `
        SELECT * FROM dashboards 
        WHERE dataset_id = ? AND user_id = ?
        ORDER BY created_at DESC
      `;

      const dashboards = await Database.query(query, [datasetId, userId]) as Record<string, unknown>[];

      return dashboards.map((d: Record<string, unknown>) => ({
        ...d,
        layout: typeof d.layout === 'string' ? JSON.parse(d.layout as string) : d.layout,
        global_filters: typeof d.global_filters === 'string' ? JSON.parse(d.global_filters as string) : d.global_filters
      }));
    } catch (error) {
      console.error('Error getting dashboards:', error);
      throw error;
    }
  }

  /**
   * Get dashboard by ID
   */
  static async getDashboardById(dashboardId: number, userId: number): Promise<Record<string, unknown> | null> {
    try {
      const query = 'SELECT * FROM dashboards WHERE id = ? AND user_id = ?';
      const result = await Database.query(query, [dashboardId, userId]) as Record<string, unknown>[];

      if (!result || result.length === 0) {
        return null;
      }

      const dashboard = result[0];
      return {
        ...dashboard,
        layout: typeof dashboard.layout === 'string' ? JSON.parse(dashboard.layout as string) : dashboard.layout,
        global_filters: typeof dashboard.global_filters === 'string' ? JSON.parse(dashboard.global_filters as string) : dashboard.global_filters
      };
    } catch (error) {
      console.error('Error getting dashboard by ID:', error);
      throw error;
    }
  }

  /**
   * Update dashboard
   */
  static async updateDashboard(
    dashboardId: number,
    userId: number,
    updates: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      const query = `
        UPDATE dashboards 
        SET name = ?, description = ?, layout = ?, global_filters = ?, updated_at = NOW()
        WHERE id = ? AND user_id = ?
      `;

      await Database.query(query, [
        updates.name || 'Updated Dashboard',
        updates.description || '',
        JSON.stringify(updates.layout || []),
        JSON.stringify(updates.globalFilters || []),
        dashboardId,
        userId
      ]);

      const updatedDashboard = await this.getDashboardById(dashboardId, userId);
      
      if (!updatedDashboard) {
        throw new Error('Dashboard not found after update');
      }

      return updatedDashboard;
    } catch (error) {
      console.error('Error updating dashboard:', error);
      throw error;
    }
  }

  /**
   * Delete dashboard
   */
  static async deleteDashboard(dashboardId: number, userId: number): Promise<void> {
    try {
      const query = 'DELETE FROM dashboards WHERE id = ? AND user_id = ?';
      await Database.query(query, [dashboardId, userId]);
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dataset columns for configuration
   */
  static async getDatasetColumns(datasetId: number, userId: number): Promise<string[]> {
    try {
      const query = 'SELECT file_path, s3_key FROM datasets WHERE id = ? AND user_id = ?';
      const dataset = await Database.query(query, [datasetId, userId]) as Record<string, unknown>[];

      if (!dataset || dataset.length === 0) {
        throw new Error('Dataset not found');
      }

      const { file_path, s3_key } = dataset[0];
      let filePath = file_path as string;

      if (s3_key) {
        const buffer = await S3StorageService.downloadFile(s3_key as string);
        const tempDir = path.join(__dirname, '../../temp');
        
        // Ensure temp directory exists
        await fs.mkdir(tempDir, { recursive: true });
        
        const tempFile = path.join(tempDir, `temp_${Date.now()}.csv`);
        await fs.writeFile(tempFile, buffer);
        filePath = tempFile;
      }

      return new Promise((resolve, reject) => {
        createReadStream(filePath)
          .pipe(csvParser())
          .on('headers', (headers: string[]) => {
            resolve(headers);
          })
          .on('error', reject);
      });
    } catch (error) {
      console.error('Error getting dataset columns:', error);
      throw error;
    }
  }

  /**
   * Get chart data with filters
   */
  static async getChartData(
    datasetId: number,
    userId: number,
    chartConfig: { chart_type: string; config: Record<string, unknown>; filters: Record<string, unknown>[] }
  ): Promise<Record<string, unknown>> {
    try {
      const query = 'SELECT file_path, s3_key FROM datasets WHERE id = ? AND user_id = ?';
      const dataset = await Database.query(query, [datasetId, userId]) as Record<string, unknown>[];

      if (!dataset || dataset.length === 0) {
        throw new Error('Dataset not found');
      }

      const { file_path, s3_key } = dataset[0];
      let filePath = file_path as string;

      if (s3_key) {
        const buffer = await S3StorageService.downloadFile(s3_key as string);
        const tempDir = path.join(__dirname, '../../temp');
        
        // Ensure temp directory exists
        await fs.mkdir(tempDir, { recursive: true });
        
        const tempFile = path.join(tempDir, `temp_${Date.now()}.csv`);
        await fs.writeFile(tempFile, buffer);
        filePath = tempFile;
      }

      const chartData = await this.processChartData(filePath, chartConfig);
      return chartData;
    } catch (error) {
      console.error('Error getting chart data:', error);
      throw error;
    }
  }

  /**
   * Process chart data based on configuration
   */
  private static async processChartData(
    filePath: string,
    chartConfig: { chart_type: string; config: Record<string, unknown>; filters: Record<string, unknown>[] }
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const data: Record<string, unknown>[] = [];

      createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row: Record<string, unknown>) => {
          let include = true;
          for (const filter of chartConfig.filters || []) {
            const value = row[filter.column as string];
            
            switch (filter.operator) {
              case 'equals':
                if (value !== filter.value) include = false;
                break;
              case 'not_equals':
                if (value === filter.value) include = false;
                break;
              case 'contains':
                if (typeof value === 'string' && typeof filter.value === 'string') {
                  if (!value.includes(filter.value)) include = false;
                }
                break;
              case 'greater_than':
                if (parseFloat(value as string) <= parseFloat(filter.value as string)) include = false;
                break;
              case 'less_than':
                if (parseFloat(value as string) >= parseFloat(filter.value as string)) include = false;
                break;
            }
          }

          if (include) {
            data.push(row);
          }
        })
        .on('end', () => {
          const processed = this.aggregateChartData(data, chartConfig.config);
          resolve({ chart_data: processed });
        })
        .on('error', reject);
    });
  }

  /**
   * Aggregate chart data
   */
  private static aggregateChartData(data: Record<string, unknown>[], config: Record<string, unknown>): Record<string, unknown>[] {
    const { x_axis, y_axis, aggregation, group_by, sort_order, limit } = config;

    if (!x_axis || !y_axis) {
      return [];
    }

    const grouped = new Map<string, number[]>();

    for (const row of data) {
      const key = group_by ? `${row[x_axis as string]}-${row[group_by as string]}` : row[x_axis as string] as string;
      const value = parseFloat(row[y_axis as string] as string) || 0;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(value);
    }

    const result: Record<string, unknown>[] = [];
    for (const [key, values] of grouped.entries()) {
      let aggValue: number;

      switch (aggregation) {
        case 'sum':
          aggValue = values.reduce((sum, v) => sum + v, 0);
          break;
        case 'avg':
          aggValue = values.reduce((sum, v) => sum + v, 0) / values.length;
          break;
        case 'count':
          aggValue = values.length;
          break;
        case 'min':
          aggValue = Math.min(...values);
          break;
        case 'max':
          aggValue = Math.max(...values);
          break;
        case 'median':
          const sorted = [...values].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          aggValue = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
          break;
        default:
          aggValue = values[0];
      }

      const [xValue, groupValue] = key.split('-');
      result.push({
        [x_axis as string]: xValue,
        [y_axis as string]: Math.round(aggValue * 100) / 100,
        ...(group_by && groupValue ? { [group_by as string]: groupValue } : {})
      });
    }

    if (sort_order === 'asc') {
      result.sort((a, b) => (a[y_axis as string] as number) - (b[y_axis as string] as number));
    } else if (sort_order === 'desc') {
      result.sort((a, b) => (b[y_axis as string] as number) - (a[y_axis as string] as number));
    }

    if (limit && (limit as number) > 0) {
      return result.slice(0, limit as number);
    }

    return result;
  }
}