import Database from '../config/database';
import { InsightGenerationService, InsightAnalysisResult } from './InsightGenerationService';
import { SemanticAnalysisService } from './SemanticAnalysisService';

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'histogram' | 'box' | 'area' | 'treemap' | 'gauge';
  title: string;
  description?: string;
  x_axis: string;
  y_axis?: string;
  color_by?: string;
  filters?: ChartFilter[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  chart_options?: Record<string, any>;
}

export interface ChartFilter {
  column: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
}

export interface DashboardLayout {
  grid_size: { cols: number; rows: number };
  charts: {
    chart_id: string;
    position: { x: number; y: number; w: number; h: number };
  }[];
}

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  charts: ChartConfig[];
  layout: DashboardLayout;
  key_insights: string[];
  filters: {
    global_filters: ChartFilter[];
    filter_groups: string[][];
  };
  refresh_interval?: number;
  created_at: string;
}

export class DashboardGenerationService {
  /**
   * Generate dashboard configuration from dataset analysis
   */
  static async generateDashboard(
    datasetId: number,
    userId: number,
    dashboardName?: string
  ): Promise<DashboardConfig> {
    try {
      // Get dataset metadata
      const datasetInfo = await this.getDatasetInfo(datasetId, userId);
      
      // Get insights
      const insights = await InsightGenerationService.getStoredInsights(datasetId, userId);
      if (!insights) {
        throw new Error('No insights found. Generate insights first.');
      }

      // Get semantic analysis
      const semanticResults = await SemanticAnalysisService.getSemanticResults(datasetId, userId);
      
      // Get column metadata
      const columnMetadata = await this.getColumnMetadata(datasetId, userId);

      // Generate charts based on insights and semantic types
      const charts = await this.generateCharts(insights, semanticResults, columnMetadata);
      
      // Create dashboard layout
      const layout = this.generateLayout(charts);
      
      // Extract key insights
      const keyInsights = this.extractKeyInsights(insights);
      
      // Create dashboard config
      const dashboardConfig: DashboardConfig = {
        id: `dashboard_${datasetId}_${Date.now()}`,
        name: dashboardName || `${datasetInfo.name} Dashboard`,
        description: `Auto-generated dashboard for ${datasetInfo.name}`,
        charts,
        layout,
        key_insights: keyInsights,
        filters: this.generateGlobalFilters(semanticResults, columnMetadata),
        refresh_interval: 300000, // 5 minutes
        created_at: new Date().toISOString()
      };

      // Store dashboard configuration
      await this.storeDashboardConfig(datasetId, userId, dashboardConfig);

      return dashboardConfig;

    } catch (error) {
      console.error('Dashboard generation error:', error);
      throw new Error(`Failed to generate dashboard: ${error}`);
    }
  }

