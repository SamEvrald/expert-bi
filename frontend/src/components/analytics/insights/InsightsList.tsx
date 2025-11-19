import React, { useState, useMemo } from 'react';
import { Insight, InsightCategory, InsightType } from '../../../types/api.types';
import { Sparkles, Trash2, RefreshCw, TrendingUp, AlertTriangle, BarChart3, GitBranch } from 'lucide-react';

interface InsightFilter {
  categories: InsightCategory[];
  types: InsightType[];
  minConfidence: number;
  maxConfidence: number;
  searchTerm: string;
  columns: string[];
}

const filterInsights = (insights: Insight[], filter: InsightFilter): Insight[] => {
  return insights.filter((insight) => {
    if (filter.categories.length > 0 && !filter.categories.includes(insight.category as InsightCategory)) return false;
    if (filter.types.length > 0 && !filter.types.includes(insight.type as InsightType)) return false;
    if ((insight.confidence || 0) < filter.minConfidence) return false;
    if ((insight.confidence || 0) > filter.maxConfidence) return false;
    if (filter.searchTerm && !insight.title.toLowerCase().includes(filter.searchTerm.toLowerCase()) && 
        !insight.description.toLowerCase().includes(filter.searchTerm.toLowerCase())) return false;
    return true;
  });
};

const sortInsights = (insights: Insight[], sortBy: string, direction: 'asc' | 'desc'): Insight[] => {
  return [...insights].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'confidence':
        aValue = a.confidence || 0;
        bValue = b.confidence || 0;
        break;
      case 'importance':
        aValue = a.importance || 0;
        bValue = b.importance || 0;
        break;
      case 'date':
        aValue = a.created_at || '';
        bValue = b.created_at || '';
        break;
      case 'category':
        aValue = a.category || '';
        bValue = b.category || '';
        break;
      case 'type':
        aValue = a.type || '';
        bValue = b.type || '';
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

interface InsightsListProps {
  insights: Insight[];
  onRefresh?: () => void;
  onExport?: () => void;
  onDeleteInsight?: (id: number) => void;
  loading?: boolean;
}

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'quality':
      return AlertTriangle;
    case 'anomaly':
      return TrendingUp;
    case 'relationship':
      return GitBranch;
    case 'pattern':
      return BarChart3;
    case 'structure':
      return BarChart3;
    default:
      return Sparkles;
  }
};

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'quality':
      return 'text-orange-600 bg-orange-100';
    case 'anomaly':
      return 'text-red-600 bg-red-100';
    case 'relationship':
      return 'text-blue-600 bg-blue-100';
    case 'pattern':
      return 'text-purple-600 bg-purple-100';
    case 'structure':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const InsightsList: React.FC<InsightsListProps> = ({
  insights,
  onRefresh,
  onExport,
  onDeleteInsight,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<InsightType | 'all'>('all');
  const [minConfidence, setMinConfidence] = useState(0);
  const [sortBy, setSortBy] = useState<'confidence' | 'importance' | 'date' | 'category' | 'type'>('importance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort insights
  const filteredAndSortedInsights = useMemo(() => {
    const filter: InsightFilter = {
      categories: selectedCategory === 'all' ? [] : [selectedCategory],
      types: selectedType === 'all' ? [] : [selectedType],
      minConfidence,
      maxConfidence: 1,
      searchTerm,
      columns: [],
    };

    const filtered = filterInsights(insights, filter);
    return sortInsights(filtered, sortBy, sortDirection);
  }, [insights, searchTerm, selectedCategory, selectedType, minConfidence, sortBy, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('all');
    setMinConfidence(0);
  };

  const hasActiveFilters =
    searchTerm !== '' || selectedCategory !== 'all' || selectedType !== 'all' || minConfidence > 0;

  // Calculate high importance count
  const highImportanceCount = insights.filter((i) => (i.confidence || 0) >= 0.7).length;

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Insights Yet</h3>
        <p className="text-gray-600 mb-6">
          Click the button below to generate insights and discover patterns in your data
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Generate Insights
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Insights ({insights.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically discovered patterns and anomalies
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>

      <div className="space-y-4">
        {insights.map((insight) => {
          const IconComponent = getCategoryIcon(insight.category);
          const colorClass = getCategoryColor(insight.category);
          
          return (
            <div
              key={insight.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      {insight.category && (
                        <span className="text-xs text-gray-500 capitalize">
                          {insight.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 ml-14">{insight.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 ml-14">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Confidence:</span>
                      <span>{(insight.confidence * 100).toFixed(0)}%</span>
                    </div>
                    {insight.importance && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Importance:</span>
                          <span>{(insight.importance * 100).toFixed(0)}%</span>
                        </div>
                      </>
                    )}
                    <span>•</span>
                    <span className="capitalize">{insight.type}</span>
                  </div>

                  {insight.column_name && (
                    <div className="mt-3 ml-14">
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        Column: {insight.column_name}
                      </span>
                    </div>
                  )}

                  {insight.related_columns && insight.related_columns.length > 0 && (
                    <div className="mt-3 ml-14 flex flex-wrap gap-2">
                      {insight.related_columns.map((col, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  )}

                  {insight.metadata && Object.keys(insight.metadata).length > 0 && (
                    <div className="mt-4 ml-14 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-2">Details:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(insight.metadata).map(([key, value]) => {
                          if (typeof value === 'object') return null;
                          return (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-gray-900 font-medium">
                                {typeof value === 'number' ? value.toFixed(2) : String(value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                {onDeleteInsight && (
                  <button
                    onClick={() => onDeleteInsight(insight.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Dismiss insight"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};