import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Dataset, ColumnType } from '../../../types/api.types';

interface DataVisualizationsProps {
  dataset: Dataset;
  columnTypes: Record<string, ColumnType>;
  previewData: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const DataVisualizations: React.FC<DataVisualizationsProps> = ({
  dataset,
  columnTypes,
  previewData,
}) => {
  // Get numeric columns
  const numericColumns = Object.entries(columnTypes)
    .filter(([_, type]) => type.detected_type === 'number')
    .map(([name, _]) => name);

  // Get categorical columns (with low cardinality)
  const categoricalColumns = Object.entries(columnTypes)
    .filter(([_, type]) => type.unique_count < 20 && type.unique_count > 1)
    .map(([name, _]) => name);

  // Calculate distribution for numeric columns
  const getNumericDistribution = (columnName: string) => {
    const values = previewData
      .map(row => row[columnName])
      .filter(val => val !== null && val !== undefined && !isNaN(val));

    if (values.length === 0) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const bins = 10;
    const binSize = (max - min) / bins;

    const distribution = Array(bins).fill(0).map((_, i) => ({
      range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
      count: 0,
      rangeStart: min + i * binSize,
    }));

    values.forEach(val => {
      const binIndex = Math.min(Math.floor((val - min) / binSize), bins - 1);
      distribution[binIndex].count++;
    });

    return distribution;
  };

  // Calculate frequency for categorical columns
  const getCategoricalFrequency = (columnName: string) => {
    const valueCounts: Record<string, number> = {};
    
    previewData.forEach(row => {
      const value = String(row[columnName] ?? 'null');
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });

    return Object.entries(valueCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  };

  // Calculate correlation data (first 2 numeric columns)
  const getCorrelationData = () => {
    if (numericColumns.length < 2) return [];

    const col1 = numericColumns[0];
    const col2 = numericColumns[1];

    return previewData
      .filter(row => 
        row[col1] !== null && row[col1] !== undefined &&
        row[col2] !== null && row[col2] !== undefined
      )
      .map(row => ({
        [col1]: row[col1],
        [col2]: row[col2],
      }))
      .slice(0, 100); // Limit to 100 points
  };

  // Calculate missing data statistics
  const getMissingDataStats = () => {
    return Object.entries(columnTypes)
      .filter(([_, type]) => type.null_count > 0)
      .map(([name, type]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        missing: type.null_count,
        percentage: ((type.null_count / dataset.row_count) * 100).toFixed(1),
      }))
      .slice(0, 10);
  };

  // Calculate data quality score
  const getDataQualityMetrics = () => {
    const totalCells = dataset.row_count * dataset.column_count;
    const totalMissing = Object.values(columnTypes).reduce((sum, col) => sum + col.null_count, 0);
    const completeness = ((totalCells - totalMissing) / totalCells) * 100;

    return [
      { name: 'Complete', value: completeness, fill: '#10b981' },
      { name: 'Missing', value: 100 - completeness, fill: '#ef4444' },
    ];
  };

  const missingDataStats = getMissingDataStats();
  const qualityMetrics = getDataQualityMetrics();

  return (
    <div className="space-y-8">
      {/* Data Quality Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Data Quality Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Completeness Score</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={qualityMetrics}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {qualityMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {missingDataStats.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Missing Values by Column</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={missingDataStats} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="missing" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Numeric Distributions */}
      {numericColumns.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Numeric Column Distributions</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {numericColumns.slice(0, 4).map((column) => {
              const distribution = getNumericDistribution(column);
              return (
                <div key={column}>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">{column}</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p>Unique values: {columnTypes[column].unique_count.toLocaleString()}</p>
                    <p>Missing: {columnTypes[column].null_count.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categorical Distributions */}
      {categoricalColumns.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Categorical Column Distributions</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categoricalColumns.slice(0, 4).map((column) => {
              const frequency = getCategoricalFrequency(column);
              return (
                <div key={column}>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">{column}</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={frequency}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p>Unique values: {columnTypes[column].unique_count.toLocaleString()}</p>
                    <p>Missing: {columnTypes[column].null_count.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Correlation Plot */}
      {numericColumns.length >= 2 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Correlation Analysis</h3>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {numericColumns[0]} vs {numericColumns[1]}
            </h4>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={numericColumns[0]} name={numericColumns[0]} />
                <YAxis dataKey={numericColumns[1]} name={numericColumns[1]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter
                  name={`${numericColumns[0]} vs ${numericColumns[1]}`}
                  data={getCorrelationData()}
                  fill="#8b5cf6"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Column Type Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Column Type Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={Object.entries(
                Object.values(columnTypes).reduce((acc, col) => {
                  acc[col.detected_type] = (acc[col.detected_type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([name, value]) => ({ name, value }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              dataKey="value"
            >
              {Object.keys(columnTypes).map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};