  /**
   * Generate charts based on insights and semantic analysis
   */
  private static async generateCharts(
    insights: InsightAnalysisResult,
    semanticResults: any[],
    columnMetadata: any[]
  ): Promise<ChartConfig[]> {
    const charts: ChartConfig[] = [];

    // 1. Generate correlation charts
    if (insights.correlations && insights.correlations.length > 0) {
      for (const correlation of insights.correlations.slice(0, 3)) { // Top 3 correlations
        charts.push({
          id: `correlation_${correlation.x}_${correlation.y}`,
          type: 'scatter',
          title: `${correlation.x} vs ${correlation.y}`,
          description: `${correlation.strength} ${correlation.direction} correlation (${correlation.correlation})`,
          x_axis: correlation.x,
          y_axis: correlation.y,
          chart_options: {
            showTrendLine: true,
            correlationValue: correlation.correlation
          }
        });
      }
    }

    // 2. Generate trend charts
    if (insights.trends && insights.trends.length > 0) {
      for (const trend of insights.trends.slice(0, 3)) { // Top 3 trends
        charts.push({
          id: `trend_${trend.date_column}_${trend.value_column}`,
          type: 'line',
          title: `${trend.value_column} Over Time`,
          description: `${trend.direction} trend detected`,
          x_axis: trend.date_column,
          y_axis: trend.value_column,
          chart_options: {
            showTrend: true,
            trendDirection: trend.direction
          }
        });
      }
    }

    // 3. Generate semantic-based charts
    const categoricalColumns = semanticResults.filter(col => 
      ['category', 'personal_name', 'address'].includes(col.semantic_type)
    );
    
    const numericalColumns = columnMetadata.filter(col => 
      ['integer', 'float'].includes(col.data_type)
    );

    // Category distribution charts
    for (const catCol of categoricalColumns.slice(0, 2)) {
      charts.push({
        id: `category_dist_${catCol.name}`,
        type: 'pie',
        title: `Distribution by ${catCol.name}`,
        description: `Breakdown of records by ${catCol.name}`,
        x_axis: catCol.name,
        aggregation: 'count',
        limit: 10
      });
    }

    // Numerical distribution charts
    for (const numCol of numericalColumns.slice(0, 2)) {
      charts.push({
        id: `numerical_dist_${numCol.column_name}`,
        type: 'histogram',
        title: `${numCol.column_name} Distribution`,
        description: `Statistical distribution of ${numCol.column_name}`,
        x_axis: numCol.column_name,
        chart_options: {
          bins: 20,
          showStats: true
        }
      });
    }

    // 4. Generate currency/financial charts
    const currencyColumns = semanticResults.filter(col => col.semantic_type === 'currency');
    for (const currCol of currencyColumns.slice(0, 2)) {
      if (categoricalColumns.length > 0) {
        charts.push({
          id: `currency_by_category_${currCol.name}`,
          type: 'bar',
          title: `${currCol.name} by ${categoricalColumns[0].name}`,
          description: `${currCol.name} breakdown by category`,
          x_axis: categoricalColumns[0].name,
          y_axis: currCol.name,
          aggregation: 'sum',
          limit: 10,
          sort_order: 'desc'
        });
      }
    }

    // 5. Generate geographic charts if coordinates exist
    const coordinateColumns = semanticResults.filter(col => col.semantic_type === 'coordinates');
    if (coordinateColumns.length >= 2) {
      charts.push({
        id: `geographic_scatter`,
        type: 'scatter',
        title: 'Geographic Distribution',
        description: 'Location-based data visualization',
        x_axis: coordinateColumns.find(col => col.name.toLowerCase().includes('lon'))?.name || coordinateColumns[0].name,
        y_axis: coordinateColumns.find(col => col.name.toLowerCase().includes('lat'))?.name || coordinateColumns[1].name,
        chart_options: {
          isGeographic: true
        }
      });
    }

    // 6. Generate outlier analysis charts
    if (insights.outliers && insights.outliers.length > 0) {
      for (const outlier of insights.outliers.slice(0, 2)) {
        charts.push({
          id: `outlier_${outlier.column}`,
          type: 'box',
          title: `${outlier.column} Outlier Analysis`,
          description: `Box plot showing outliers in ${outlier.column}`,
          x_axis: outlier.column,
          chart_options: {
            showOutliers: true,
            outlierCount: outlier.count
          }
        });
      }
    }

    // 7. Generate feature importance charts
    if (insights.feature_importance && insights.feature_importance.length > 0) {
      const topFeatures = insights.feature_importance.slice(0, 5);
      charts.push({
        id: `feature_importance`,
        type: 'bar',
        title: 'Key Drivers Analysis',
        description: 'Most important factors affecting outcomes',
        x_axis: 'feature',
        y_axis: 'importance',
        chart_options: {
          horizontal: true,
          data: topFeatures
        }
      });
    }

    return charts;
  }

  /**
   * Generate dashboard layout
   */
  private static generateLayout(charts: ChartConfig[]): DashboardLayout {
    const layout: DashboardLayout = {
      grid_size: { cols: 12, rows: Math.ceil(charts.length / 2) * 6 },
      charts: []
    };

    let currentRow = 0;
    let currentCol = 0;

    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      
      // Determine chart size based on type
      let width = 6; // Default half width
      let height = 6; // Default height
      
      switch (chart.type) {
        case 'line':
        case 'area':
          width = 12; // Full width for time series
          height = 6;
          break;
        case 'scatter':
          width = 8;
          height = 6;
          break;
        case 'pie':
          width = 4;
          height = 4;
          break;
        case 'histogram':
        case 'box':
          width = 6;
          height = 5;
          break;
        case 'heatmap':
          width = 8;
          height = 6;
          break;
      }

      // Adjust position if chart doesn't fit in current row
      if (currentCol + width > 12) {
        currentRow += 6;
        currentCol = 0;
      }

      layout.charts.push({
        chart_id: chart.id,
        position: {
          x: currentCol,
          y: currentRow,
          w: width,
          h: height
        }
      });

      currentCol += width;
    }

