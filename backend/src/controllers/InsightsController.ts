import { Request, Response } from 'express';
import { PythonBridge } from '../services/PythonBridge';
import Database from '../config/database';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export class InsightsController {
  /**
   * Generate insights for a dataset
   */
  static async generateInsights(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get dataset info
      const dataset = await Database.query(
        'SELECT * FROM datasets WHERE id = ? AND user_id = ?',
        [datasetId, userId]
      ) as Record<string, unknown>[];

      if (!dataset || dataset.length === 0) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const datasetInfo = dataset[0];
      const filePath = datasetInfo.file_path as string;

      // Check if insights already exist
      const existingInsights = await Database.query(
        'SELECT * FROM insights WHERE dataset_id = ? AND user_id = ?',
        [datasetId, userId]
      ) as Record<string, unknown>[];

      if (existingInsights && existingInsights.length > 0) {
        const insights = await Database.query(
          'SELECT * FROM insight_items WHERE insight_id = ?',
          [existingInsights[0].id]
        );

        return res.status(200).json({
          success: true,
          data: {
            insights,
            cached: true
          }
        });
      }

      // Generate insights using Python
      const result = await PythonBridge.generateInsights(
        filePath,
        parseInt(datasetId),
        userId
      );

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to generate insights',
          details: result.error
        });
      }

      const insightsData = result.data as {
        insights: Array<Record<string, unknown>>;
        total_insights: number;
      };

      // Store insights in database
      const insertResult = await Database.query(
        'INSERT INTO insights (dataset_id, user_id, total_count, generated_at) VALUES (?, ?, ?, NOW())',
        [datasetId, userId, insightsData.total_insights]
      );

      const insightId = (insertResult as any).insertId;

      // Store individual insights
      for (const insight of insightsData.insights) {
        await Database.query(
          `INSERT INTO insight_items 
           (insight_id, type, category, column_name, title, description, confidence, metadata) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            insightId,
            insight.type,
            insight.category,
            insight.column,
            insight.title,
            insight.description,
            insight.confidence,
            JSON.stringify(insight.metadata)
          ]
        );
      }

      res.status(200).json({
        success: true,
        data: {
          insights: insightsData.insights,
          total: insightsData.total_insights
        }
      });

    } catch (error) {
      console.error('Generate insights error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get insights for a dataset
   */
  static async getInsights(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get insights
      const insights = await Database.query(
        `SELECT ii.* FROM insight_items ii
         JOIN insights i ON ii.insight_id = i.id
         WHERE i.dataset_id = ? AND i.user_id = ?
         ORDER BY ii.confidence DESC`,
        [datasetId, userId]
      ) as Record<string, unknown>[];

      res.status(200).json({
        success: true,
        data: insights.map(insight => ({
          ...insight,
          metadata: JSON.parse(insight.metadata as string)
        }))
      });

    } catch (error) {
      console.error('Get insights error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Test Python connection
   */
  static async testPythonConnection(req: AuthRequest, res: Response) {
    try {
      const result = await PythonBridge.testConnection();
      
      res.status(200).json({
        success: result.success,
        data: result.data,
        error: result.error
      });

    } catch (error) {
      console.error('Test connection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get comprehensive analysis for dataset
   */
  static async getComprehensiveAnalysis(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get dataset info
      const dataset = await Database.query(
        'SELECT * FROM datasets WHERE id = ? AND user_id = ?',
        [datasetId, userId]
      ) as Record<string, unknown>[];

      if (!dataset || dataset.length === 0) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const datasetInfo = dataset[0];
      const filePath = datasetInfo.file_path as string;

      // Run all analyses in parallel
      const [
        insights,
        profile,
        recommendations,
        correlations
      ] = await Promise.all([
        PythonBridge.generateInsights(filePath, parseInt(datasetId), userId),
        PythonBridge.profileData(filePath, parseInt(datasetId)),
        PythonBridge.getChartRecommendations(filePath, parseInt(datasetId)),
        PythonBridge.findCorrelations(filePath, 0.7)
      ]);

      res.status(200).json({
        success: true,
        data: {
          insights: insights.success ? insights.data : null,
          profile: profile.success ? profile.data : null,
          recommendations: recommendations.success ? recommendations.data : null,
          correlations: correlations.success ? correlations.data : null
        }
      });

    } catch (error) {
      console.error('Comprehensive analysis error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}