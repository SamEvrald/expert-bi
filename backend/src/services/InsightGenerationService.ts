import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3StorageService } from './S3StorageService';
import Database from '../config/database';

export interface Insight {
  type: 'correlation' | 'outlier' | 'trend' | 'driver' | 'summary' | 'data_quality';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: string;
}

export interface Correlation {
  x: string;
  y: string;
  correlation: number;
  strength: 'strong' | 'moderate';
  direction: 'positive' | 'negative';
}

export interface Outlier {
  column: string;
  count: number;
  percentage: number;
  lower_bound: number;
  upper_bound: number;
}

export interface Trend {
  date_column: string;
  value_column: string;
  direction: 'increasing' | 'decreasing';
  slope: number;
  change_rate: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  target: string;
}

export interface InsightAnalysisResult {
  summary: string;
  insights: Insight[];
  correlations: Correlation[];
  outliers: Outlier[];
  trends: Trend[];
  feature_importance: FeatureImportance[];
  metadata: {
    total_insights: number;
    high_priority: number;
    analysis_timestamp: string;
  };
}

export class InsightGenerationService {
  private static readonly PYTHON_SCRIPT_PATH = path.join(__dirname, '../../python/insight_generator.py');
  private static readonly TEMP_DIR = path.join(__dirname, '../../temp');

  /**
   * Generate insights for a dataset
   */
  static async generateInsights(
    datasetId: number,
    userId: number
  ): Promise<InsightAnalysisResult> {
    try {
      // Get dataset information
      const dataset = await this.getDatasetInfo(datasetId, userId);
      
      // Download dataset from S3 to temp file
      const tempDataFile = await this.prepareDataFile(dataset.file_path || dataset.s3_key);
      
      // Get metadata for context
      const metadata = await this.getDatasetMetadata(datasetId, userId);
      const tempMetadataFile = await this.prepareMetadataFile(metadata);
      
      // Run Python insight generation
      const insights = await this.runInsightGeneration(tempDataFile, tempMetadataFile);
      
      // Store insights in database
      await this.storeInsights(datasetId, userId, insights);
      
      // Cleanup temp files
      await this.cleanup([tempDataFile, tempMetadataFile]);
      
      return insights;

    } catch (error) {
      console.error('Insight generation error:', error);
      throw new Error(`Failed to generate insights: ${error}`);
    }
  }

  /**
   * Get dataset information from database
   */
  private static async getDatasetInfo(datasetId: number, userId: number): Promise<any> {
    const query = 'SELECT * FROM datasets WHERE id = ? AND user_id = ?';
    const result = await Database.query(query, [datasetId, userId]);
    
    if (!result || result.length === 0) {
      throw new Error('Dataset not found');
    }
    
    return result[0];
  }

  /**
   * Prepare data file for analysis
   */
  private static async prepareDataFile(s3KeyOrPath: string): Promise<string> {
    const tempId = uuidv4();
    const tempFile = path.join(this.TEMP_DIR, `data_${tempId}.csv`);
    
    try {
      // If it's an S3 key, download from S3
      if (s3KeyOrPath.startsWith('datasets/')) {
        const buffer = await S3StorageService.downloadFile(s3KeyOrPath);
        await fs.writeFile(tempFile, buffer);
      } else {
        // It's a local file path
        const data = await fs.readFile(s3KeyOrPath);
        await fs.writeFile(tempFile, data);
      }
      
      return tempFile;
    } catch (error) {
      throw new Error(`Failed to prepare data file: ${error}`);
    }
  }

  /**
   * Get dataset metadata for context
   */
  private static async getDatasetMetadata(datasetId: number, userId: number): Promise<any> {
    const query = `
      SELECT dp.metadata, cm.column_name, cm.data_type, cm.sample_values
      FROM data_profiles dp
      LEFT JOIN column_metadata cm ON dp.id = cm.profile_id
      WHERE dp.dataset_id = ? AND dp.user_id = ?
    `;
    
    const result = await Database.query(query, [datasetId, userId]);
    
    if (!result || result.length === 0) {
      return { columns: [] };
    }
    
    const metadata = JSON.parse(result[0].metadata || '{}');
    const columns = result.map((row: any) => ({
      name: row.column_name,
      type: row.data_type,
      sample_values: JSON.parse(row.sample_values || '[]')
    }));
    
    return { ...metadata, columns };
  }

  /**
   * Prepare metadata file for Python script
   */
  private static async prepareMetadataFile(metadata: any): Promise<string> {
    const tempId = uuidv4();
    const tempFile = path.join(this.TEMP_DIR, `metadata_${tempId}.json`);
    
    await fs.writeFile(tempFile, JSON.stringify(metadata, null, 2));
    return tempFile;
  }

