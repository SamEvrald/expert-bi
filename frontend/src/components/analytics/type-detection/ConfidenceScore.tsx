import React from 'react';
import { getConfidenceLevel, formatPercentage } from '../../../utils/typeDetectionUtils';

interface ConfidenceScoreProps {
  confidence: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({ 
  confidence, 
  showLabel = true,
  size = 'md' 
}) => {
  const { level, color, label } = getConfidenceLevel(confidence);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`${textSizes[size]} font-medium text-gray-700`}>
            {label}
          </span>
          <span className={`${textSizes[size]} font-semibold`} style={{ color }}>
            {formatPercentage(confidence)}
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${confidence * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};