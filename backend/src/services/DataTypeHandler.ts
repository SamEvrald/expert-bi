import { PythonBridge } from './PythonBridge';

export interface ColumnType {
  detected_type: string;
  original_dtype: string;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  unique_percentage: number;
  sample_values: string[];
  metadata: Record<string, unknown>;
  statistics?: Record<string, number>;
  date_range?: Record<string, string>;
  categories?: Array<{ value: string; count: number; percentage: number }>;
}

export interface TypeDetectionResult {
  dataset_id: number;
  total_columns: number;
  columns: Record<string, ColumnType>;
  summary: {
    type_distribution: Record<string, number>;
    total_columns: number;
    has_dates: boolean;
    has_geo: boolean;
    has_sensitive: boolean;
  };
}

export class DataTypeHandler {
  /**
   * Detect types for all columns in a dataset
   */
  static async detectTypes(datasetPath: string, datasetId: number): Promise<TypeDetectionResult | null> {
    const result = await PythonBridge.executePython('type_detector.py', [
      datasetPath,
      String(datasetId)
    ]);

    if (!result.success) {
      console.error('Type detection failed:', result.error);
      return null;
    }

    return result.data as TypeDetectionResult;
  }

  /**
   * Convert value based on detected type
   */
  static convertValue(value: string, columnType: ColumnType): unknown {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const type = columnType.detected_type;

    try {
      switch (type) {
        case 'numeric':
        case 'currency':
        case 'percentage':
        case 'latitude':
        case 'longitude':
          return this.parseNumeric(value, type);

        case 'date':
        case 'datetime':
          return this.parseDate(value);

        case 'boolean':
          return this.parseBoolean(value);

        case 'integer':
          return parseInt(value, 10);

        case 'email':
        case 'url':
        case 'phone':
        case 'ip_address':
        case 'uuid':
        case 'zip_code':
          return value.trim();

        case 'categorical':
        case 'text':
        default:
          return String(value);
      }
    } catch (error) {
      console.warn(`Failed to convert value "${value}" to type "${type}":`, error);
      return value;
    }
  }

