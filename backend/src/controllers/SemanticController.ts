import { Request, Response } from 'express';
import { SemanticAnalysisService } from '../services/SemanticAnalysisService';
import { PythonSemanticService } from '../services/PythonSemanticService';

export class SemanticController {
  /**
   * Start semantic analysis for a dataset
   */
  static async analyzeDataset(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if analysis already exists
      const status = await SemanticAnalysisService.getAnalysisStatus(parseInt(datasetId), userId);
      
      if (status === 'completed') {
        return res.status(200).json({
          success: true,
          message: 'Semantic analysis already completed',
          data: { status: 'completed' }
        });
      }

      if (status === 'processing') {
        return res.status(202).json({
          success: true,
          message: 'Semantic analysis in progress',
          data: { status: 'processing' }
        });
      }

      // Start analysis in background
      setImmediate(async () => {
        try {
          await SemanticAnalysisService.analyzeDatasetSemantics(parseInt(datasetId), userId);
        } catch (error) {
          console.error('Background semantic analysis failed:', error);
        }
      });

      res.status(202).json({
        success: true,
        message: 'Semantic analysis started',
        data: { status: 'processing' }
      });

    } catch (error) {
      console.error('Semantic analysis error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get semantic analysis results
   */
  static async getSemanticResults(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const results = await SemanticAnalysisService.getSemanticResults(parseInt(datasetId), userId);

      if (!results || results.length === 0) {
        return res.status(404).json({ error: 'No semantic analysis results found' });
      }

      res.status(200).json({
        success: true,
        data: {
          dataset_id: parseInt(datasetId),
          columns: results,
          total_columns: results.length,
          semantic_categories: this.groupByCategory(results)
        }
      });

    } catch (error) {
      console.error('Get semantic results error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get semantic analysis status
   */
  static async getAnalysisStatus(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const status = await SemanticAnalysisService.getAnalysisStatus(parseInt(datasetId), userId);

      res.status(200).json({
        success: true,
        data: { 
          status,
          dataset_id: parseInt(datasetId)
        }
      });

    } catch (error) {
      console.error('Get analysis status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Check Python environment health
   */
  static async checkEnvironment(req: Request, res: Response) {
    try {
      const pythonAvailable = await PythonSemanticService.checkPythonEnvironment();
      
      res.status(200).json({
        success: true,
        data: {
          python_available: pythonAvailable,
          environment_status: pythonAvailable ? 'ready' : 'not_available'
        }
      });

    } catch (error) {
      console.error('Environment check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Install Python dependencies
   */
  static async installDependencies(req: Request, res: Response) {
    try {
      await PythonSemanticService.installDependencies();
      
      res.status(200).json({
        success: true,
        message: 'Python dependencies installed successfully'
      });

    } catch (error) {
      console.error('Dependency installation error:', error);
      res.status(500).json({ 
        error: 'Failed to install Python dependencies',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Group results by semantic category
   */
  private static groupByCategory(results: any[]) {
    const grouped: Record<string, any[]> = {};
    
    results.forEach(result => {
      const category = result.semantic_category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(result);
    });

    return Object.entries(grouped).map(([category, columns]) => ({
      category,
      count: columns.length,
      columns: columns.map(col => ({
        name: col.name,
        semantic_type: col.semantic_type,
        confidence: col.confidence
      }))
    }));
  }
}