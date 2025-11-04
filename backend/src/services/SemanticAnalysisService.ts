import { PythonSemanticService, SemanticClassification, ColumnData } from './PythonSemanticService';
import Database from '../config/database';

export interface EnhancedColumnProfile {
  id: number;
  name: string;
  original_type: string;
  semantic_type: string;
  confidence: number;
  semantic_category: string;
  business_meaning?: string;
  suggested_visualizations: string[];
}

export class SemanticAnalysisService {
  /**
   * Perform semantic analysis on dataset columns
   */
  static async analyzeDatasetSemantics(datasetId: number, userId: number): Promise<SemanticClassification[]> {
    try {
      // Get column metadata from profiling results
      const columnData = await this.getColumnDataForAnalysis(datasetId, userId);
      
      if (!columnData || columnData.length === 0) {
        throw new Error('No column data found for semantic analysis');
      }

      // Perform semantic analysis using Python service
      const analysisResult = await PythonSemanticService.analyzeColumns(datasetId, columnData);
      
      // Store semantic analysis results
      await this.storeSemanticResults(datasetId, userId, analysisResult.classifications);
      
      return analysisResult.classifications;

    } catch (error) {
      console.error('Semantic analysis error:', error);
      throw new Error(`Failed to perform semantic analysis: ${error}`);
    }
  }

