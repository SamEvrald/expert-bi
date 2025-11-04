import { Request, Response } from 'express';
import { DashboardGenerationService } from '../services/DashboardGenerationService';

export class DashboardController {
  /**
   * Generate auto dashboard for dataset
   */
  static async generateDashboard(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const { dashboard_name } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if dashboard already exists
      const existingConfig = await DashboardGenerationService.getDashboardConfig(
        parseInt(datasetId), 
        userId
      );

      if (existingConfig) {
        return res.status(200).json({
          success: true,
          message: 'Dashboard already exists',
          data: existingConfig
        });
      }

      // Generate dashboard
      const dashboardConfig = await DashboardGenerationService.generateDashboard(
        parseInt(datasetId),
        userId,
        dashboard_name
      );

      res.status(201).json({
        success: true,
        message: 'Dashboard generated successfully',
        data: dashboardConfig
      });

    } catch (error) {
      console.error('Generate dashboard error:', error);
      res.status(500).json({ 
        error: 'Failed to generate dashboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get dashboard configuration
   */
  static async getDashboard(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboardConfig = await DashboardGenerationService.getDashboardConfig(
        parseInt(datasetId),
        userId
      );

      if (!dashboardConfig) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }

      res.status(200).json({
        success: true,
        data: dashboardConfig
      });

    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get chart data
   */
  static async getChartData(req: Request, res: Response) {
    try {
      const { datasetId, chartId } = req.params;
      const { filters } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const chartData = await DashboardGenerationService.getChartData(
        parseInt(datasetId),
        userId,
        chartId,
        filters
      );

      res.status(200).json({
        success: true,
        data: {
          chart_id: chartId,
          data: chartData,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Get chart data error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update dashboard configuration
   */
  static async updateDashboard(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const updates = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updatedConfig = await DashboardGenerationService.updateDashboardConfig(
        parseInt(datasetId),
        userId,
        updates
      );

      res.status(200).json({
        success: true,
        message: 'Dashboard updated successfully',
        data: updatedConfig
      });

    } catch (error) {
      console.error('Update dashboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get dashboard status
   */
  static async getDashboardStatus(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const status = await DashboardGenerationService.getDashboardStatus(
        parseInt(datasetId),
        userId
      );

      res.status(200).json({
        success: true,
        data: {
          dataset_id: parseInt(datasetId),
          status
        }
      });

    } catch (error) {
      console.error('Get dashboard status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get dashboard preview/summary
   */
  static async getDashboardPreview(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboardConfig = await DashboardGenerationService.getDashboardConfig(
        parseInt(datasetId),
        userId
      );

      if (!dashboardConfig) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }

      // Return summarized dashboard info
      const preview = {
        id: dashboardConfig.id,
        name: dashboardConfig.name,
        description: dashboardConfig.description,
        chart_count: dashboardConfig.charts.length,
        chart_types: [...new Set(dashboardConfig.charts.map(chart => chart.type))],
        key_insights: dashboardConfig.key_insights,
        last_updated: dashboardConfig.created_at
      };

      res.status(200).json({
        success: true,
        data: preview
      });

    } catch (error) {
      console.error('Get dashboard preview error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Regenerate dashboard
   */
  static async regenerateDashboard(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const { dashboard_name } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Force regeneration by creating new dashboard
      const dashboardConfig = await DashboardGenerationService.generateDashboard(
        parseInt(datasetId),
        userId,
        dashboard_name
      );

      res.status(201).json({
        success: true,
        message: 'Dashboard regenerated successfully',
        data: dashboardConfig
      });

    } catch (error) {
      console.error('Regenerate dashboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Export dashboard configuration
   */
  static async exportDashboard(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const { format } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboardConfig = await DashboardGenerationService.getDashboardConfig(
        parseInt(datasetId),
        userId
      );

      if (!dashboardConfig) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }

      // Set appropriate headers for download
      const filename = `dashboard_${datasetId}_${Date.now()}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.status(200).json(dashboardConfig);

    } catch (error) {
      console.error('Export dashboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}