import React from 'react';
import { getTypeInfo } from '../../../utils/typeDetectionUtils';

interface TypeIndicatorProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
}

export const TypeIndicator: React.FC<TypeIndicatorProps> = ({ 
  type, 
  size = 'md',
  showLabel = true,
  showIcon = true,
}) => {
  const typeInfo = getTypeInfo(type);
  
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'text-sm',
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'text-base',
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'text-lg',
    },
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size].container}`}
      style={{
        backgroundColor: typeInfo.bgColor,
        color: typeInfo.color,
      }}
    >
      {showIcon && (
        <span className={sizeClasses[size].icon}>{typeInfo.icon}</span>
      )}
      {showLabel && (
        <span className="capitalize">{typeInfo.type.replace('_', ' ')}</span>
      )}
    </div>
  );
};