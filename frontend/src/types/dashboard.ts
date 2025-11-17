import { Dataset, Insight } from './api.types';

export interface DashboardStats {
  totalDatasets: number;
  totalRows: number;
  totalColumns: number;
  totalSize: number;
  recentUploads: number;
  analyzedDatasets: number;
  totalInsights: number;
  avgConfidence: number;
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'analysis' | 'insight' | 'export' | 'delete' | 'chart';
  title: string;
  description: string;
  timestamp: string;
  datasetId?: number;
  datasetName?: string;
  icon?: string;
  color?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  action: () => void;
}

export type SortOption = 'name' | 'date' | 'size' | 'rows';
export type ViewMode = 'grid' | 'list' | 'compact';
export type FilterOption = 'all' | 'analyzed' | 'unanalyzed' | 'recent';