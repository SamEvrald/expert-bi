import React from 'react';
import { ChartSuggestion } from '../../types/api.types';
import { getChartTypeIcon, getChartTypeDescription } from '../../utils/chartUtils';
import { formatPercentage } from '../../utils/typeDetectionUtils';
import { Sparkles, TrendingUp } from 'lucide-react';

interface ChartRecommendationsProps {
  suggestions: ChartSuggestion[];
  onSelect: (suggestion: ChartSuggestion) => void;
  selectedType?: string;
}

export const ChartRecommendations: React.FC<ChartRecommendationsProps> = ({
  suggestions,
  onSelect,
  selectedType,
}) => {
  const sortedSuggestions = [...suggestions].sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">Recommended Charts</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSuggestions.map((suggestion, idx) => {
          const isSelected = selectedType === suggestion.chart_type;
          const icon = getChartTypeIcon(suggestion.chart_type);
          const description = getChartTypeDescription(suggestion.chart_type);

          return (
            <button
              key={idx}
              onClick={() => onSelect(suggestion)}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Priority Badge */}
              {idx === 0 && (
                <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 mb-2">
                  <TrendingUp className="w-3 h-3" />
                  Top Recommendation
                </div>
              )}

              {/* Chart Type */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {suggestion.chart_type}
                  </h4>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
              </div>

              {/* Confidence & Priority */}
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Confidence</span>
                    <span className="font-semibold text-gray-900">
                      {formatPercentage(suggestion.confidence)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${suggestion.confidence * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Priority</span>
                    <span className="font-semibold text-gray-900">
                      {suggestion.priority}/10
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${(suggestion.priority / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-600 italic">{suggestion.reason}</p>
              </div>

              {/* Description */}
              {suggestion.description && (
                <p className="text-xs text-gray-500 mt-2">{suggestion.description}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};