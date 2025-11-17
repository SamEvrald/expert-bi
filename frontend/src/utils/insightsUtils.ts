import { InsightType, InsightCategory, Insight } from '../types/api.types';
import { InsightFilter } from '../types/insights';

// Category Information
export interface CategoryInfo {
  category: InsightCategory;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

// Type Information
export interface TypeInfo {
  type: InsightType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

// Importance Level Information
export interface ImportanceInfo {
  level: 'low' | 'medium' | 'high' | 'critical';
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

// Category Configuration
export const CATEGORY_INFO: Record<InsightCategory, CategoryInfo> = {
  statistical: {
    category: 'statistical',
    label: 'Statistical',
    icon: '📊',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    description: 'Statistical analysis and metrics',
  },
  temporal: {
    category: 'temporal',
    label: 'Temporal',
    icon: '📅',
    color: '#10b981',
    bgColor: '#d1fae5',
    description: 'Time-based patterns and trends',
  },
  categorical: {
    category: 'categorical',
    label: 'Categorical',
    icon: '🏷️',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    description: 'Category distribution and analysis',
  },
  quality: {
    category: 'quality',
    label: 'Quality',
    icon: '✅',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    description: 'Data quality issues and checks',
  },
  performance: {
    category: 'performance',
    label: 'Performance',
    icon: '⚡',
    color: '#06b6d4',
    bgColor: '#cffafe',
    description: 'Performance metrics and optimization',
  },
  business: {
    category: 'business',
    label: 'Business',
    icon: '💼',
    color: '#ec4899',
    bgColor: '#fce7f3',
    description: 'Business intelligence and insights',
  },
};

// Type Configuration
export const TYPE_INFO: Record<InsightType, TypeInfo> = {
  trend: {
    type: 'trend',
    label: 'Trend',
    icon: '📈',
    color: '#10b981',
    bgColor: '#d1fae5',
    description: 'Upward or downward trends in data',
  },
  outlier: {
    type: 'outlier',
    label: 'Outlier',
    icon: '⚠️',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    description: 'Unusual data points',
  },
  correlation: {
    type: 'correlation',
    label: 'Correlation',
    icon: '🔗',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    description: 'Relationships between variables',
  },
  distribution: {
    type: 'distribution',
    label: 'Distribution',
    icon: '📊',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    description: 'Data distribution patterns',
  },
  seasonality: {
    type: 'seasonality',
    label: 'Seasonality',
    icon: '🔄',
    color: '#06b6d4',
    bgColor: '#cffafe',
    description: 'Recurring patterns over time',
  },
  anomaly: {
    type: 'anomaly',
    label: 'Anomaly',
    icon: '🚨',
    color: '#ef4444',
    bgColor: '#fee2e2',
    description: 'Unexpected data behavior',
  },
  pattern: {
    type: 'pattern',
    label: 'Pattern',
    icon: '🎯',
    color: '#6366f1',
    bgColor: '#e0e7ff',
    description: 'Recurring data patterns',
  },
  summary: {
    type: 'summary',
    label: 'Summary',
    icon: 'ℹ️',
    color: '#64748b',
    bgColor: '#f1f5f9',
    description: 'Overview and summary statistics',
  },
  recommendation: {
    type: 'recommendation',
    label: 'Recommendation',
    icon: '💡',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    description: 'Actionable recommendations',
  },
};

// Helper functions
export function getCategoryInfo(category: InsightCategory): CategoryInfo {
  return CATEGORY_INFO[category];
}

export function getTypeInfo(type: InsightType): TypeInfo {
  return TYPE_INFO[type];
}

export function getImportanceLevel(importance: number): ImportanceInfo {
  if (importance >= 0.8) {
    return {
      level: 'critical',
      label: 'Critical',
      color: '#dc2626',
      bgColor: '#fee2e2',
      icon: '🔴',
    };
  } else if (importance >= 0.6) {
    return {
      level: 'high',
      label: 'High',
      color: '#ea580c',
      bgColor: '#ffedd5',
      icon: '🟠',
    };
  } else if (importance >= 0.4) {
    return {
      level: 'medium',
      label: 'Medium',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      icon: '🟡',
    };
  } else {
    return {
      level: 'low',
      label: 'Low',
      color: '#64748b',
      bgColor: '#f1f5f9',
      icon: '⚪',
    };
  }
}

export function filterInsights(insights: Insight[], filter: InsightFilter): Insight[] {
  let filtered = [...insights];

  // Filter by categories
  if (filter.categories.length > 0) {
    filtered = filtered.filter((insight) =>
      filter.categories.includes(insight.category)
    );
  }

  // Filter by types
  if (filter.types.length > 0) {
    filtered = filtered.filter((insight) => filter.types.includes(insight.type));
  }

  // Filter by confidence range
  filtered = filtered.filter(
    (insight) =>
      insight.confidence >= filter.minConfidence &&
      insight.confidence <= filter.maxConfidence
  );

  // Filter by search term
  if (filter.searchTerm) {
    const searchLower = filter.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (insight) =>
        insight.title.toLowerCase().includes(searchLower) ||
        insight.description.toLowerCase().includes(searchLower) ||
        insight.column_name?.toLowerCase().includes(searchLower)
    );
  }

