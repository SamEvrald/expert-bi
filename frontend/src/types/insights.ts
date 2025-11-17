import { InsightCategory, InsightType } from './api.types';

export interface InsightFilter {
  categories: InsightCategory[];
  types: InsightType[];
  minConfidence: number;
  maxConfidence: number;
  searchTerm: string;
  columns: string[];
}

export interface InsightSort {
  field: 'confidence' | 'importance' | 'created_at' | 'type' | 'category';
  direction: 'asc' | 'desc';
}

export interface InsightStats {
  total: number;
  byCategory: Record<InsightCategory, number>;
  byType: Record<InsightType, number>;
  avgConfidence: number;
  avgImportance: number;
}

export const DEFAULT_INSIGHT_FILTER: InsightFilter = {
  categories: [],
  types: [],
  minConfidence: 0,
  maxConfidence: 1,
  searchTerm: '',
  columns: [],
};

export interface InsightCategoryInfo {
  category: InsightCategory;
  icon: string;
  color: string;
  bgColor: string;
  label: string;
  description: string;
}

export interface InsightTypeInfo {
  type: InsightType;
  icon: string;
  color: string;
  label: string;
  description: string;
}