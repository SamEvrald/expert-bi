import React, { useState } from 'react';
import { Insight } from '../../../types/api.types';
import { getCategoryInfo, getTypeInfo, getImportanceLevel } from '../../../utils/insightsUtils';
import { formatPercentage } from '../../../utils/typeDetectionUtils';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface InsightCardProps {
  insight: Insight;
  onDelete?: (id: number) => void;
  isExpanded?: boolean;
}

// Type guard helpers
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number';
const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onDelete,
  isExpanded: controlledExpanded,
}) => {
  const [isExpanded, setIsExpanded] = useState(controlledExpanded || false);
  const categoryInfo = getCategoryInfo(insight.category);
  const typeInfo = getTypeInfo(insight.type);
  const importanceInfo = getImportanceLevel(insight.importance || 0.5);

  const trendValue = insight.metadata?.trend;
  const trendIcon = trendValue === 'increasing' ? (
    <TrendingUp className="w-4 h-4 text-green-500" />
  ) : trendValue === 'decreasing' ? (
    <TrendingDown className="w-4 h-4 text-red-500" />
  ) : (
    <Minus className="w-4 h-4 text-gray-400" />
  );

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {/* Category Badge */}
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: categoryInfo.bgColor,
                  color: categoryInfo.color,
                }}
              >
                <span>{categoryInfo.icon}</span>
                <span>{categoryInfo.label}</span>
              </span>

              {/* Type Badge */}
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
              >
                <span>{typeInfo.icon}</span>
                <span>{typeInfo.label}</span>
              </span>

              {/* Importance Indicator */}
              {insight.importance && insight.importance >= 0.7 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <AlertCircle className="w-3 h-3" />
                  High Priority
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">{insight.title}</h3>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Meta Information */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {insight.column_name && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Column:</span>
              <code className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                {insight.column_name}
              </code>
            </div>
          )}

          {insight.related_columns && insight.related_columns.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Related:</span>
              <span className="text-xs">{insight.related_columns.length} columns</span>
            </div>
          )}

          {trendValue && isString(trendValue) && (
            <div className="flex items-center gap-1">
              {trendIcon}
              <span className="capitalize">{trendValue}</span>
            </div>
          )}
        </div>

        {/* Confidence Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Confidence</span>
            <span className="text-xs font-semibold text-gray-900">
              {formatPercentage(insight.confidence)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${insight.confidence * 100}%`,
                backgroundColor:
                  insight.confidence >= 0.8
                    ? '#10b981'
                    : insight.confidence >= 0.5
                    ? '#f59e0b'
                    : '#ef4444',
              }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
          {/* Metadata */}
          {insight.metadata && Object.keys(insight.metadata).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Details</h4>
              <div className="space-y-2">
                {insight.metadata.value !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium text-gray-900">
                      {isNumber(insight.metadata.value)
                        ? insight.metadata.value.toFixed(2)
                        : String(insight.metadata.value)}
                    </span>
                  </div>
                )}

                {insight.metadata.correlation_value !== undefined && isNumber(insight.metadata.correlation_value) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Correlation:</span>
                    <span className="font-medium text-gray-900">
                      {insight.metadata.correlation_value.toFixed(3)}
                    </span>
                  </div>
                )}

                {insight.metadata.outlier_indices !== undefined && 
                 isArray(insight.metadata.outlier_indices) && 
                 insight.metadata.outlier_indices.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Outliers Found:</span>
                    <span className="font-medium text-gray-900">
                      {insight.metadata.outlier_indices.length}
                    </span>
                  </div>
                )}

                {insight.metadata.pattern_type !== undefined && isString(insight.metadata.pattern_type) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pattern Type:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {insight.metadata.pattern_type}
                    </span>
                  </div>
                )}

                {/* Additional metadata */}
                {Object.entries(insight.metadata)
                  .filter(
                    ([key]) =>
                      !['value', 'correlation_value', 'outlier_indices', 'pattern_type', 'trend', 'visualization'].includes(
                        key
                      )
                  )
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-medium text-gray-900">
                        {typeof value === 'object' && value !== null
                          ? JSON.stringify(value)
                          : isNumber(value) && !Number.isInteger(value)
                          ? value.toFixed(2)
                          : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Related Columns */}
          {insight.related_columns && insight.related_columns.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Related Columns</h4>
              <div className="flex flex-wrap gap-1">
                {insight.related_columns.map((col) => (
                  <code
                    key={col}
                    className="px-2 py-1 bg-white rounded border border-gray-200 text-xs"
                  >
                    {col}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Generated: {new Date(insight.created_at).toLocaleString()}</span>
              {onDelete && (
                <button
                  onClick={() => onDelete(insight.id)}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};