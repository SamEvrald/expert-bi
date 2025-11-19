// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================
// Authentication Types
// ============================================

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    id: number;
    email: string;
    name: string;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// ============================================
// Dataset Types
// ============================================

// Data Types
export type DataType = 
  | 'numeric' 
  | 'categorical' 
  | 'datetime' 
  | 'boolean' 
  | 'text' 
  | 'currency' 
  | 'percentage'
  | 'date'
  | 'integer'
  | 'float'
  | 'string';

export interface Dataset {
  id: number;
  name: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  row_count: number;
  column_count: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ColumnType {
  detected_type: 'number' | 'text' | 'boolean' | 'datetime';
  pandas_dtype: string;
  null_count: number;
  unique_count: number;
}

// Data Preview
export interface DataPreview {
  columns: string[];
  rows: Record<string, any>[];
  total_rows: number;
  displayed_rows: number;
}

// Insights Types
// ============================================

export type InsightCategory =
  | 'statistical'
  | 'temporal'
  | 'categorical'
  | 'quality'
  | 'performance'
  | 'business';

export type InsightType =
  | 'trend'
  | 'outlier'
  | 'correlation'
  | 'distribution'
  | 'seasonality'
  | 'anomaly'
  | 'pattern'
  | 'summary'
  | 'recommendation';

export interface Insight {
  id: number;
  type: string;
  category?: string;
  title: string;
  description: string;
  confidence: number;
  importance?: number;
  column_name?: string;
  related_columns?: string[];
  metadata?: {
    value?: any;
    trend?: 'increasing' | 'decreasing' | 'stable';
    correlation_value?: number;
    outlier_indices?: number[];
    pattern_type?: string;
    visualization?: any;
    [key: string]: any;
  };
  created_at: string;
}

// ============================================
// Chart Types
// ============================================

export type ChartType =
  | 'line'
  | 'bar'
  | 'scatter'
  | 'histogram'
  | 'box'
  | 'pie'
  | 'heatmap'
  | 'area'
  | 'funnel'
  | 'gauge';

export interface ChartSuggestion {
  chart_type: ChartType;
  priority: number;
  confidence: number;
  reason: string;
  description: string;
  config: ChartConfig;
  preview_data?: any;
}

export interface ChartConfig {
  x_axis?: string;
  y_axis?: string | string[];
  color?: string;
  size?: string;
  group_by?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  options?: Record<string, any>;
}

export interface ChartSuggestionRequest {
  dataset_id: number;
  x_axis?: string;
  y_axis?: string;
  columns?: string[];
  analysis_type?: 'exploratory' | 'comparative' | 'temporal' | 'distribution';
}

// ============================================
// Analysis Types
// ============================================

export interface ComprehensiveAnalysis {
  dataset_id: number;
  summary: DatasetSummary;
  column_analysis: Record<string, ColumnAnalysis>;
  correlations?: CorrelationMatrix;
  quality_report?: DataQualityReport;
  recommendations?: Recommendation[];
  generated_at: string;
}

export interface DatasetSummary {
  total_rows: number;
  total_columns: number;
  memory_usage: number;
  numeric_columns: number;
  categorical_columns: number;
  date_columns: number;
  missing_values_total: number;
  duplicate_rows: number;
}

export interface ColumnAnalysis {
  column_name: string;
  data_type: DataType;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  unique_percentage: number;
  mean?: number;
  median?: number;
  mode?: string | number;
  std?: number;
  min?: string | number;
  max?: string | number;
  q1?: number;
  q3?: number;
  distribution?: Record<string, number>;
  sample_values: Array<string | number | null>;
  detected_patterns?: string[];
  quality_issues?: string[];
}

export interface CorrelationMatrix {
  columns: string[];
  matrix: number[][];
  significant_correlations: Array<{
    column1: string;
    column2: string;
    correlation: number;
    p_value?: number;
  }>;
}

export interface DataQualityReport {
  quality_score: number;
  issues: DataQualityIssue[];
  recommendations: string[];
  summary: {
    total_issues: number;
    high_severity: number;
    medium_severity: number;
    low_severity: number;
  };
}

export interface DataQualityIssue {
  type: string;
  column: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  description?: string;
}

export interface Recommendation {
  type: 'data_quality' | 'analysis' | 'visualization' | 'preprocessing';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action?: string;
  benefit?: string;
}

// Dataset Analysis Response
export interface DatasetAnalysis {
  dataset_id: number;
  row_count: number;
  column_count: number;
  columns: ColumnAnalysis[];
  summary?: {
    totalRows: number;
    totalColumns: number;
    fileSize: number;
    status: string;
    dataQuality?: string;
  };
  insights?: Array<{
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    description: string;
  }>;
  statistics?: {
    numerical: Record<string, {
      mean: number;
      median: number;
      std: number;
      min: number;
      max: number;
      count: number;
    }>;
    categorical: Record<string, Record<string, number>>;
  };
  chartData?: {
    rowDistribution: Array<{ name: string; value: number }>;
    columnTypes?: Array<{ name: string; value: number }>;
    dataQuality?: Array<{ name: string; completeness: number; missing: number }>;
    topCategories?: Record<string, Array<{ name: string; value: number }>>;
  };
  preview?: Array<Record<string, unknown>>;
  dataQuality?: {
    score: string;
    completeness: number;
    uniqueness: number;
    missingValues: number;
    duplicates: number;
    totalCells: number;
  };
}

// ============================================
// Error Types
// ============================================

export interface ApiError {
  error: string;
  message?: string;
  code?: string;
  details?: any;
  timestamp?: string;
}

export class ApiException extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// ============================================
// Data Cleaning Types
// ============================================

export interface CleaningOperation {
  column: string;
  operation: 'fill' | 'drop' | 'replace' | 'transform';
  value?: string | number;
  method?: string;
}

export interface CleaningRequest {
  remove_duplicates?: boolean;
  handle_missing?: 'drop' | 'fill_mean' | 'fill_median' | 'fill_mode';
  remove_outliers?: boolean;
  standardize_columns?: boolean;
  trim_whitespace?: boolean;
  column_operations?: CleaningOperation[];
}

export interface CleaningResult {
  cleaned_rows: number;
  message: string;
  changes: {
    duplicates_removed?: number;
    missing_handled?: number;
    outliers_removed?: number;
    columns_standardized?: number;
  };
}