  /**
   * Parse numeric values with currency/percentage handling
   */
  private static parseNumeric(value: string, type: string): number | null {
    if (typeof value === 'number') return value;

    let cleaned = String(value).trim();

    // Remove currency symbols
    if (type === 'currency') {
      cleaned = cleaned.replace(/[$£€¥,]/g, '');
    }

    // Remove percentage symbol
    if (type === 'percentage') {
      cleaned = cleaned.replace(/%/g, '');
    }

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parse date values
   */
  private static parseDate(value: string): Date | null {
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  /**
   * Parse boolean values
   */
  private static parseBoolean(value: string): boolean | null {
    const normalized = String(value).toLowerCase().trim();

    const trueValues = ['true', 'yes', 'y', '1', 't', 'on', 'active', 'enabled'];
    const falseValues = ['false', 'no', 'n', '0', 'f', 'off', 'inactive', 'disabled'];

    if (trueValues.includes(normalized)) return true;
    if (falseValues.includes(normalized)) return false;

    return null;
  }

  /**
   * Get appropriate SQL aggregation based on column type
   */
  static getAggregationForType(columnType: ColumnType, requestedAgg: string): string {
    const type = columnType.detected_type;

    // Numeric types support all aggregations
    const numericTypes = ['numeric', 'currency', 'percentage', 'integer', 'latitude', 'longitude'];
    if (numericTypes.includes(type)) {
      return requestedAgg || 'sum';
    }

    // Date types support count and distinct
    if (type === 'date' || type === 'datetime') {
      return requestedAgg === 'count' ? 'count' : 'count';
    }

    // Categorical types support count
    if (type === 'categorical' || type === 'text' || type === 'boolean') {
      return 'count';
    }

    // Default to count for unknown types
    return 'count';
  }

  /**
   * Generate SQL query with proper type handling
   */
  static buildTypedQuery(
    tableName: string,
    xAxis: string,
    yAxis: string,
    aggregation: string,
    columnTypes: Record<string, ColumnType>,
    filters?: Record<string, unknown>
  ): string {
    const xType = columnTypes[xAxis];
    const yType = columnTypes[yAxis];

    // Determine actual aggregation based on y-axis type
    const actualAgg = this.getAggregationForType(yType, aggregation);

    // Build SELECT clause
    let selectClause = '';
    if (xType?.detected_type === 'date' || xType?.detected_type === 'datetime') {
      selectClause = `DATE(${xAxis}) as ${xAxis}`;
    } else {
      selectClause = xAxis;
    }

    // Build aggregation clause
    let aggClause = '';
    switch (actualAgg) {
      case 'sum':
        aggClause = `SUM(${yAxis})`;
        break;
      case 'avg':
        aggClause = `AVG(${yAxis})`;
        break;
      case 'count':
        aggClause = `COUNT(${yAxis})`;
        break;
      case 'min':
        aggClause = `MIN(${yAxis})`;
        break;
      case 'max':
        aggClause = `MAX(${yAxis})`;
        break;
      case 'median':
        aggClause = `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${yAxis})`;
        break;
      default:
        aggClause = `COUNT(${yAxis})`;
    }

    // Build WHERE clause
    let whereClause = '';
    if (filters && Object.keys(filters).length > 0) {
      const conditions: string[] = [];
      
      for (const [col, value] of Object.entries(filters)) {
        const colType = columnTypes[col];
        
        if (colType?.detected_type === 'numeric' || colType?.detected_type === 'currency') {
          conditions.push(`${col} = ${value}`);
        } else if (colType?.detected_type === 'date') {
          conditions.push(`DATE(${col}) = '${value}'`);
        } else {
          conditions.push(`${col} = '${value}'`);
        }
      }
      
      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }
    }

    return `
      SELECT ${selectClause}, ${aggClause} as value
      FROM ${tableName}
      ${whereClause}
      GROUP BY ${selectClause}
      ORDER BY ${selectClause}
    `.trim();
  }

  /**
   * Format value for display based on type
   */
  static formatValue(value: unknown, columnType: ColumnType): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    const type = columnType.detected_type;

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value));

      case 'percentage':
        return `${Number(value).toFixed(2)}%`;

      case 'numeric':
        const num = Number(value);
        if (Number.isInteger(num)) {
          return num.toLocaleString();
        }
        return num.toFixed(2);

      case 'date':
        return new Date(value as string).toLocaleDateString();

      case 'datetime':
        return new Date(value as string).toLocaleString();

      case 'boolean':
        return value ? 'Yes' : 'No';

      default:
        return String(value);
    }
  }

  /**
   * Validate value against column type
   */
  static validateValue(value: unknown, columnType: ColumnType): { valid: boolean; error?: string } {
    const type = columnType.detected_type;

    try {
      switch (type) {
        case 'numeric':
        case 'currency':
        case 'percentage':
          if (isNaN(Number(value))) {
            return { valid: false, error: 'Must be a valid number' };
          }
          break;

        case 'date':
        case 'datetime':
          const date = new Date(value as string);
          if (isNaN(date.getTime())) {
            return { valid: false, error: 'Must be a valid date' };
          }
          break;

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            return { valid: false, error: 'Must be a valid email address' };
          }
          break;

        case 'url':
          try {
            new URL(String(value));
          } catch {
            return { valid: false, error: 'Must be a valid URL' };
          }
          break;

        case 'boolean':
          const boolValue = this.parseBoolean(String(value));
          if (boolValue === null) {
            return { valid: false, error: 'Must be a valid boolean value' };
          }
          break;
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Validation failed' };
    }
  }

  /**
   * Get suggested chart types based on column types
   */
  static suggestChartTypes(xType: ColumnType, yType: ColumnType): Array<{
    type: string;
    priority: number;
    reason: string;
  }> {
    const suggestions: Array<{ type: string; priority: number; reason: string }> = [];

    // Time series
    if ((xType.detected_type === 'date' || xType.detected_type === 'datetime') &&
        (yType.detected_type === 'numeric' || yType.detected_type === 'currency')) {
      suggestions.push({
        type: 'line',
        priority: 10,
        reason: 'Time series data - perfect for line charts'
      });
      suggestions.push({
        type: 'area',
        priority: 8,
        reason: 'Show cumulative trends over time'
      });
    }

    // Categorical vs Numeric
    if (xType.detected_type === 'categorical' &&
        (yType.detected_type === 'numeric' || yType.detected_type === 'currency')) {
      suggestions.push({
        type: 'bar',
        priority: 9,
        reason: 'Compare values across categories'
      });

      if (xType.metadata.cardinality && (xType.metadata.cardinality as number) <= 10) {
        suggestions.push({
          type: 'pie',
          priority: 7,
          reason: 'Show distribution with few categories'
        });
      }
    }

    // Numeric vs Numeric
    if ((xType.detected_type === 'numeric' || xType.detected_type === 'currency') &&
        (yType.detected_type === 'numeric' || yType.detected_type === 'currency')) {
      suggestions.push({
        type: 'scatter',
        priority: 8,
        reason: 'Analyze relationship between two numeric variables'
      });
    }

    // Geographic data
    if ((xType.detected_type === 'latitude' || xType.detected_type === 'longitude') &&
        (yType.detected_type === 'numeric' || yType.detected_type === 'currency')) {
      suggestions.push({
        type: 'map',
        priority: 9,
        reason: 'Geographic data detected'
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }
}