  // Filter by columns
  if (filter.columns.length > 0) {
    filtered = filtered.filter((insight) => {
      if (!insight.column_name) return false;
      return filter.columns.includes(insight.column_name);
    });
  }

  return filtered;
}

export function sortInsights(
  insights: Insight[],
  sortBy: 'confidence' | 'importance' | 'date' | 'category' | 'type',
  sortOrder: 'asc' | 'desc' = 'desc'
): Insight[] {
  const sorted = [...insights];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'confidence':
        comparison = a.confidence - b.confidence;
        break;
      case 'importance':
        comparison = (a.importance || 0) - (b.importance || 0);
        break;
      case 'date':
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function calculateInsightStats(insights: Insight[]) {
  const byCategory: Record<InsightCategory, number> = {
    statistical: 0,
    temporal: 0,
    categorical: 0,
    quality: 0,
    performance: 0,
    business: 0,
  };

  const byType: Record<InsightType, number> = {
    trend: 0,
    outlier: 0,
    correlation: 0,
    distribution: 0,
    seasonality: 0,
    anomaly: 0,
    pattern: 0,
    summary: 0,
    recommendation: 0,
  };

  let totalConfidence = 0;
  let totalImportance = 0;

  insights.forEach((insight) => {
    byCategory[insight.category] = (byCategory[insight.category] || 0) + 1;
    byType[insight.type] = (byType[insight.type] || 0) + 1;
    totalConfidence += insight.confidence;
    totalImportance += insight.importance || 0;
  });

  return {
    total: insights.length,
    byCategory,
    byType,
    avgConfidence: insights.length > 0 ? totalConfidence / insights.length : 0,
    avgImportance: insights.length > 0 ? totalImportance / insights.length : 0,
  };
}

export function getInsightIcon(type: InsightType): string {
  return TYPE_INFO[type]?.icon || '📊';
}

export function getInsightColor(type: InsightType): string {
  return TYPE_INFO[type]?.color || '#3b82f6';
}

export function getCategoryColor(category: InsightCategory): string {
  return CATEGORY_INFO[category]?.color || '#3b82f6';
}

export function formatInsightMetadata(metadata: Record<string, any>): string {
  const entries = Object.entries(metadata)
    .filter(([key]) => !['visualization'].includes(key))
    .map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ');
      const formattedValue =
        typeof value === 'number' ? value.toFixed(2) : String(value);
      return `${formattedKey}: ${formattedValue}`;
    });

  return entries.join(' | ');
}

// Group insights by category
export function groupInsightsByCategory(insights: Insight[]): Record<InsightCategory, Insight[]> {
  const grouped: Record<InsightCategory, Insight[]> = {
    statistical: [],
    temporal: [],
    categorical: [],
    quality: [],
    performance: [],
    business: [],
  };

  insights.forEach((insight) => {
    grouped[insight.category].push(insight);
  });

  return grouped;
}

// Group insights by type
export function groupInsightsByType(insights: Insight[]): Record<InsightType, Insight[]> {
  const grouped: Record<InsightType, Insight[]> = {
    trend: [],
    outlier: [],
    correlation: [],
    distribution: [],
    seasonality: [],
    anomaly: [],
    pattern: [],
    summary: [],
    recommendation: [],
  };

  insights.forEach((insight) => {
    grouped[insight.type].push(insight);
  });

  return grouped;
}

// Get top insights by importance
export function getTopInsights(insights: Insight[], count: number = 5): Insight[] {
  return [...insights]
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, count);
}

// Get insights by column
export function getInsightsByColumn(insights: Insight[], columnName: string): Insight[] {
  return insights.filter(
    (insight) =>
      insight.column_name === columnName ||
      insight.related_columns?.includes(columnName)
  );
}