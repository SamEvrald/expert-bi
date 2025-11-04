import { CSVParserService, ParsedCSVData } from './CSVParserService';
import { S3StorageService } from './S3StorageService';

export interface ColumnProfile {
  name: string;
  dataType: string;
  nullCount: number;
  uniqueCount: number;
  completeness: number;
  sampleValues: any[];
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
  };
}

export interface DatasetProfile {
  datasetId: number;
  datasetName: string;
  totalRows: number;
  totalColumns: number;
  fileSize: number;
  columns: ColumnProfile[];
  dataQuality: {
    score: number;
    completeness: number;
    uniqueness: number;
    missingValues: number;
    duplicates: number;
  };
  summary: {
    numericalColumns: number;
    categoricalColumns: number;
    dateColumns: number;
    booleanColumns: number;
  };
}

export class DataProfilingService {
  /**
   * Profile dataset from file path
   */
  static async profileDataset(
    filePath: string, 
    datasetId: number, 
    datasetName: string,
    userId: number
  ): Promise<DatasetProfile> {
    try {
      // Parse CSV
      const parsedData = await CSVParserService.parseCSVFile(filePath);
      
      // Upload to S3
      const s3Key = await S3StorageService.uploadFile(filePath, datasetName, userId);
      
      // Generate profile
      const profile = await this.generateProfile(parsedData, datasetId, datasetName);
      
      return profile;
    } catch (error) {
      console.error('Dataset profiling error:', error);
      throw new Error('Failed to profile dataset');
    }
  }

  /**
   * Profile dataset from S3
   */
  static async profileDatasetFromS3(
    s3Key: string,
    datasetId: number,
    datasetName: string
  ): Promise<DatasetProfile> {
    try {
      // Download from S3
      const buffer = await S3StorageService.downloadFile(s3Key);
      
      // Parse CSV
      const parsedData = await CSVParserService.parseCSVBuffer(buffer);
      
      // Generate profile
      const profile = await this.generateProfile(parsedData, datasetId, datasetName);
      
      return profile;
    } catch (error) {
      console.error('S3 dataset profiling error:', error);
      throw new Error('Failed to profile dataset from S3');
    }
  }

  /**
   * Generate comprehensive dataset profile
   */
  private static async generateProfile(
    parsedData: ParsedCSVData,
    datasetId: number,
    datasetName: string
  ): Promise<DatasetProfile> {
    const { headers, rows, totalRows, sampleData } = parsedData;
    
    // Detect data types
    const dataTypes = CSVParserService.detectDataTypes(sampleData, headers);
    
    // Profile each column
    const columnProfiles: ColumnProfile[] = await Promise.all(
      headers.map(async (header) => await this.profileColumn(header, sampleData, dataTypes[header], totalRows))
    );

    // Calculate data quality metrics (simplified version)
    const dataQuality = this.calculateDataQuality(columnProfiles, totalRows);
    
    // Generate summary statistics
    const summary = this.generateSummary(columnProfiles);

    return {
      datasetId,
      datasetName,
      totalRows,
      totalColumns: headers.length,
      fileSize: 0, // Will be calculated separately
      columns: columnProfiles,
      dataQuality,
      summary
    };
  }

  /**
   * Profile individual column
   */
  private static async profileColumn(
    columnName: string,
    data: any[],
    dataType: string,
    totalRows: number
  ): Promise<ColumnProfile> {
    const values = data.map(row => row[columnName]).filter(val => val !== null && val !== undefined && val !== '');
    const nullCount = totalRows - values.length;
    const uniqueValues = [...new Set(values)];
    const uniqueCount = uniqueValues.length;
    const completeness = ((totalRows - nullCount) / totalRows) * 100;
    
    // Get sample values (up to 10)
    const sampleValues = uniqueValues.slice(0, 10);

    let statistics = {};
    
    // Calculate statistics for numerical columns
    if (dataType === 'integer' || dataType === 'float') {
      const numericValues = values.map(val => Number(val)).filter(val => !isNaN(val));
      if (numericValues.length > 0) {
        statistics = this.calculateBasicStatistics(numericValues);
      }
    }

    return {
      name: columnName,
      dataType,
      nullCount,
      uniqueCount,
      completeness,
      sampleValues,
      statistics: Object.keys(statistics).length > 0 ? statistics : undefined
    };
  }

  /**
   * Calculate basic statistics for numerical data
   */
  private static calculateBasicStatistics(values: number[]) {
    if (values.length === 0) return {};

    const sortedValues = [...values].sort((a, b) => a - b);
    const n = values.length;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    
    const median = n % 2 === 0 
      ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2
      : sortedValues[Math.floor(n / 2)];

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return { min, max, mean, median, stdDev };
  }

  /**
   * Calculate data quality metrics (simplified)
   */
  private static calculateDataQuality(columns: ColumnProfile[], totalRows: number) {
    const totalCells = columns.length * totalRows;
    const totalMissingValues = columns.reduce((sum, col) => sum + col.nullCount, 0);
    const completeness = ((totalCells - totalMissingValues) / totalCells) * 100;

    const uniquenessScores = columns.map(col => {
      const nonNullValues = totalRows - col.nullCount;
      return nonNullValues > 0 ? (col.uniqueCount / nonNullValues) * 100 : 0;
    });
    const uniqueness = uniquenessScores.reduce((sum, score) => sum + score, 0) / columns.length;

    const estimatedDuplicates = columns.reduce((sum, col) => {
      const nonNullValues = totalRows - col.nullCount;
      const duplicates = Math.max(0, nonNullValues - col.uniqueCount);
      return sum + duplicates;
    }, 0);

    const score = (completeness * 0.4 + Math.min(uniqueness, 100) * 0.3 + Math.max(0, (1 - (totalMissingValues + estimatedDuplicates) / totalCells) * 100) * 0.3);

    return {
      score: Math.round(score * 100) / 100,
      completeness,
      uniqueness,
      missingValues: totalMissingValues,
      duplicates: estimatedDuplicates
    };
  }

  /**
   * Generate dataset summary
   */
  private static generateSummary(columns: ColumnProfile[]) {
    const summary = {
      numericalColumns: 0,
      categoricalColumns: 0,
      dateColumns: 0,
      booleanColumns: 0
    };

    columns.forEach(col => {
      switch (col.dataType) {
        case 'integer':
        case 'float':
          summary.numericalColumns++;
          break;
        case 'date':
          summary.dateColumns++;
          break;
        case 'boolean':
          summary.booleanColumns++;
          break;
        default:
          summary.categoricalColumns++;
      }
    });

    return summary;
  }
}