    return layout;
  }

  /**
   * Extract key insights for dashboard summary
   */
  private static extractKeyInsights(insights: InsightAnalysisResult): string[] {
    const keyInsights: string[] = [];

    // Add summary
    if (insights.summary) {
      keyInsights.push(insights.summary);
    }

    // Add top 3 high-priority insights
    const highPriorityInsights = insights.insights
      .filter(insight => insight.priority === 'high')
      .slice(0, 3);

    keyInsights.push(...highPriorityInsights.map(insight => insight.title));

    // Add correlation insights
    if (insights.correlations && insights.correlations.length > 0) {
      const strongestCorr = insights.correlations[0];
      keyInsights.push(
        `Strongest correlation: ${strongestCorr.x} and ${strongestCorr.y} (${strongestCorr.correlation})`
      );
    }

    return keyInsights.slice(0, 5); // Limit to 5 key insights
  }

  /**
   * Generate global filters for dashboard
   */
  private static generateGlobalFilters(semanticResults: any[], columnMetadata: any[]) {
    const globalFilters: ChartFilter[] = [];
    const filterGroups: string[][] = [];

    // Add date range filters for date columns
    const dateColumns = semanticResults.filter(col => col.semantic_type === 'date_time');
    if (dateColumns.length > 0) {
      filterGroups.push(['date_range']);
    }

    // Add categorical filters
    const categoryColumns = semanticResults.filter(col => 
      ['category', 'address'].includes(col.semantic_type)
    );
    
    if (categoryColumns.length > 0) {
      filterGroups.push(categoryColumns.map(col => col.name));
    }

    return {
      global_filters: globalFilters,
      filter_groups: filterGroups
    };
  }

  /**
   * Store dashboard configuration in database
   */
  private static async storeDashboardConfig(
    datasetId: number,
    userId: number,
    dashboardConfig: DashboardConfig
  ): Promise<void> {
    try {
      const insertQuery = `
        INSERT INTO auto_dashboards 
        (dataset_id, user_id, dashboard_name, dashboard_config, generation_status, created_at)
        VALUES (?, ?, ?, ?, 'completed', NOW())
        ON DUPLICATE KEY UPDATE
        dashboard_config = VALUES(dashboard_config),
        generation_status = 'completed',
        updated_at = NOW()
      `;

      await Database.query(insertQuery, [
        datasetId,
        userId,
        dashboardConfig.name,
        JSON.stringify(dashboardConfig)
      ]);

    } catch (error) {
      console.error('Error storing dashboard config:', error);
      throw error;
    }
  }

  /**
   * Get stored dashboard configuration
   */
  static async getDashboardConfig(datasetId: number, userId: number): Promise<DashboardConfig | null> {
    try {
      const query = `
        SELECT dashboard_config 
        FROM auto_dashboards 
        WHERE dataset_id = ? AND user_id = ? AND generation_status = 'completed'
      `;

      const result = await Database.query(query, [datasetId, userId]);

      if (!result || result.length === 0) {
        return null;
      }

      return JSON.parse(result[0].dashboard_config);

    } catch (error) {
      console.error('Error getting dashboard config:', error);
      throw error;
    }
  }

  /**
   * Get chart data for a specific chart
   */
  static async getChartData(
    datasetId: number,
    userId: number,
    chartId: string,
    filters?: ChartFilter[]
  ): Promise<any[]> {
    try {
      // Get dashboard config to find chart configuration
      const dashboardConfig = await this.getDashboardConfig(datasetId, userId);
      if (!dashboardConfig) {
        throw new Error('Dashboard configuration not found');
      }

      const chartConfig = dashboardConfig.charts.find(chart => chart.id === chartId);
      if (!chartConfig) {
        throw new Error('Chart configuration not found');
      }

      // Get dataset file path
      const datasetInfo = await this.getDatasetInfo(datasetId, userId);
      
      // Generate SQL query based on chart configuration
      const sqlQuery = this.generateChartQuery(chartConfig, filters);
      
      // For now, return mock data structure
      // In a real implementation, you would execute the query against your data source
      return await this.executeChartQuery(datasetInfo.file_path, sqlQuery, chartConfig);

    } catch (error) {
      console.error('Error getting chart data:', error);
      throw error;
    }
  }

  /**
   * Generate SQL query for chart data
   */
  private static generateChartQuery(chartConfig: ChartConfig, filters?: ChartFilter[]): string {
    let query = 'SELECT ';
    
    // Build SELECT clause
    if (chartConfig.y_axis) {
      const aggregation = chartConfig.aggregation || 'sum';
      query += `${chartConfig.x_axis}, ${aggregation.toUpperCase()}(${chartConfig.y_axis}) as value `;
    } else {
      query += `${chartConfig.x_axis}, COUNT(*) as value `;
    }

    query += 'FROM dataset ';

    // Build WHERE clause
    const whereConditions: string[] = [];
    
    if (filters) {
      for (const filter of filters) {
        whereConditions.push(this.buildFilterCondition(filter));
      }
    }

    if (whereConditions.length > 0) {
      query += 'WHERE ' + whereConditions.join(' AND ') + ' ';
    }

    // Build GROUP BY clause
    if (chartConfig.type !== 'histogram') {
      query += `GROUP BY ${chartConfig.x_axis} `;
    }

    // Build ORDER BY clause
    if (chartConfig.sort_order) {
      query += `ORDER BY value ${chartConfig.sort_order.toUpperCase()} `;
    }

    // Build LIMIT clause
    if (chartConfig.limit) {
      query += `LIMIT ${chartConfig.limit} `;
    }

    return query;
  }

  /**
   * Build filter condition for SQL
   */
  private static buildFilterCondition(filter: ChartFilter): string {
    switch (filter.operator) {
      case 'equals':
        return `${filter.column} = '${filter.value}'`;
      case 'not_equals':
        return `${filter.column} != '${filter.value}'`;
      case 'greater_than':
        return `${filter.column} > ${filter.value}`;
      case 'less_than':
        return `${filter.column} < ${filter.value}`;
      case 'contains':
        return `${filter.column} LIKE '%${filter.value}%'`;
      case 'in':
        const values = Array.isArray(filter.value) ? filter.value : [filter.value];
        return `${filter.column} IN ('${values.join("','")}')`;
      default:
        return '1=1';
    }
  }

  /**
   * Execute chart query (mock implementation)
   */
  private static async executeChartQuery(
    filePath: string, 
    query: string, 
    chartConfig: ChartConfig
  ): Promise<any[]> {
    // This is a simplified mock implementation
    // In a real scenario, you would use a proper SQL engine or data processing library
    
    // Return mock data based on chart type
    switch (chartConfig.type) {
      case 'pie':
        return [
          { label: 'Category A', value: 30 },
          { label: 'Category B', value: 45 },
          { label: 'Category C', value: 25 }
        ];
      
      case 'line':
        return Array.from({ length: 12 }, (_, i) => ({
          x: `2024-${String(i + 1).padStart(2, '0')}`,
          y: Math.floor(Math.random() * 1000) + 500
        }));
      
      case 'bar':
        return [
          { x: 'Product A', y: 1200 },
          { x: 'Product B', y: 800 },
          { x: 'Product C', y: 1500 },
          { x: 'Product D', y: 600 }
        ];
      
      case 'scatter':
        return Array.from({ length: 50 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100
        }));
      
      default:
        return [];
    }
  }

  /**
   * Helper methods
   */
  private static async getDatasetInfo(datasetId: number, userId: number): Promise<any> {
    const query = 'SELECT * FROM datasets WHERE id = ? AND user_id = ?';
    const result = await Database.query(query, [datasetId, userId]);
    
    if (!result || result.length === 0) {
      throw new Error('Dataset not found');
    }
    
    return result[0];
  }

  private static async getColumnMetadata(datasetId: number, userId: number): Promise<any[]> {
    const query = `
      SELECT cm.*
      FROM data_profiles dp
      JOIN column_metadata cm ON dp.id = cm.profile_id
      WHERE dp.dataset_id = ? AND dp.user_id = ?
    `;
    
    return await Database.query(query, [datasetId, userId]);
  }

  /**
   * Update dashboard configuration
   */
  static async updateDashboardConfig(
    datasetId: number,
    userId: number,
    updates: Partial<DashboardConfig>
  ): Promise<DashboardConfig> {
    try {
      const currentConfig = await this.getDashboardConfig(datasetId, userId);
      if (!currentConfig) {
        throw new Error('Dashboard configuration not found');
      }

      const updatedConfig = { ...currentConfig, ...updates };
      
      await this.storeDashboardConfig(datasetId, userId, updatedConfig);
      
      return updatedConfig;

    } catch (error) {
      console.error('Error updating dashboard config:', error);
      throw error;
    }
  }

  /**
   * Generate dashboard status
   */
  static async getDashboardStatus(datasetId: number, userId: number): Promise<string> {
    try {
      const query = `
        SELECT generation_status 
        FROM auto_dashboards 
        WHERE dataset_id = ? AND user_id = ?
      `;
      
      const result = await Database.query(query, [datasetId, userId]);
      
      if (!result || result.length === 0) {
        return 'not_generated';
      }
      
      return result[0].generation_status;

    } catch (error) {
      console.error('Error getting dashboard status:', error);
      return 'error';
    }
  }
}