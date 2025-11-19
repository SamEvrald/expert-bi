import React, { useState, useMemo } from 'react';
import { Insight, InsightCategory, InsightType } from '../../../types/api.types';
import { InsightCard } from './InsightCard';
import { InsightFilter } from '../../../types/insights';
import {
  calculateInsightStats,
  filterInsights,
  sortInsights,
  getCategoryInfo,
  getTypeInfo,
} from '../../../utils/insightsUtils';
import { formatPercentage } from '../../../utils/typeDetectionUtils';
import {
  Search,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Grid,
} from 'lucide-react';
import { Sparkles, Trash2 } from 'lucide-react';

interface InsightsListProps {
  insights: Insight[];
  onRefresh?: () => void;
  onExport?: () => void;
  onDeleteInsight?: (id: number) => void;
  loading?: boolean;
}

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

  const stats = useMemo(() => calculateInsightStats(insights), [insights]);

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
  const highImportanceCount = insights.filter((i) => (i.importance || 0) >= 0.7).length;

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Insights Yet</h3>
        <p className="text-gray-600 mb-6">
          Generate insights to discover patterns and anomalies in your data
        </p>
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Generate Insights
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Insights</h3>
            <Grid className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Avg. Confidence</h3>
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{formatPercentage(stats.avgConfidence)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">High Priority</h3>
            <AlertCircle className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{highImportanceCount}</p>
          <p className="text-xs opacity-75 mt-1">Action required</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Categories</h3>
            <FilterIcon className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {Object.values(stats.byCategory).filter((count) => count > 0).length}
          </p>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.entries(stats.byCategory) as [InsightCategory, number][])
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => {
              const info = getCategoryInfo(category);
              return (
                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category ? 'all' : category
                    )
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCategory === category
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category ? info.bgColor : 'white',
                  }}
                >
                  <div className="text-2xl mb-2">{info.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{info.label}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: info.color }}>
                    {count}
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
            showFilters || hasActiveFilters
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <FilterIcon className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {[selectedCategory !== 'all', selectedType !== 'all', minConfidence > 0].filter(
                Boolean
              ).length}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="importance">Sort by Importance</option>
            <option value="confidence">Sort by Confidence</option>
            <option value="date">Sort by Date</option>
            <option value="category">Sort by Category</option>
            <option value="type">Sort by Type</option>
          </select>

          <button
            onClick={toggleSortDirection}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {sortDirection === 'desc' ? (
              <SortDesc className="w-5 h-5 text-gray-600" />
            ) : (
              <SortAsc className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as InsightType | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {(Object.entries(stats.byType) as [InsightType, number][])
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => {
                    const info = getTypeInfo(type);
                    return (
                      <option key={type} value={type}>
                        {info.icon} {info.label} ({count})
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Confidence Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min. Confidence: {formatPercentage(minConfidence)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              Category: {getCategoryInfo(selectedCategory).label}
              <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-purple-900">
                ×
              </button>
            </span>
          )}
          {selectedType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Type: {getTypeInfo(selectedType).label}
              <button onClick={() => setSelectedType('all')} className="ml-1 hover:text-blue-900">
                ×
              </button>
            </span>
          )}
          {minConfidence > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              Confidence ≥ {formatPercentage(minConfidence)}
              <button onClick={() => setMinConfidence(0)} className="ml-1 hover:text-green-900">
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedInsights.length} of {stats.total} insights
        </p>
      </div>

      {/* Insights Grid */}
      {filteredAndSortedInsights.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {stats.total === 0 ? 'No insights generated yet' : 'No insights match your filters'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDelete={onDeleteInsight}
            />
          ))}
        </div>
      )}
    </div>
  );
};