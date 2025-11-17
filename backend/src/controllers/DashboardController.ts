import { Request, Response } from 'express';
import { DashboardGenerationService } from '../services/DashboardGenerationService';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export class DashboardController {
  /**
   * Create a new dashboard
   */
  static async createDashboard(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const dashboardData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboard = await DashboardGenerationService.createDashboard(
        parseInt(datasetId),
        userId,
        dashboardData
      );

      res.status(201).json({
        success: true,
        message: 'Dashboard created successfully',
        data: dashboard
      });
    } catch (error) {
      console.error('Create dashboard error:', error);
      res.status(500).json({ 
        error: 'Failed to create dashboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all dashboards for a dataset
   */
  static async getDashboards(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboards = await DashboardGenerationService.getDashboards(
        parseInt(datasetId),
        userId
      );

      res.status(200).json({
        success: true,
        data: dashboards
      });
    } catch (error) {
      console.error('Get dashboards error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get single dashboard by ID
   */
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const { dashboardId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboard = await DashboardGenerationService.getDashboardById(
        parseInt(dashboardId),
        userId
      );

      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update dashboard
   */
  static async updateDashboard(req: AuthRequest, res: Response) {
    try {
      const { dashboardId } = req.params;
      const updates = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updatedDashboard = await DashboardGenerationService.updateDashboard(
        parseInt(dashboardId),
        userId,
        updates
      );

      res.status(200).json({
        success: true,
        message: 'Dashboard updated successfully',
        data: updatedDashboard
      });
    } catch (error) {
      console.error('Update dashboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete dashboard
   */
  static async deleteDashboard(req: AuthRequest, res: Response) {
    try {
      const { dashboardId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await DashboardGenerationService.deleteDashboard(
        parseInt(dashboardId),
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Dashboard deleted successfully'
      });
    } catch (error) {
      console.error('Delete dashboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get dataset columns
   */
  static async getDatasetColumns(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const columns = await DashboardGenerationService.getDatasetColumns(
        parseInt(datasetId),
        userId
      );

      res.status(200).json({
        success: true,
        data: { columns }
      });
    } catch (error) {
      console.error('Get dataset columns error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get chart data with filters
   */
  static async getChartData(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const chartConfig = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const chartData = await DashboardGenerationService.getChartData(
        parseInt(datasetId),
        userId,
        chartConfig
      );

      res.status(200).json({
        success: true,
        data: chartData
      });
    } catch (error) {
      console.error('Get chart data error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate auto dashboard for dataset (legacy method - redirects to createDashboard)
   */
  static async generateDashboard(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const { dashboard_name } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if dashboard already exists
      const existingDashboards = await DashboardGenerationService.getDashboards(
        parseInt(datasetId),
        userId
      );

      if (existingDashboards.length > 0) {
        return res.status(200).json({
          success: true,
          message: 'Dashboard already exists',
          data: existingDashboards[0]
        });
      }

      // Create new auto-generated dashboard
      const dashboardData = {
        name: dashboard_name || 'Auto-Generated Dashboard',
        description: 'Automatically generated dashboard with AI-powered insights',
        layout: [],
        globalFilters: []
      };

      const dashboard = await DashboardGenerationService.createDashboard(
        parseInt(datasetId),
        userId,
        dashboardData
      );

      res.status(201).json({
        success: true,
        message: 'Dashboard generated successfully',
        data: dashboard
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
   * Get dashboard status
   */
  static async getDashboardStatus(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboards = await DashboardGenerationService.getDashboards(
        parseInt(datasetId),
        userId
      );

      const status = dashboards.length > 0 ? 'completed' : 'not_started';

      res.status(200).json({
        success: true,
        data: {
          dataset_id: parseInt(datasetId),
          status,
          dashboard_count: dashboards.length
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
  static async getDashboardPreview(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboards = await DashboardGenerationService.getDashboards(
        parseInt(datasetId),
        userId
      );

      if (!dashboards || dashboards.length === 0) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }

      const dashboard = dashboards[0] as Record<string, unknown>;

      // Return summarized dashboard info
      const preview = {
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        chart_count: Array.isArray(dashboard.layout) ? dashboard.layout.length : 0,
        chart_types: Array.isArray(dashboard.layout) 
          ? [...new Set(dashboard.layout.map((chart: Record<string, unknown>) => chart.type))]
          : [],
        last_updated: dashboard.created_at
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
  static async regenerateDashboard(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const { dashboard_name } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete existing dashboards
      const existingDashboards = await DashboardGenerationService.getDashboards(
        parseInt(datasetId),
        userId
      );

      for (const dashboard of existingDashboards) {
        await DashboardGenerationService.deleteDashboard(
          (dashboard as Record<string, unknown>).id as number,
          userId
        );
      }

      // Create new dashboard
      const dashboardData = {
        name: dashboard_name || 'Regenerated Dashboard',
        description: 'Regenerated dashboard with updated insights',
        layout: [],
        globalFilters: []
      };

      const newDashboard = await DashboardGenerationService.createDashboard(
        parseInt(datasetId),
        userId,
        dashboardData
      );

      res.status(201).json({
        success: true,
        message: 'Dashboard regenerated successfully',
        data: newDashboard
      });
    } catch (error) {
      console.error('Regenerate dashboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Export dashboard configuration
   */
  static async exportDashboard(req: AuthRequest, res: Response) {
    try {
      const { dashboardId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboard = await DashboardGenerationService.getDashboardById(
        parseInt(dashboardId),
        userId
      );

      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }

      // Set appropriate headers for download
      const filename = `dashboard_${dashboardId}_${Date.now()}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.status(200).json(dashboard);
    } catch (error) {
      console.error('Export dashboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}