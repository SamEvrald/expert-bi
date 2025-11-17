import React from 'react';
import { TypeIndicator } from './TypeIndicator';
import { DATA_TYPE_INFO } from '../../../utils/typeDetectionUtils';
import { DataTypeCategory } from '../../../types/typeDetection';

interface TypeLegendProps {
  counts?: Record<string, number>;
  showCounts?: boolean;
}

const categoryOrder: DataTypeCategory[] = [
  'numeric',
  'categorical',
  'temporal',
  'identifier',
  'geospatial',
  'special',
  'other',
];

const categoryLabels: Record<DataTypeCategory, string> = {
  numeric: 'Numeric Types',
  categorical: 'Categorical Types',
  temporal: 'Date & Time Types',
  identifier: 'Identifier Types',
  geospatial: 'Geographic Types',
  special: 'Special Types',
  other: 'Other Types',
};

export const TypeLegend: React.FC<TypeLegendProps> = ({ 
  counts = {}, 
  showCounts = true 
}) => {
  // Group types by category
  const typesByCategory = Object.values(DATA_TYPE_INFO).reduce((acc, typeInfo) => {
    if (!acc[typeInfo.category]) {
      acc[typeInfo.category] = [];
    }
    acc[typeInfo.category].push(typeInfo);
    return acc;
  }, {} as Record<DataTypeCategory, typeof DATA_TYPE_INFO[string][]>);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Type Legend</h3>
      
      <div className="space-y-4">
        {categoryOrder.map((category) => {
          const types = typesByCategory[category];
          if (!types || types.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {categoryLabels[category]}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {types.map((typeInfo) => {
                  const count = counts[typeInfo.type] || 0;
                  return (
                    <div
                      key={typeInfo.type}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <TypeIndicator 
                          type={typeInfo.type} 
                          size="sm" 
                          showLabel={false}
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {typeInfo.type.replace('_', ' ')}
                        </span>
                      </div>
                      {showCounts && count > 0 && (
                        <span className="text-sm font-semibold text-gray-900">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};