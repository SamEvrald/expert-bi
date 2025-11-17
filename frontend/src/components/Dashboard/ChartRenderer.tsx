import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

interface ChartRendererProps {
  type: string;
  data: any;
  config: any;
}

const COLORS = {
  default: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'],
  blues: ['#e3f2fd', '#90caf9', '#42a5f5', '#1e88e5', '#1565c0', '#0d47a1'],
  greens: ['#e8f5e9', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#2e7d32'],
  reds: ['#ffebee', '#ef5350', '#f44336', '#e53935', '#d32f2f', '#c62828'],
  rainbow: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0'],
  pastel: ['#ffd7e4', '#c9e4ff', '#fff5c9', '#daffd7', '#e7d7ff', '#ffd7d7']
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({ type, data, config }) => {
  const colors = COLORS[config.color_scheme as keyof typeof COLORS] || COLORS.default;

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={config.height || 400}>
      <BarChart data={data.chart_data}>
        {config.show_grid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={config.x_axis} label={{ value: config.x_label, position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: config.y_label, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {config.show_legend !== false && <Legend />}
        <Bar
          dataKey={config.y_axis}
          fill={colors[0]}
          animationDuration={config.animated !== false ? 1000 : 0}
        >
          {data.chart_data.map((_: any, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={config.height || 400}>
      <LineChart data={data.chart_data}>
        {config.show_grid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={config.x_axis} label={{ value: config.x_label, position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: config.y_label, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {config.show_legend !== false && <Legend />}
        <Line
          type="monotone"
          dataKey={config.y_axis}
          stroke={colors[0]}
          strokeWidth={2}
          dot={{ fill: colors[0] }}
          animationDuration={config.animated !== false ? 1000 : 0}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={config.height || 400}>
      <PieChart>
        <Pie
          data={data.chart_data}
          dataKey={config.y_axis}
          nameKey={config.x_axis}
          cx="50%"
          cy="50%"
          outerRadius={120}
          label={config.show_values}
          animationDuration={config.animated !== false ? 1000 : 0}
        >
          {data.chart_data.map((_: any, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        {config.show_legend !== false && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={config.height || 400}>
      <AreaChart data={data.chart_data}>
        {config.show_grid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={config.x_axis} label={{ value: config.x_label, position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: config.y_label, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {config.show_legend !== false && <Legend />}
        <Area
          type="monotone"
          dataKey={config.y_axis}
          stroke={colors[0]}
          fill={colors[0]}
          fillOpacity={0.6}
          animationDuration={config.animated !== false ? 1000 : 0}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderScatterChart = () => (
    <ResponsiveContainer width="100%" height={config.height || 400}>
      <ScatterChart>
        {config.show_grid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={config.x_axis} label={{ value: config.x_label, position: 'insideBottom', offset: -5 }} />
        <YAxis dataKey={config.y_axis} label={{ value: config.y_label, angle: -90, position: 'insideLeft' }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        {config.show_legend !== false && <Legend />}
        <Scatter
          data={data.chart_data}
          fill={colors[0]}
          animationDuration={config.animated !== false ? 1000 : 0}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );

  const renderDonutChart = () => (
    <ResponsiveContainer width="100%" height={config.height || 400}>
      <PieChart>
        <Pie
          data={data.chart_data}
          dataKey={config.y_axis}
          nameKey={config.x_axis}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={120}
          label={config.show_values}
          animationDuration={config.animated !== false ? 1000 : 0}
        >
          {data.chart_data.map((_: any, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        {config.show_legend !== false && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );

  const renderTable = () => {
    if (!data.chart_data || data.chart_data.length === 0) {
      return <Typography>No data available</Typography>;
    }

    const columns = Object.keys(data.chart_data[0]).map((key) => ({
      field: key,
      headerName: key,
      flex: 1,
      minWidth: 150
    }));

    const rows = data.chart_data.map((row: any, index: number) => ({
      id: index,
      ...row
    }));

    return (
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: config.limit || 10 }
          }
        }}
        pageSizeOptions={[5, 10, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
      />
    );
  };

  const renderMetricCard = () => {
    const value = data.summary?.value || data.chart_data?.[0]?.[config.y_axis] || 0;
    const label = config.title || config.y_axis;

    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100%"
        p={3}
      >
        <Typography variant="h2" color="primary" fontWeight={700}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="h6" color="text.secondary" mt={1}>
          {label}
        </Typography>
        {data.summary?.change && (
          <Typography
            variant="body1"
            color={data.summary.change > 0 ? 'success.main' : 'error.main'}
            mt={1}
          >
            {data.summary.change > 0 ? '+' : ''}{data.summary.change}%
          </Typography>
        )}
      </Box>
    );
  };

  switch (type) {
    case 'bar':
      return renderBarChart();
    case 'line':
      return renderLineChart();
    case 'pie':
      return renderPieChart();
    case 'area':
      return renderAreaChart();
    case 'scatter':
      return renderScatterChart();
    case 'donut':
      return renderDonutChart();
    case 'table':
      return renderTable();
    case 'metric':
      return renderMetricCard();
    default:
      return <Typography>Unsupported chart type: {type}</Typography>;
  }
};