  /**
   * Get column data from profiling results for semantic analysis
   */
  private static async getColumnDataForAnalysis(datasetId: number, userId: number): Promise<ColumnData[]> {
    try {
      // Get profiling data
      const profileQuery = `
        SELECT p.id as profile_id 
        FROM data_profiles p 
        WHERE p.dataset_id = ? AND p.user_id = ? AND p.profiling_status = 'completed'
      `;
      const profiles = await Database.query(profileQuery, [datasetId, userId]);
      
      if (!profiles || profiles.length === 0) {
        throw new Error('No completed profiling found for dataset');
      }

      const profileId = profiles[0].profile_id;

      // Get column metadata
      const columnQuery = `
        SELECT column_name, data_type, sample_values 
        FROM column_metadata 
        WHERE profile_id = ?
      `;
      const columns = await Database.query(columnQuery, [profileId]);

      return columns.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        sample_values: JSON.parse(col.sample_values || '[]')
      }));

    } catch (error) {
      console.error('Error getting column data:', error);
      throw error;
    }
  }

  /**
   * Store semantic analysis results in database
   */
  private static async storeSemanticResults(
    datasetId: number, 
    userId: number, 
    classifications: SemanticClassification[]
  ): Promise<void> {
    try {
      // Create semantic_analysis table entry
      const insertAnalysisQuery = `
        INSERT INTO semantic_analysis (dataset_id, user_id, analysis_status, created_at)
        VALUES (?, ?, 'completed', NOW())
        ON DUPLICATE KEY UPDATE 
        analysis_status = 'completed', 
        updated_at = NOW()
      `;
      await Database.query(insertAnalysisQuery, [datasetId, userId]);

      // Get the analysis ID
      const getAnalysisIdQuery = `
        SELECT id FROM semantic_analysis 
        WHERE dataset_id = ? AND user_id = ?
      `;
      const analysisResult = await Database.query(getAnalysisIdQuery, [datasetId, userId]);
      const analysisId = analysisResult[0].id;

      // Store individual column classifications
      for (const classification of classifications) {
        const insertClassificationQuery = `
          INSERT INTO column_semantic_types 
          (analysis_id, column_name, original_type, semantic_type, confidence, detection_method, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
          semantic_type = VALUES(semantic_type),
          confidence = VALUES(confidence),
          detection_method = VALUES(detection_method),
          updated_at = NOW()
        `;
        
        await Database.query(insertClassificationQuery, [
          analysisId,
          classification.column_name,
          classification.original_type,
          classification.semantic_type,
          classification.confidence,
          classification.method
        ]);
      }

    } catch (error) {
      console.error('Error storing semantic results:', error);
      throw error;
    }
  }

  /**
   * Get semantic analysis results for a dataset
   */
  static async getSemanticResults(datasetId: number, userId: number): Promise<EnhancedColumnProfile[]> {
    try {
      const query = `
        SELECT 
          cst.id,
          cst.column_name as name,
          cst.original_type,
          cst.semantic_type,
          cst.confidence,
          cst.detection_method
        FROM semantic_analysis sa
        JOIN column_semantic_types cst ON sa.id = cst.analysis_id
        WHERE sa.dataset_id = ? AND sa.user_id = ?
        ORDER BY cst.column_name
      `;
      
      const results = await Database.query(query, [datasetId, userId]);
      
      return results.map((row: any) => ({
        id: row.id,
        name: row.name,
        original_type: row.original_type,
        semantic_type: row.semantic_type,
        confidence: row.confidence,
        semantic_category: this.getSemanticCategory(row.semantic_type),
        business_meaning: this.getBusinessMeaning(row.semantic_type),
        suggested_visualizations: this.getSuggestedVisualizations(row.semantic_type, row.original_type)
      }));

    } catch (error) {
      console.error('Error getting semantic results:', error);
      throw error;
    }
  }

  /**
   * Get semantic category for grouping
   */
  private static getSemanticCategory(semanticType: string): string {
    const categoryMap: Record<string, string> = {
      'identifier': 'Identity',
      'personal_name': 'Personal Data',
      'email': 'Contact Information',
      'phone': 'Contact Information',
      'address': 'Location Data',
      'date_time': 'Temporal Data',
      'currency': 'Financial Data',
      'percentage': 'Metrics',
      'category': 'Categorical Data',
      'quantity': 'Numerical Data',
      'coordinates': 'Location Data',
      'url': 'Web Data',
      'description': 'Text Data',
      'generic': 'General'
    };
    
    return categoryMap[semanticType] || 'General';
  }

  /**
   * Get business meaning explanation
   */
  private static getBusinessMeaning(semanticType: string): string {
    const meaningMap: Record<string, string> = {
      'identifier': 'Unique identifier for record tracking and relationships',
      'personal_name': 'Individual names for personalization and identification',
      'email': 'Communication channel for customer engagement',
      'phone': 'Direct contact method for customer service',
      'address': 'Physical location for delivery and demographics',
      'date_time': 'Temporal data for trend analysis and scheduling',
      'currency': 'Financial values for revenue analysis and budgeting',
      'percentage': 'Performance metrics and KPI measurements',
      'category': 'Classification data for segmentation analysis',
      'quantity': 'Countable items for inventory and volume analysis',
      'coordinates': 'Geographic data for location-based insights',
      'url': 'Web resources for digital asset management',
      'description': 'Textual content for sentiment and content analysis'
    };
    
    return meaningMap[semanticType] || 'General data field';
  }

  /**
   * Get suggested visualizations based on semantic type
   */
  private static getSuggestedVisualizations(semanticType: string, originalType: string): string[] {
    const vizMap: Record<string, string[]> = {
      'identifier': ['Table', 'Count Summary'],
      'personal_name': ['Word Cloud', 'Frequency Chart'],
      'email': ['Domain Analysis', 'Count by Provider'],
      'phone': ['Area Code Analysis', 'Geographic Distribution'],
      'address': ['Geographic Map', 'Regional Distribution'],
      'date_time': ['Time Series', 'Calendar Heatmap', 'Trend Line'],
      'currency': ['Histogram', 'Box Plot', 'Trend Analysis', 'Distribution'],
      'percentage': ['Gauge Chart', 'Bar Chart', 'Histogram'],
      'category': ['Pie Chart', 'Bar Chart', 'Treemap'],
      'quantity': ['Histogram', 'Box Plot', 'Scatter Plot'],
      'coordinates': ['Geographic Map', 'Scatter Plot'],
      'url': ['Domain Analysis', 'Link Count'],
      'description': ['Word Cloud', 'Text Length Distribution']
    };
    
    let suggestions = vizMap[semanticType] || ['Table', 'Basic Chart'];
    
    // Add type-specific suggestions
    if (originalType === 'integer' || originalType === 'float') {
      suggestions.push('Statistical Summary');
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Check semantic analysis status
   */
  static async getAnalysisStatus(datasetId: number, userId: number): Promise<string> {
    try {
      const query = `
        SELECT analysis_status 
        FROM semantic_analysis 
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
}