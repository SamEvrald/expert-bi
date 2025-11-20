import React, { useState, useMemo } from 'react';
import { ColumnType } from '../../../types/api.types';
import { ColumnTypeCard } from './ColumnTypeCard';
import { TypeLegend } from './TypeLegend';
import { TypeIndicator } from './TypeIndicator';
import { 
  calculateTypeDetectionStats, 
  formatPercentage,
  formatNumber,
  getTypeInfo 
} from '../../../utils/typeDetectionUtils';
import { 
  Filter, 
  Search, 
  Download, 
  Grid, 
  List,
  TrendingUp,
  AlertCircle 
} from 'lucide-react';

interface TypeDetectionResultsProps {
  columnTypes: Record<string, ColumnType>;
  datasetName?: string;
  onExport?: () => void;
}

export const TypeDetectionResults: React.FC<TypeDetectionResultsProps> = ({
  columnTypes,
  datasetName,
  onExport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'type'>('name');

  const stats = useMemo(() => calculateTypeDetectionStats(columnTypes), [columnTypes]);

  // Filter and sort columns
  const filteredColumns = useMemo(() => {
    let filtered = Object.entries(columnTypes);

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(([name]) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(([, type]) => type.detected_type === selectedType);
    }

    // Sort
    filtered.sort(([nameA, typeA], [nameB, typeB]) => {
      switch (sortBy) {
        case 'name':
          return nameA.localeCompare(nameB);
        case 'type':
          return typeA.detected_type.localeCompare(typeB.detected_type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [columnTypes, searchTerm, selectedType, sortBy]);

  // Get unique types for filter
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(Object.values(columnTypes).map((ct) => ct.detected_type)));
  }, [columnTypes]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return '🔢';
      case 'text':
        return '📝';
      case 'boolean':
        return '✓';
      case 'datetime':
        return '📅';
      default:
        return '❓';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'number':
        return 'bg-blue-100 text-blue-800';
      case 'text':
        return 'bg-green-100 text-green-800';
      case 'boolean':
        return 'bg-purple-100 text-purple-800';
      case 'datetime':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Columns</h3>
            <Grid className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(stats.totalColumns)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Avg. Confidence</h3>
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{formatPercentage(stats.averageConfidence)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">High Confidence</h3>
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{stats.highConfidence}</p>
          <p className="text-xs opacity-75 mt-1">≥80% confidence</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Needs Review</h3>
            <AlertCircle className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">{stats.lowConfidence}</p>
          <p className="text-xs opacity-75 mt-1">&lt;50% confidence</p>
        </div>
      </div>

      {/* Type Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Type Distribution</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.detectedTypes)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => {
              const typeInfo = getTypeInfo(type);
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedType === type
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: selectedType === type ? typeInfo.bgColor : 'white',
                  }}
                >
                  <span className="text-xl">{typeInfo.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-medium capitalize">
                      {type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">{count} columns</div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'type')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="name">Sort by Name</option>
          <option value="type">Sort by Type</option>
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Export */}
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

      {/* Active Filters */}
      {(searchTerm || selectedType !== 'all') && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Search: {searchTerm}
              <button
                onClick={() => setSearchTerm('')}
                className="ml-1 hover:text-blue-900"
              >
                ×
              </button>
            </span>
          )}
          {selectedType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              Type: <TypeIndicator type={selectedType} size="sm" showLabel={false} />
              {selectedType}
              <button
                onClick={() => setSelectedType('all')}
                className="ml-1 hover:text-purple-900"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
            }}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredColumns.length} of {stats.totalColumns} columns
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Column Cards */}
        <div className="lg:col-span-3">
          {filteredColumns.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No columns match your filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                }}
                className="mt-4 text-blue-500 hover:text-blue-600 underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                  : 'space-y-4'
              }
            >
              {filteredColumns.map(([columnName, columnType]) => (
                <ColumnTypeCard
                  key={columnName}
                  columnName={columnName}
                  columnType={columnType}
                  onSelect={() => setSelectedColumn(columnName)}
                  isSelected={selectedColumn === columnName}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <TypeLegend counts={stats.detectedTypes} showCounts={true} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Column Type Detection</h3>
            <p className="text-sm text-gray-600 mt-1">
              Detected {Object.keys(columnTypes).length} columns
            </p>
          </div>
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Results
            </button>
          )}
        </div>

        <div className="space-y-3">
          {Object.entries(columnTypes).map(([columnName, typeInfo]) => (
            <div
              key={columnName}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{getTypeIcon(typeInfo.detected_type)}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{columnName}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <span>Pandas: {typeInfo.pandas_dtype}</span>
                    <span>•</span>
                    <span>{typeInfo.unique_count.toLocaleString()} unique values</span>
                    {typeInfo.null_count > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-orange-600">{typeInfo.null_count.toLocaleString()} nulls</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(typeInfo.detected_type)}`}>
                {typeInfo.detected_type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};