import React, { useState, useEffect, useRef } from 'react';
import { ChartSuggestion, ChartType, DataPreview, ColumnType } from '../../types/api.types';
import { ChartData, DEFAULT_CHART_OPTIONS } from '../../types/charts';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { PieChart } from './PieChart';
import { ScatterChart } from './ScatterChart';
import { ChartRecommendations } from './ChartRecommendations';
import { generateChartData, exportChartAsImage, downloadChartData } from '../../utils/chartUtils';
import {
  Download,
  Image as ImageIcon,
  FileText,
  Settings,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface ChartBuilderProps {
  datasetId: number;
  preview: DataPreview;
  columnTypes: Record<string, ColumnType>;
  suggestions?: ChartSuggestion[];
  onRequestSuggestions?: (xAxis: string, yAxis: string) => void;
}

export const ChartBuilder: React.FC<ChartBuilderProps> = ({
  datasetId,
  preview,
  columnTypes,
  suggestions = [],
  onRequestSuggestions,
}) => {
  const [selectedType, setSelectedType] = useState<ChartType>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [groupBy, setGroupBy] = useState<string>('');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get numeric and categorical columns
  const numericColumns = preview.columns.filter(
    (col) => columnTypes[col]?.detected_type === 'numeric' || 
             columnTypes[col]?.detected_type === 'currency' ||
             columnTypes[col]?.detected_type === 'percentage'
  );

  const categoricalColumns = preview.columns.filter(
    (col) => columnTypes[col]?.detected_type === 'categorical' ||
             columnTypes[col]?.detected_type === 'date'
  );

  const allColumns = preview.columns;

  // Set default axes
  useEffect(() => {
    if (!xAxis && categoricalColumns.length > 0) {
      setXAxis(categoricalColumns[0]);
    }
    if (!yAxis && numericColumns.length > 0) {
      setYAxis(numericColumns[0]);
    }
  }, [categoricalColumns, numericColumns]);

  // Generate chart data when axes change
  useEffect(() => {
    if (xAxis && yAxis && preview.rows.length > 0) {
      const data = generateChartData(preview.rows, {
        x_axis: xAxis,
        y_axis: yAxis,
        group_by: groupBy || undefined,
        aggregation: 'sum',
      });
      setChartData(data);

      // Request suggestions
      if (onRequestSuggestions) {
        onRequestSuggestions(xAxis, yAxis);
      }
    }
  }, [xAxis, yAxis, groupBy, preview.rows]);

  const handleSuggestionSelect = (suggestion: ChartSuggestion) => {
    setSelectedType(suggestion.chart_type);
    if (suggestion.config.x_axis) setXAxis(suggestion.config.x_axis);
    if (suggestion.config.y_axis && typeof suggestion.config.y_axis === 'string') {
      setYAxis(suggestion.config.y_axis);
    }
    if (suggestion.config.group_by) setGroupBy(suggestion.config.group_by);
  };

  const handleExportImage = async (format: 'png' | 'jpg') => {
    const canvas = chartContainerRef.current?.querySelector('canvas');
    if (!canvas) return;

    try {
      await exportChartAsImage(canvas, format, `chart_${datasetId}_${selectedType}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportData = () => {
    if (!chartData) return;
    downloadChartData(chartData, `chart_data_${datasetId}`);
  };

  const renderChart = () => {
    if (!chartData) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Select axes to generate chart</p>
          </div>
        </div>
      );
    }

    const chartOptions = {
      ...DEFAULT_CHART_OPTIONS,
      plugins: {
        ...DEFAULT_CHART_OPTIONS.plugins,
        title: {
          display: true,
          text: `${yAxis} by ${xAxis}`,
        },
      },
    };

    const chartHeight = isFullscreen ? 600 : 400;

    switch (selectedType) {
      case 'line':
        return <LineChart data={chartData} options={chartOptions} height={chartHeight} />;
      case 'bar':
        return <BarChart data={chartData} options={chartOptions} height={chartHeight} />;
      case 'pie':
      case 'doughnut':
        return <PieChart data={chartData} options={chartOptions} height={chartHeight} type={selectedType} />;
      case 'scatter':
        return <ScatterChart data={chartData} options={chartOptions} height={chartHeight} />;
      default:
        return <BarChart data={chartData} options={chartOptions} height={chartHeight} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Recommendations */}
      {suggestions.length > 0 && (
        <ChartRecommendations
          suggestions={suggestions}
          onSelect={handleSuggestionSelect}
          selectedType={selectedType}
        />
      )}

      {/* Main Chart Area */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Chart Builder</h3>
              {chartData && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                  {chartData.datasets.length} dataset(s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  showSettings
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Toggle settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <div className="h-6 w-px bg-gray-300" />

              <button
                onClick={() => handleExportImage('png')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                disabled={!chartData}
              >
                <ImageIcon className="w-4 h-4" />
                PNG
              </button>

              <button
                onClick={() => handleExportImage('jpg')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                disabled={!chartData}
              >
                <ImageIcon className="w-4 h-4" />
                JPG
              </button>

              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                disabled={!chartData}
              >
                <FileText className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>
        </div>

        <div className={`grid ${showSettings ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'} gap-6 p-6`}>
          {/* Settings Panel */}
          {showSettings && (
            <div className="lg:col-span-1 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Chart Configuration</h4>

                {/* Chart Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as ChartType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="scatter">Scatter Plot</option>
                    <option value="area">Area Chart</option>
                  </select>
                </div>

                {/* X Axis */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X-Axis (Categories)
                  </label>
                  <select
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select column...</option>
                    {allColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Y Axis */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Y-Axis (Values)
                  </label>
                  <select
                    value={yAxis}
                    onChange={(e) => setYAxis(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select column...</option>
                    {numericColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Group By */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group By (Optional)
                  </label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {categoricalColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    💡 Try different chart types to find the best visualization for your data
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chart Display */}
          <div className={showSettings ? 'lg:col-span-3' : 'col-span-1'}>
            <div ref={chartContainerRef}>
              {renderChart()}
            </div>

            {/* Chart Info */}
            {chartData && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Data Points</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {chartData.labels.length}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Series</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {chartData.datasets.length}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Chart Type</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {selectedType}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};