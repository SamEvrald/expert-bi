import React, { useState } from 'react';
import { ColumnType } from '../../../types/api.types';
import { TypeIndicator } from './TypeIndicator';
import { ConfidenceScore } from './ConfidenceScore';
import { getTypeInfo, formatNumber, formatPercentage } from '../../../utils/typeDetectionUtils';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ColumnTypeCardProps {
  columnName: string;
  columnType: ColumnType;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const ColumnTypeCard: React.FC<ColumnTypeCardProps> = ({
  columnName,
  columnType,
  onSelect,
  isSelected = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeInfo = getTypeInfo(columnType.detected_type);

  return (
    <div
      className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
              {columnName}
            </h3>
            <TypeIndicator type={columnType.detected_type} size="sm" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Confidence Score */}
        <ConfidenceScore confidence={columnType.confidence} size="sm" />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {columnType.unique_count !== undefined && (
            <div className="bg-gray-50 rounded p-2">
              <div className="text-xs text-gray-500">Unique Values</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatNumber(columnType.unique_count)}
              </div>
            </div>
          )}
          {columnType.null_percentage !== undefined && (
            <div className="bg-gray-50 rounded p-2">
              <div className="text-xs text-gray-500">Missing</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatPercentage(columnType.null_percentage / 100)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
          {/* Type Description */}
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">{typeInfo.description}</p>
          </div>

          {/* Original Data Type */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Original Type</div>
            <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
              {columnType.original_dtype}
            </code>
          </div>

          {/* Statistics */}
          {columnType.statistics && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Statistics</div>
              <div className="grid grid-cols-2 gap-2">
                {columnType.statistics.mean !== undefined && (
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <div className="text-xs text-gray-500">Mean</div>
                    <div className="text-sm font-medium">
                      {columnType.statistics.mean.toFixed(2)}
                    </div>
                  </div>
                )}
                {columnType.statistics.median !== undefined && (
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <div className="text-xs text-gray-500">Median</div>
                    <div className="text-sm font-medium">
                      {columnType.statistics.median.toFixed(2)}
                    </div>
                  </div>
                )}
                {columnType.statistics.std !== undefined && (
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <div className="text-xs text-gray-500">Std Dev</div>
                    <div className="text-sm font-medium">
                      {columnType.statistics.std.toFixed(2)}
                    </div>
                  </div>
                )}
                {columnType.statistics.min !== undefined && (
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <div className="text-xs text-gray-500">Min</div>
                    <div className="text-sm font-medium">
                      {String(columnType.statistics.min)}
                    </div>
                  </div>
                )}
                {columnType.statistics.max !== undefined && (
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <div className="text-xs text-gray-500">Max</div>
                    <div className="text-sm font-medium">
                      {String(columnType.statistics.max)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sample Values */}
          {columnType.sample_values && columnType.sample_values.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Sample Values</div>
              <div className="space-y-1">
                {columnType.sample_values.slice(0, 5).map((value, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-white px-2 py-1 rounded border border-gray-200 truncate"
                  >
                    {String(value)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns */}
          {columnType.patterns && columnType.patterns.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Detected Patterns</div>
              <div className="flex flex-wrap gap-1">
                {columnType.patterns.map((pattern, idx) => (
                  <code
                    key={idx}
                    className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                  >
                    {pattern}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {columnType.metadata && Object.keys(columnType.metadata).length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Additional Info</div>
              <div className="space-y-1">
                {Object.entries(columnType.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};