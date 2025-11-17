import React from 'react';
import { Dataset, ColumnType } from '../../types/api.types';
import { BarChart3, TrendingUp, AlertCircle, Database } from 'lucide-react';
import { formatNumber, formatPercentage } from '../../utils/typeDetectionUtils';

interface StatisticsViewerProps {
  dataset: Dataset;
  columnTypes: Record<string, ColumnType>;
}

export const StatisticsViewer: React.FC<StatisticsViewerProps> = ({
  dataset,
  columnTypes,
}) => {
  const columns = Object.entries(columnTypes);
  const numericColumns = columns.filter(
    ([, type]) => type.detected_type === 'numeric'
  );

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Rows</h3>
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatNumber(dataset.row_count)}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Columns</h3>
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{dataset.column_count}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Numeric Columns</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{numericColumns.length}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">File Size</h3>
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(dataset.file_size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      </div>

      {/* Column Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Column Statistics</h3>
        <div className="space-y-4">
          {columns.map(([name, type]) => (
            <div key={name} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
              <h4 className="font-medium text-gray-900 mb-2">{name}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {type.statistics?.mean !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600">Mean</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {type.statistics.mean.toFixed(2)}
                    </p>
                  </div>
                )}
                {type.statistics?.median !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600">Median</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {type.statistics.median.toFixed(2)}
                    </p>
                  </div>
                )}
                {type.unique_count !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600">Unique Values</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatNumber(type.unique_count)}
                    </p>
                  </div>
                )}
                {type.null_percentage !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600">Missing</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPercentage(type.null_percentage / 100)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};