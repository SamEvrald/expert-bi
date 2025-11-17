import { ChartType, ChartConfig } from '../types/api.types';
import { ChartData, ChartDataset, CHART_COLOR_PALETTE } from '../types/charts';

export function generateChartData(
  data: any[],
  config: ChartConfig
): ChartData {
  const { x_axis, y_axis, group_by, aggregation } = config;

  if (!x_axis || !y_axis) {
    return { labels: [], datasets: [] };
  }

  // Extract unique x values
  const xValues = Array.from(new Set(data.map((row) => row[x_axis])));
  
  // Handle grouped data
  if (group_by) {
    const groups = Array.from(new Set(data.map((row) => row[group_by])));
    const datasets: ChartDataset[] = groups.map((group, idx) => {
      const groupData = data.filter((row) => row[group_by] === group);
      const values = xValues.map((xVal) => {
        const matchingRows = groupData.filter((row) => row[x_axis] === xVal);
        return aggregateValues(matchingRows, y_axis, aggregation);
      });

      return {
        label: String(group),
        data: values,
        backgroundColor: CHART_COLOR_PALETTE[idx % CHART_COLOR_PALETTE.length],
        borderColor: CHART_COLOR_PALETTE[idx % CHART_COLOR_PALETTE.length],
        borderWidth: 2,
        fill: false,
      };
    });

    return {
      labels: xValues.map(String),
      datasets,
    };
  }

  // Single dataset
  const values = xValues.map((xVal) => {
    const matchingRows = data.filter((row) => row[x_axis] === xVal);
    return aggregateValues(matchingRows, y_axis, aggregation);
  });

  return {
    labels: xValues.map(String),
    datasets: [
      {
        label: Array.isArray(y_axis) ? y_axis.join(', ') : y_axis,
        data: values,
        backgroundColor: CHART_COLOR_PALETTE[0],
        borderColor: CHART_COLOR_PALETTE[0],
        borderWidth: 2,
        fill: false,
      },
    ],
  };
}

function aggregateValues(
  rows: any[],
  field: string | string[],
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
): number {
  if (rows.length === 0) return 0;

  const fields = Array.isArray(field) ? field : [field];
  const values = rows.flatMap((row) =>
    fields.map((f) => parseFloat(row[f]) || 0)
  );

  switch (aggregation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return rows.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

export function getChartTypeIcon(type: ChartType): string {
  const icons: Record<ChartType, string> = {
    line: '📈',
    bar: '📊',
    scatter: '⚫',
    pie: '🥧',
    histogram: '📉',
    box: '📦',
    heatmap: '🔥',
    area: '📐',
    bubble: '⭕',
    radar: '🎯',
    treemap: '🌳',
  };
  return icons[type] || '📊';
}

export function getChartTypeDescription(type: ChartType): string {
  const descriptions: Record<ChartType, string> = {
    line: 'Display trends over time or continuous data',
    bar: 'Compare values across categories',
    scatter: 'Show relationship between two variables',
    pie: 'Display proportions of a whole',
    histogram: 'Show distribution of numerical data',
    box: 'Display statistical distribution with quartiles',
    heatmap: 'Visualize data density with colors',
    area: 'Show cumulative trends over time',
    bubble: 'Display three dimensions of data',
    radar: 'Compare multiple variables',
    treemap: 'Display hierarchical data as nested rectangles',
  };
  return descriptions[type] || 'Visualize your data';
}

export async function exportChartAsImage(
  chartElement: HTMLCanvasElement,
  format: 'png' | 'jpg' | 'svg',
  fileName: string
): Promise<void> {
  if (format === 'svg') {
    // SVG export would require additional library
    throw new Error('SVG export not yet implemented');
  }

  const dataUrl = chartElement.toDataURL(`image/${format}`);
  const link = document.createElement('a');
  link.download = `${fileName}.${format}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadChartData(
  chartData: ChartData,
  fileName: string
): void {
  const csv = convertChartDataToCSV(chartData);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${fileName}.csv`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

function convertChartDataToCSV(chartData: ChartData): string {
  const headers = ['Label', ...chartData.datasets.map((d) => d.label)];
  const rows = chartData.labels.map((label, idx) => [
    label,
    ...chartData.datasets.map((d) => d.data[idx] || ''),
  ]);

  return [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
}