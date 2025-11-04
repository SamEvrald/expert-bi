import { Request, Response } from 'express';
import { InsightGenerationService } from '../services/InsightGenerationService';
import Database from '../config/database';

export class InsightsController {
  /**
   * Generate insights for a dataset
   */
  static async generateInsights(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if insights already exist
      const status = await InsightGenerationService.getAnalysisStatus(parseInt(datasetId), userId);
      
      if (status === 'completed') {
        const existingInsights = await InsightGenerationService.getStoredInsights(parseInt(datasetId), userId);
        return res.status(200).json({
          success: true,
          message: 'Insights already generated',
          data: existingInsights
        });
      }

      if (status === 'processing') {
        return res.status(202).json({
          success: true,
          message: 'Insight generation in progress',
          data: { status: 'processing' }
        });
      }

      // Mark as processing
      await Database.query(
        'INSERT INTO insight_analysis (dataset_id, user_id, analysis_status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE analysis_status = ?',
        [parseInt(datasetId), userId, 'processing', 'processing']
      );

      // Start insight generation in background
      setImmediate(async () => {
        try {
          await InsightGenerationService.generateInsights(parseInt(datasetId), userId);
          console.log(`Insights generated successfully for dataset ${datasetId}`);
        } catch (error) {
          console.error('Background insight generation failed:', error);
          
          // Mark as failed
          await Database.query(
            'UPDATE insight_analysis SET analysis_status = ? WHERE dataset_id = ? AND user_id = ?',
            ['failed', parseInt(datasetId), userId]
          );
        }
      });

      res.status(202).json({
        success: true,
        message: 'Insight generation started',
        data: { status: 'processing' }
      });

    } catch (error) {
      console.error('Generate insights error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get generated insights
   */
  static async getInsights(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const insights = await InsightGenerationService.getStoredInsights(parseInt(datasetId), userId);

      if (!insights) {
        return res.status(404).json({ error: 'No insights found. Generate insights first.' });
      }

      res.status(200).json({
        success: true,
        data: insights
      });

    } catch (error) {
      console.error('Get insights error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get insight generation status
   */
  static async getInsightStatus(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const status = await InsightGenerationService.getAnalysisStatus(parseInt(datasetId), userId);

      res.status(200).json({
        success: true,
        data: { 
          status,
          dataset_id: parseInt(datasetId)
        }
      });

    } catch (error) {
      console.error('Get insight status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get insights summary for dashboard
   */
  static async getInsightsSummary(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get high-priority insights
      const highPriorityQuery = `
        SELECT gi.title, gi.description, gi.insight_type
        FROM insight_analysis ia
        JOIN generated_insights gi ON ia.id = gi.analysis_id
        WHERE ia.dataset_id = ? AND ia.user_id = ? AND gi.priority = 'high'
        ORDER BY gi.created_at DESC
        LIMIT 5
      `;

      const highPriorityInsights = await Database.query(highPriorityQuery, [parseInt(datasetId), userId]);

      // Get correlation count
      const correlationCountQuery = `
        SELECT COUNT(*) as count
        FROM insight_analysis ia
        JOIN insight_correlations ic ON ia.id = ic.analysis_id
        WHERE ia.dataset_id = ? AND ia.user_id = ?
      `;

      const correlationCount = await Database.query(correlationCountQuery, [parseInt(datasetId), userId]);

      // Get trend count
      const trendCountQuery = `
        SELECT COUNT(*) as count
        FROM insight_analysis ia
        JOIN insight_trends it ON ia.id = it.analysis_id
        WHERE ia.dataset_id = ? AND ia.user_id = ?
      `;

      const trendCount = await Database.query(trendCountQuery, [parseInt(datasetId), userId]);

      res.status(200).json({
        success: true,
        data: {
          high_priority_insights: highPriorityInsights,
          correlations_found: correlationCount[0]?.count || 0,
          trends_found: trendCount[0]?.count || 0,
          total_insights: highPriorityInsights.length
        }
      });

    } catch (error) {
      console.error('Get insights summary error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get correlations for a dataset
   */
  static async getCorrelations(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const query = `
        SELECT ic.*
        FROM insight_analysis ia
        JOIN insight_correlations ic ON ia.id = ic.analysis_id
        WHERE ia.dataset_id = ? AND ia.user_id = ?
        ORDER BY ABS(ic.correlation_value) DESC
      `;

      const correlations = await Database.query(query, [parseInt(datasetId), userId]);

      res.status(200).json({
        success: true,
        data: correlations
      });

    } catch (error) {
      console.error('Get correlations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get trends for a dataset
   */
  static async getTrends(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const query = `
        SELECT it.*
        FROM insight_analysis ia
        JOIN insight_trends it ON ia.id = it.analysis_id
        WHERE ia.dataset_id = ? AND ia.user_id = ?
        ORDER BY ABS(it.slope) DESC
      `;

      const trends = await Database.query(query, [parseInt(datasetId), userId]);

      res.status(200).json({
        success: true,
        data: trends
      });

    } catch (error) {
      console.error('Get trends error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}