import React from 'react';
import { Dataset, ColumnType } from '../../types/api.types';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

interface StatisticsViewerProps {
  dataset: Dataset;
  columnTypes: Record<string, ColumnType>;
}

export const StatisticsViewer: React.FC<StatisticsViewerProps> = ({
  dataset,
  columnTypes,
}) => {
  const numericColumns = Object.entries(columnTypes).filter(
    ([, type]) => type.detected_type === 'number'
  );

  const textColumns = Object.entries(columnTypes).filter(
    ([, type]) => type.detected_type === 'text'
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Columns</p>
              <p className="text-2xl font-bold text-gray-900">
                {dataset.column_count}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Numeric Columns</p>
              <p className="text-2xl font-bold text-gray-900">
                {numericColumns.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Text Columns</p>
              <p className="text-2xl font-bold text-gray-900">
                {textColumns.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Column Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Column Statistics
        </h3>
        <div className="space-y-4">
          {Object.entries(columnTypes).map(
            ([columnName, typeInfo]) => (
              <div
                key={columnName}
                className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
              >
                <h4 className="font-medium text-gray-900 mb-2">{columnName}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Type</p>
                    <p className="font-medium text-gray-900">
                      {typeInfo.detected_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Unique Values</p>
                    <p className="font-medium text-gray-900">
                      {typeInfo.unique_count.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Null Count</p>
                    <p className="font-medium text-gray-900">
                      {typeInfo.null_count.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Completeness</p>
                    <p className="font-medium text-gray-900">
                      {(
                        (1 - typeInfo.null_count / dataset.row_count) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};