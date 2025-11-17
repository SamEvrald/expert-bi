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

export interface Dataset {
  id: number;
  name: string;
  description?: string;
  file_path: string;
  row_count: number;
  column_count: number;
  file_size: number;
  created_at: string;
  updated_at: string;
  status: 'processing' | 'ready' | 'error';
  error_message?: string;
}

export interface AnalysisStatus {
  type_detection: 'pending' | 'processing' | 'completed' | 'failed';
  insights: 'pending' | 'processing' | 'completed' | 'failed';
  last_analysis?: string;
}

export interface DatasetUploadRequest {
  file: File;
  name: string;
  description?: string;
}

export interface DatasetUploadProgress {
  progress: number;
  stage: 'uploading' | 'processing' | 'analyzing' | 'complete';
  message: string;
}

// ============================================
// Column Type Detection Types
// ============================================

export type DataType = 
  | 'numeric'
  | 'categorical'
  | 'datetime'
  | 'boolean'
  | 'text';

export interface ColumnType {
  column_name: string;
  detected_type: DataType;
  original_dtype: string;
  confidence: number;
  unique_count?: number;
  null_count?: number;
  null_percentage?: number;
  sample_values?: any[];
  patterns?: string[];
  statistics?: ColumnStatistics;
  metadata?: Record<string, any>;
}

export interface ColumnStatistics {
  mean?: number;
  median?: number;
  mode?: any;
  std?: number;
  min?: number | string;
  max?: number | string;
  q1?: number;
  q3?: number;
  skewness?: number;
  kurtosis?: number;
  variance?: number;
  count: number;
  null_count: number;
  unique_count: number;
  distribution?: Record<string, number>;
  percentiles?: Record<string, number>;
}

// ============================================
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
  dataset_id: number;
  category: InsightCategory;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  importance: number;
  column_name?: string;
  related_columns?: string[];
  metadata: Record<string, unknown>;
  visualization_config?: Record<string, unknown>;
  actionable: boolean;
  action_items?: string[];
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