  /**
   * Run Python insight generation script
   */
  private static async runInsightGeneration(
    dataFile: string,
    metadataFile: string
  ): Promise<InsightAnalysisResult> {
    const outputId = uuidv4();
    const outputFile = path.join(this.TEMP_DIR, `insights_${outputId}.json`);

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        this.PYTHON_SCRIPT_PATH,
        '--data', dataFile,
        '--metadata', metadataFile,
        '--output', outputFile
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        try {
          if (code === 0) {
            const outputData = await fs.readFile(outputFile, 'utf-8');
            const insights: InsightAnalysisResult = JSON.parse(outputData);
            
            // Cleanup output file
            await fs.unlink(outputFile).catch(() => {});
            
            resolve(insights);
          } else {
            reject(new Error(`Python script failed with code ${code}: ${stderr}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse insights output: ${error}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // Set timeout
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Insight generation timeout'));
      }, 120000); // 2 minutes timeout
    });
  }

  /**
   * Store insights in database
   */
  private static async storeInsights(
    datasetId: number,
    userId: number,
    insights: InsightAnalysisResult
  ): Promise<void> {
    try {
      // Insert or update insight analysis record
      const insertAnalysisQuery = `
        INSERT INTO insight_analysis (dataset_id, user_id, analysis_status, insights_data, created_at)
        VALUES (?, ?, 'completed', ?, NOW())
        ON DUPLICATE KEY UPDATE 
        analysis_status = 'completed',
        insights_data = VALUES(insights_data),
        updated_at = NOW()
      `;
      
      await Database.query(insertAnalysisQuery, [
        datasetId,
        userId,
        JSON.stringify(insights)
      ]);

      // Get analysis ID
      const getAnalysisIdQuery = `
        SELECT id FROM insight_analysis 
        WHERE dataset_id = ? AND user_id = ?
      `;
      const analysisResult = await Database.query(getAnalysisIdQuery, [datasetId, userId]);
      const analysisId = analysisResult[0].id;

      // Store individual insights
      for (const insight of insights.insights) {
        const insertInsightQuery = `
          INSERT INTO generated_insights 
          (analysis_id, insight_type, priority, title, description, actionable_recommendation, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        await Database.query(insertInsightQuery, [
          analysisId,
          insight.type,
          insight.priority,
          insight.title,
          insight.description,
          insight.actionable
        ]);
      }

      // Store correlations
      for (const correlation of insights.correlations) {
        const insertCorrelationQuery = `
          INSERT INTO insight_correlations 
          (analysis_id, column_x, column_y, correlation_value, strength, direction, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        await Database.query(insertCorrelationQuery, [
          analysisId,
          correlation.x,
          correlation.y,
          correlation.correlation,
          correlation.strength,
          correlation.direction
        ]);
      }

      // Store trends
      for (const trend of insights.trends) {
        const insertTrendQuery = `
          INSERT INTO insight_trends 
          (analysis_id, date_column, value_column, direction, slope, change_rate, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        await Database.query(insertTrendQuery, [
          analysisId,
          trend.date_column,
          trend.value_column,
          trend.direction,
          trend.slope,
          trend.change_rate
        ]);
      }

    } catch (error) {
      console.error('Error storing insights:', error);
      throw error;
    }
  }

  /**
   * Get stored insights for a dataset
   */
  static async getStoredInsights(datasetId: number, userId: number): Promise<InsightAnalysisResult | null> {
    try {
      const query = `
        SELECT insights_data, analysis_status 
        FROM insight_analysis 
        WHERE dataset_id = ? AND user_id = ? AND analysis_status = 'completed'
      `;
      
      const result = await Database.query(query, [datasetId, userId]);
      
      if (!result || result.length === 0) {
        return null;
      }
      
      return JSON.parse(result[0].insights_data);

    } catch (error) {
      console.error('Error getting stored insights:', error);
      throw error;
    }
  }

  /**
   * Check insight analysis status
   */
  static async getAnalysisStatus(datasetId: number, userId: number): Promise<string> {
    try {
      const query = `
        SELECT analysis_status 
        FROM insight_analysis 
        WHERE dataset_id = ? AND user_id = ?
      `;
      
      const result = await Database.query(query, [datasetId, userId]);
      
      if (!result || result.length === 0) {
        return 'not_started';
      }
      
      return result[0].analysis_status;

    } catch (error) {
      console.error('Error checking analysis status:', error);
      return 'error';
    }
  }

  /**
   * Cleanup temporary files
   */
  private static async cleanup(files: string[]): Promise<void> {
    await Promise.all(
      files.map(async (file) => {
        try {
          await fs.unlink(file);
        } catch (error) {
          console.warn(`Failed to cleanup file ${file}:`, error);
        }
      })
    );
  }

  /**
   * Initialize service
   */
  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.TEMP_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }
}