import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';
import { Dataset, ColumnType } from '../../../types/api.types';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, ScatterChart as ScatterIcon, Activity, GitCompare, Filter, Download } from 'lucide-react';

interface DataVisualizationsProps {
  dataset: Dataset;
  columnTypes: Record<string, ColumnType>;
  previewData: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'radar' | 'composed';

export const DataVisualizations: React.FC<DataVisualizationsProps> = ({
  dataset,
  columnTypes,
  previewData,
}) => {
  // State for user selections
  const [selectedNumericColumns, setSelectedNumericColumns] = useState<string[]>([]);
  const [selectedCategoricalColumn, setSelectedCategoricalColumn] = useState<string>('');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('bar');
  const [scatterXColumn, setScatterXColumn] = useState<string>('');
  const [scatterYColumn, setScatterYColumn] = useState<string>('');
  const [compareColumns, setCompareColumns] = useState<string[]>([]);
  const [showDataQuality, setShowDataQuality] = useState(true);
  const [showDistributions, setShowDistributions] = useState(true);
  const [showCorrelations, setShowCorrelations] = useState(true);
  const [showCustomChart, setShowCustomChart] = useState(false);

  // Get numeric columns
  const numericColumns = Object.entries(columnTypes)
    .filter(([_, type]) => type.detected_type === 'number')
    .map(([name, _]) => name);

  // Get categorical columns
  const categoricalColumns = Object.entries(columnTypes)
    .filter(([_, type]) => type.unique_count < 50 && type.unique_count > 1)
    .map(([name, _]) => name);

  // Get all columns for comparison
  const allColumns = Object.keys(columnTypes);

  // Calculate distribution for numeric columns
  const getNumericDistribution = (columnName: string) => {
    const values = previewData
      .map(row => row[columnName])
      .filter(val => val !== null && val !== undefined && !isNaN(Number(val)))
      .map(val => Number(val));

    if (values.length === 0) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    if (min === max) {
      return [{
        range: min.toFixed(1),
        count: values.length,
        rangeStart: min,
      }];
    }
    
    const bins = 10;
    const binSize = (max - min) / bins;

    const distribution = Array(bins).fill(0).map((_, i) => ({
      range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
      count: 0,
      rangeStart: min + i * binSize,
    }));

    values.forEach(val => {
      const binIndex = Math.min(Math.floor((val - min) / binSize), bins - 1);
      if (binIndex >= 0 && binIndex < bins) {
        distribution[binIndex].count++;
      }
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
      .slice(0, 15);
  };

  // Get custom chart data based on selected columns
  const getCustomChartData = () => {
    if (selectedCategoricalColumn && selectedNumericColumns.length > 0) {
      const grouped: Record<string, any> = {};
      
      previewData.forEach(row => {
        const category = String(row[selectedCategoricalColumn] ?? 'null');
        if (!grouped[category]) {
          grouped[category] = { name: category };
          selectedNumericColumns.forEach(col => {
            grouped[category][col] = 0;
            grouped[category][`${col}_count`] = 0;
          });
        }
        
        selectedNumericColumns.forEach(col => {
          const val = Number(row[col]);
          if (!isNaN(val)) {
            grouped[category][col] += val;
            grouped[category][`${col}_count`]++;
          }
        });
      });

      // Calculate averages
      return Object.values(grouped).map((item: any) => {
        selectedNumericColumns.forEach(col => {
          if (item[`${col}_count`] > 0) {
            item[col] = item[col] / item[`${col}_count`];
          }
          delete item[`${col}_count`];
        });
        return item;
      }).slice(0, 15);
    }
    return [];
  };

  // Get scatter plot data
  const getScatterData = () => {
    if (!scatterXColumn || !scatterYColumn) return [];

    return previewData
      .filter(row => 
        row[scatterXColumn] !== null && row[scatterXColumn] !== undefined &&
        row[scatterYColumn] !== null && row[scatterYColumn] !== undefined
      )
      .map(row => ({
        x: Number(row[scatterXColumn]),
        y: Number(row[scatterYColumn]),
      }))
      .slice(0, 200);
  };

  // Get comparison data for multiple columns
  const getComparisonData = () => {
    if (compareColumns.length === 0) return [];

    return previewData.slice(0, 50).map((row, index) => {
      const item: any = { index: index + 1 };
      compareColumns.forEach(col => {
        item[col] = row[col];
      });
      return item;
    });
  };

  // Get time series data (if any date/time columns exist)
  const getTimeSeriesData = () => {
    const dateColumns = Object.entries(columnTypes)
      .filter(([_, type]) => type.detected_type === 'datetime')
      .map(([name, _]) => name);

    if (dateColumns.length === 0 || selectedNumericColumns.length === 0) return [];

    const dateCol = dateColumns[0];
    return previewData
      .filter(row => row[dateCol])
      .map(row => {
        const item: any = { date: new Date(row[dateCol]).toLocaleDateString() };
        selectedNumericColumns.forEach(col => {
          item[col] = row[col];
        });
        return item;
      })
      .slice(0, 100);
  };

  // Calculate missing data statistics
  const getMissingDataStats = () => {
    return Object.entries(columnTypes)
      .filter(([_, type]) => type.null_count > 0)
      .map(([name, type]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        missing: type.null_count,
        complete: dataset.row_count - type.null_count,
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

  // Get statistics for selected numeric columns
  const getColumnStats = (columnName: string) => {
    const values = previewData
      .map(row => Number(row[columnName]))
      .filter(val => !isNaN(val));

    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    return { mean, median, min, max, count: values.length };
  };

  const missingDataStats = getMissingDataStats();
  const qualityMetrics = getDataQualityMetrics();
  const customChartData = getCustomChartData();
  const scatterData = getScatterData();
  const comparisonData = getComparisonData();

  const toggleNumericColumn = (column: string) => {
    setSelectedNumericColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const toggleCompareColumn = (column: string) => {
    setCompareColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const renderChart = (data: any[], columns: string[], type: ChartType = selectedChartType) => {
    const chartHeight = 300;

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {columns.map((col, idx) => (
                <Line key={col} type="monotone" dataKey={col} stroke={COLORS[idx % COLORS.length]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {columns.map((col, idx) => (
                <Area key={col} type="monotone" dataKey={col} fill={COLORS[idx % COLORS.length]} stroke={COLORS[idx % COLORS.length]} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                dataKey={columns[0] || 'value'}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {columns.map((col, idx) => (
                idx % 2 === 0 ? (
                  <Bar key={col} dataKey={col} fill={COLORS[idx % COLORS.length]} />
                ) : (
                  <Line key={col} type="monotone" dataKey={col} stroke={COLORS[idx % COLORS.length]} />
                )
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {columns.map((col, idx) => (
                <Bar key={col} dataKey={col} fill={COLORS[idx % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Control Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Visualization Controls</h3>
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4" />
              Show Sections
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showDataQuality}
                  onChange={(e) => setShowDataQuality(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Data Quality</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showDistributions}
                  onChange={(e) => setShowDistributions(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Distributions</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showCorrelations}
                  onChange={(e) => setShowCorrelations(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Correlations</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showCustomChart}
                  onChange={(e) => setShowCustomChart(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Custom Charts</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Chart Builder */}
      {showCustomChart && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Custom Chart Builder
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Chart Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
              <select
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.target.value as ChartType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="composed">Combined Chart</option>
              </select>
            </div>

            {/* Categorical Column Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group By (Category)</label>
              <select
                value={selectedCategoricalColumn}
                onChange={(e) => setSelectedCategoricalColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {categoricalColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Numeric Columns Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numeric Values</label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {numericColumns.map(col => (
                  <label key={col} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedNumericColumns.includes(col)}
                      onChange={() => toggleNumericColumn(col)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{col}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Chart Display */}
          {customChartData.length > 0 && selectedNumericColumns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">
                {selectedCategoricalColumn} by {selectedNumericColumns.join(', ')}
              </h4>
              {renderChart(customChartData, selectedNumericColumns)}
              
              {/* Statistics for selected columns */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedNumericColumns.map(col => {
                  const stats = getColumnStats(col);
                  if (!stats) return null;
                  return (
                    <div key={col} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-2">{col}</p>
                      <div className="space-y-1 text-xs text-gray-700">
                        <p>Mean: {stats.mean.toFixed(2)}</p>
                        <p>Median: {stats.median.toFixed(2)}</p>
                        <p>Min: {stats.min.toFixed(2)}</p>
                        <p>Max: {stats.max.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scatter Plot Builder */}
      {showCustomChart && numericColumns.length >= 2 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <ScatterIcon className="w-5 h-5" />
            Scatter Plot Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">X-Axis</label>
              <select
                value={scatterXColumn}
                onChange={(e) => setScatterXColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {numericColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Y-Axis</label>
              <select
                value={scatterYColumn}
                onChange={(e) => setScatterYColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {numericColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          {scatterData.length > 0 && (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name={scatterXColumn} />
                <YAxis dataKey="y" name={scatterYColumn} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter
                  name={`${scatterXColumn} vs ${scatterYColumn}`}
                  data={scatterData}
                  fill="#8b5cf6"
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Column Comparison */}
      {showCustomChart && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Column Comparison
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select columns to compare</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {allColumns.map(col => (
                <label key={col} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={compareColumns.includes(col)}
                    onChange={() => toggleCompareColumn(col)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{col}</span>
                </label>
              ))}
            </div>
          </div>

          {comparisonData.length > 0 && compareColumns.length > 0 && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip />
                <Legend />
                {compareColumns.map((col, idx) => (
                  <Line
                    key={col}
                    type="monotone"
                    dataKey={col}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Data Quality Overview */}
      {showDataQuality && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Data Quality Overview
          </h3>
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
                    <Bar dataKey="complete" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Numeric Distributions */}
      {showDistributions && numericColumns.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Numeric Column Distributions
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {numericColumns.slice(0, 6).map((column) => {
              const distribution = getNumericDistribution(column);
              const stats = getColumnStats(column);
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
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                      <p>Unique: {columnTypes[column].unique_count.toLocaleString()}</p>
                      <p>Missing: {columnTypes[column].null_count.toLocaleString()}</p>
                    </div>
                    {stats && (
                      <div>
                        <p>Mean: {stats.mean.toFixed(2)}</p>
                        <p>Median: {stats.median.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categorical Distributions */}
      {showDistributions && categoricalColumns.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5" />
            Categorical Column Distributions
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categoricalColumns.slice(0, 6).map((column) => {
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