import { ColumnProfile } from './DataProfilingService';

export interface DataQualityMetrics {
  score: number;
  completeness: number;
  uniqueness: number;
  missingValues: number;
  duplicates: number;
}

export class DataQualityService {
  /**
   * Calculate overall data quality metrics
   */
  static calculateDataQuality(columns: ColumnProfile[], totalRows: number): DataQualityMetrics {
    // Calculate completeness (percentage of non-null values)
    const totalCells = columns.length * totalRows;
    const totalMissingValues = columns.reduce((sum, col) => sum + col.nullCount, 0);
    const completeness = ((totalCells - totalMissingValues) / totalCells) * 100;

    // Calculate uniqueness (average percentage of unique values per column)
    const uniquenessScores = columns.map(col => {
      const nonNullValues = totalRows - col.nullCount;
      return nonNullValues > 0 ? (col.uniqueCount / nonNullValues) * 100 : 0;
    });
    const uniqueness = uniquenessScores.reduce((sum, score) => sum + score, 0) / columns.length;

    // Calculate estimated duplicates (simplified approach)
    const estimatedDuplicates = columns.reduce((sum, col) => {
      const nonNullValues = totalRows - col.nullCount;
      const duplicates = Math.max(0, nonNullValues - col.uniqueCount);
      return sum + duplicates;
    }, 0);

    // Calculate overall quality score
    const score = this.calculateQualityScore(completeness, uniqueness, totalMissingValues, estimatedDuplicates, totalCells);

    return {
      score,
      completeness,
      uniqueness,
      missingValues: totalMissingValues,
      duplicates: estimatedDuplicates
    };
  }

  /**
   * Calculate overall quality score (0-100)
   */
  private static calculateQualityScore(
    completeness: number,
    uniqueness: number,
    missingValues: number,
    duplicates: number,
    totalCells: number
  ): number {
    // Weighted scoring system
    const completenessWeight = 0.4;
    const uniquenessWeight = 0.3;
    const consistencyWeight = 0.3;

    // Normalize uniqueness (cap at 100%)
    const normalizedUniqueness = Math.min(uniqueness, 100);

    // Calculate consistency score (inverse of missing values and duplicates ratio)
    const inconsistencyRatio = (missingValues + duplicates) / totalCells;
    const consistencyScore = Math.max(0, (1 - inconsistencyRatio) * 100);

    // Calculate weighted score
    const score = (
      completeness * completenessWeight +
      normalizedUniqueness * uniquenessWeight +
      consistencyScore * consistencyWeight
    );

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get quality assessment text
   */
  static getQualityAssessment(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Identify data quality issues
   */
  static identifyIssues(columns: ColumnProfile[], totalRows: number): string[] {
    const issues: string[] = [];

    columns.forEach(col => {
      // High missing values
      if (col.completeness < 50) {
        issues.push(`Column '${col.name}' has high missing values (${col.completeness.toFixed(1)}% complete)`);
      }

      // Low uniqueness for expected unique columns
      if (col.uniqueCount === 1 && col.nullCount < totalRows) {
        issues.push(`Column '${col.name}' has constant values`);
      }

      // Potential data type issues
      if (col.dataType === 'string' && col.name.toLowerCase().includes('date')) {
        issues.push(`Column '${col.name}' might be a date but detected as string`);
      }

      if (col.dataType === 'string' && col.name.toLowerCase().includes('id') && col.uniqueCount === totalRows - col.nullCount) {
        issues.push(`Column '${col.name}' might be an identifier but detected as string`);
      }
    });

    return issues;
  }
}