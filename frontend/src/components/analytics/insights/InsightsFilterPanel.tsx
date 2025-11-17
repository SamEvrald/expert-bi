import React from 'react';
import { InsightCategory, InsightType } from '../../../types/api.types';
import { InsightFilter } from '../../../types/insights';
import { CATEGORY_INFO, TYPE_INFO, CategoryInfo, TypeInfo } from '../../../utils/insightsUtils';
import { X, Filter } from 'lucide-react';

interface InsightsFilterPanelProps {
  filter: InsightFilter;
  onFilterChange: (filter: InsightFilter) => void;
  availableColumns?: string[];
  stats?: {
    byCategory: Record<InsightCategory, number>;
    byType: Record<InsightType, number>;
  };
}

export const InsightsFilterPanel: React.FC<InsightsFilterPanelProps> = ({
  filter,
  onFilterChange,
  availableColumns = [],
  stats,
}) => {
  const updateFilter = (updates: Partial<InsightFilter>) => {
    onFilterChange({ ...filter, ...updates });
  };

  const toggleCategory = (category: InsightCategory) => {
    const newCategories = filter.categories.includes(category)
      ? filter.categories.filter((c) => c !== category)
      : [...filter.categories, category];
    updateFilter({ categories: newCategories });
  };

  const toggleType = (type: InsightType) => {
    const newTypes = filter.types.includes(type)
      ? filter.types.filter((t) => t !== type)
      : [...filter.types, type];
    updateFilter({ types: newTypes });
  };

  const toggleColumn = (column: string) => {
    const newColumns = filter.columns.includes(column)
      ? filter.columns.filter((c) => c !== column)
      : [...filter.columns, column];
    updateFilter({ columns: newColumns });
  };

  const clearAll = () => {
    onFilterChange({
      categories: [],
      types: [],
      minConfidence: 0,
      maxConfidence: 1,
      searchTerm: '',
      columns: [],
    });
  };

  const hasActiveFilters =
    filter.categories.length > 0 ||
    filter.types.length > 0 ||
    filter.columns.length > 0 ||
    filter.minConfidence > 0 ||
    filter.maxConfidence < 1 ||
    filter.searchTerm;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
        <input
          type="text"
          value={filter.searchTerm}
          onChange={(e) => updateFilter({ searchTerm: e.target.value })}
          placeholder="Search insights..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
        <div className="space-y-2">
          {(Object.values(CATEGORY_INFO) as CategoryInfo[]).map((categoryInfo) => {
            const count = stats?.byCategory[categoryInfo.category] || 0;
            const isSelected = filter.categories.includes(categoryInfo.category);

            return (
              <button
                key={categoryInfo.category}
                onClick={() => toggleCategory(categoryInfo.category)}
                disabled={count === 0}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'border-2'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                } ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  backgroundColor: isSelected ? categoryInfo.bgColor : undefined,
                  borderColor: isSelected ? categoryInfo.color : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryInfo.icon}</span>
                  <span className="text-sm font-medium">{categoryInfo.label}</span>
                </div>
                {count > 0 && (
                  <span className="text-xs font-semibold px-2 py-1 bg-white rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Types</label>
        <div className="space-y-2">
          {(Object.values(TYPE_INFO) as TypeInfo[]).map((typeInfo) => {
            const count = stats?.byType[typeInfo.type] || 0;
            const isSelected = filter.types.includes(typeInfo.type);

            return (
              <button
                key={typeInfo.type}
                onClick={() => toggleType(typeInfo.type)}
                disabled={count === 0}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                } ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{typeInfo.icon}</span>
                  <span className="text-sm font-medium">{typeInfo.label}</span>
                </div>
                {count > 0 && (
                  <span className="text-xs font-semibold px-2 py-1 bg-white rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confidence Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confidence: {Math.round(filter.minConfidence * 100)}% -{' '}
          {Math.round(filter.maxConfidence * 100)}%
        </label>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600">Min</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filter.minConfidence * 100}
              onChange={(e) => updateFilter({ minConfidence: Number(e.target.value) / 100 })}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Max</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filter.maxConfidence * 100}
              onChange={(e) => updateFilter({ maxConfidence: Number(e.target.value) / 100 })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Columns */}
      {availableColumns.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Columns</label>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableColumns.map((column) => {
              const isSelected = filter.columns.includes(column);
              return (
                <button
                  key={column}
                  onClick={() => toggleColumn(column)}
                  className={`w-full flex items-center justify-between p-2 rounded transition-colors text-left ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <code className="text-xs font-mono">{column}</code>
                  {isSelected && <X className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};