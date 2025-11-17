import { DataTypeInfo, DataTypeCategory, TypeDetectionStats } from '../types/typeDetection';
import { ColumnType } from '../types/api.types';

export const DATA_TYPE_INFO: Record<string, DataTypeInfo> = {
  numeric: {
    type: 'numeric',
    category: 'numeric',
    icon: '🔢',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    description: 'Numerical values (integers, floats)',
  },
  categorical: {
    type: 'categorical',
    category: 'categorical',
    icon: '📊',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    description: 'Discrete categories or labels',
  },
  date: {
    type: 'date',
    category: 'temporal',
    icon: '📅',
    color: '#10b981',
    bgColor: '#d1fae5',
    description: 'Date values (YYYY-MM-DD)',
  },
  datetime: {
    type: 'datetime',
    category: 'temporal',
    icon: '🕐',
    color: '#059669',
    bgColor: '#d1fae5',
    description: 'Date and time values',
  },
  time: {
    type: 'time',
    category: 'temporal',
    icon: '⏰',
    color: '#14b8a6',
    bgColor: '#ccfbf1',
    description: 'Time values (HH:MM:SS)',
  },
  boolean: {
    type: 'boolean',
    category: 'categorical',
    icon: '✓',
    color: '#6366f1',
    bgColor: '#e0e7ff',
    description: 'True/False, Yes/No values',
  },
  currency: {
    type: 'currency',
    category: 'numeric',
    icon: '💰',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    description: 'Monetary values with currency symbols',
  },
  percentage: {
    type: 'percentage',
    category: 'numeric',
    icon: '📈',
    color: '#ec4899',
    bgColor: '#fce7f3',
    description: 'Percentage values',
  },
  email: {
    type: 'email',
    category: 'identifier',
    icon: '📧',
    color: '#6366f1',
    bgColor: '#e0e7ff',
    description: 'Email addresses',
  },
  url: {
    type: 'url',
    category: 'identifier',
    icon: '🔗',
    color: '#0ea5e9',
    bgColor: '#e0f2fe',
    description: 'Web URLs',
  },
  phone: {
    type: 'phone',
    category: 'identifier',
    icon: '📱',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    description: 'Phone numbers',
  },
  zip_code: {
    type: 'zip_code',
    category: 'identifier',
    icon: '📮',
    color: '#a855f7',
    bgColor: '#f3e8ff',
    description: 'Postal/ZIP codes',
  },
  ip_address: {
    type: 'ip_address',
    category: 'identifier',
    icon: '🌐',
    color: '#06b6d4',
    bgColor: '#cffafe',
    description: 'IP addresses',
  },
  uuid: {
    type: 'uuid',
    category: 'identifier',
    icon: '🆔',
    color: '#64748b',
    bgColor: '#f1f5f9',
    description: 'Unique identifiers (UUIDs)',
  },
  json: {
    type: 'json',
    category: 'special',
    icon: '{ }',
    color: '#eab308',
    bgColor: '#fef9c3',
    description: 'JSON formatted data',
  },
  latitude: {
    type: 'latitude',
    category: 'geospatial',
    icon: '🌍',
    color: '#22c55e',
    bgColor: '#dcfce7',
    description: 'Latitude coordinates',
  },
  longitude: {
    type: 'longitude',
    category: 'geospatial',
    icon: '🗺️',
    color: '#16a34a',
    bgColor: '#dcfce7',
    description: 'Longitude coordinates',
  },
  text: {
    type: 'text',
    category: 'other',
    icon: '📝',
    color: '#64748b',
    bgColor: '#f1f5f9',
    description: 'Free-form text',
  },
  empty: {
    type: 'empty',
    category: 'other',
    icon: '∅',
    color: '#9ca3af',
    bgColor: '#f3f4f6',
    description: 'Empty or null values',
  },
  mixed: {
    type: 'mixed',
    category: 'other',
    icon: '🔀',
    color: '#ef4444',
    bgColor: '#fee2e2',
    description: 'Mixed data types',
  },
  unknown: {
    type: 'unknown',
    category: 'other',
    icon: '❓',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    description: 'Unknown type',
  },
};

export function getTypeInfo(type: string): DataTypeInfo {
  return DATA_TYPE_INFO[type] || DATA_TYPE_INFO.unknown;
}

export function getConfidenceLevel(confidence: number): {
  level: 'high' | 'medium' | 'low';
  color: string;
  label: string;
} {
  if (confidence >= 0.8) {
    return { level: 'high', color: '#10b981', label: 'High Confidence' };
  } else if (confidence >= 0.5) {
    return { level: 'medium', color: '#f59e0b', label: 'Medium Confidence' };
  } else {
    return { level: 'low', color: '#ef4444', label: 'Low Confidence' };
  }
}

export function calculateTypeDetectionStats(
  columnTypes: Record<string, ColumnType>
): TypeDetectionStats {
  const stats: TypeDetectionStats = {
    totalColumns: Object.keys(columnTypes).length,
    detectedTypes: {
      numeric: 0,
      categorical: 0,
      date: 0,
      datetime: 0,
      time: 0,
      boolean: 0,
      currency: 0,
      percentage: 0,
      email: 0,
      url: 0,
      phone: 0,
      zip_code: 0,
      ip_address: 0,
      uuid: 0,
      json: 0,
      latitude: 0,
      longitude: 0,
      text: 0,
      empty: 0,
      mixed: 0,
      unknown: 0,
    },
    averageConfidence: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
  };

  let totalConfidence = 0;

  Object.values(columnTypes).forEach((col) => {
    const type = col.detected_type;
    if (type in stats.detectedTypes) {
      (stats.detectedTypes as any)[type]++;
    }

    totalConfidence += col.confidence;

    if (col.confidence >= 0.8) {
      stats.highConfidence++;
    } else if (col.confidence >= 0.5) {
      stats.mediumConfidence++;
    } else {
      stats.lowConfidence++;
    }
  });

  stats.averageConfidence = stats.totalColumns > 0 ? totalConfidence / stats.totalColumns : 0;

  return stats;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}