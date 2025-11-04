import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
import { dashboardService } from '../../services/dashboardService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartConfig {
  id: string;
  type: string;
  title: string;
  description?: string;
  x_axis: string;
  y_axis?: string;
  chart_options?: any;
}

interface DashboardChartProps {
  chartConfig: ChartConfig;
  datasetId: string;
  filters?: any[];
}

export const DashboardChart: React.FC<DashboardChartProps> = ({
  chartConfig,
  datasetId,
  filters = []
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [chartConfig.id, filters]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getChartData(
        datasetId,
        chartConfig.id,
        filters
      );

      setData(response.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!data || data.length === 0) return null;

    const colors = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
    ];

    switch (chartConfig.type) {
      case 'pie':
        return {
          labels: data.map(item => item.label || item.x),
          datasets: [{
            data: data.map(item => item.value || item.y),
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.8', '1')),
            borderWidth: 1,
          }]
        };

      case 'line':
      case 'area':
        return {
          labels: data.map(item => item.x),
          datasets: [{
            label: chartConfig.y_axis || 'Value',
            data: data.map(item => item.y),
            borderColor: colors[0],
            backgroundColor: chartConfig.type === 'area' ? colors[0].replace('0.8', '0.2') : 'transparent',
            fill: chartConfig.type === 'area',
            tension: 0.4,
          }]
        };

      case 'bar':
        return {
          labels: data.map(item => item.x),
          datasets: [{
            label: chartConfig.y_axis || 'Value',
            data: data.map(item => item.y),
            backgroundColor: colors[0],
            borderColor: colors[0].replace('0.8', '1'),
            borderWidth: 1,
          }]
        };

      case 'scatter':
        return {
          datasets: [{
            label: `${chartConfig.x_axis} vs ${chartConfig.y_axis}`,
            data: data.map(item => ({ x: item.x, y: item.y })),
            backgroundColor: colors[0],
            borderColor: colors[0].replace('0.8', '1'),
          }]
        };

      default:
        return null;
    }
  };

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false,
        },
      },
    };

    if (chartConfig.type === 'scatter') {
      return {
        ...baseOptions,
        scales: {
          x: {
            title: {
              display: true,
              text: chartConfig.x_axis
            }
          },
          y: {
            title: {
              display: true,
              text: chartConfig.y_axis
            }
          }
        }
      };
    }

    return baseOptions;
  };

  const renderChart = () => {
    const chartData = prepareChartData();
    if (!chartData) return null;

    const options = getChartOptions();

    switch (chartConfig.type) {
      case 'line':
      case 'area':
        return <Line data={chartData} options={options} />;
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      case 'scatter':
        return <Scatter data={chartData} options={options} />;
      default:
        return <Alert severity="warning">Unsupported chart type: {chartConfig.type}</Alert>;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chart Header */}
      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          {chartConfig.title}
        </Typography>
        {chartConfig.description && (
          <Typography variant="body2" color="text.secondary">
            {chartConfig.description}
          </Typography>
        )}
      </Box>

      {/* Chart Content */}
      <Box sx={{ flexGrow: 1, position: 'relative', minHeight: 200 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          renderChart()
        )}
      </Box>
    </Box>
  );
};