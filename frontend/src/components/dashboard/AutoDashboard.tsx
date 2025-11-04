import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Paper, Typography, Box, Button, CircularProgress, Alert } from '@mui/material';
import { AutoSizer } from 'react-virtualized';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DashboardChart } from './DashboardChart';
import { DashboardFilters } from './DashboardFilters';
import { InsightsSummary } from './InsightsSummary';
import { dashboardService } from '../../services/dashboardService';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  charts: ChartConfig[];
  layout: DashboardLayout;
  key_insights: string[];
  filters: any;
}

interface ChartConfig {
  id: string;
  type: string;
  title: string;
  description?: string;
  x_axis: string;
  y_axis?: string;
  chart_options?: any;
}

interface DashboardLayout {
  grid_size: { cols: number; rows: number };
  charts: {
    chart_id: string;
    position: { x: number; y: number; w: number; h: number };
  }[];
}

export const AutoDashboard: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>();
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any[]>([]);

  useEffect(() => {
    if (datasetId) {
      loadDashboard();
    }
  }, [datasetId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if dashboard exists
      const status = await dashboardService.getDashboardStatus(datasetId!);
      
      if (status.data.status === 'not_generated') {
        // Generate dashboard
        setGenerating(true);
        await dashboardService.generateDashboard(datasetId!);
      }

      // Load dashboard configuration
      const response = await dashboardService.getDashboard(datasetId!);
      setDashboard(response.data);

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handleRegenerateDashboard = async () => {
    try {
      setGenerating(true);
      await dashboardService.regenerateDashboard(datasetId!);
      await loadDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate dashboard');
    } finally {
      setGenerating(false);
    }
  };

  const convertLayoutForGridLayout = (layout: DashboardLayout) => {
    const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
    const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

    const layoutConfig: any = {};
    Object.keys(breakpoints).forEach(breakpoint => {
      layoutConfig[breakpoint] = layout.charts.map(chart => ({
        i: chart.chart_id,
        x: chart.position.x,
        y: chart.position.y,
        w: chart.position.w,
        h: chart.position.h,
        minW: 2,
        minH: 3
      }));
    });

    return { layouts: layoutConfig, breakpoints, cols };
  };

  if (loading || generating) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {generating ? 'Generating Dashboard...' : 'Loading Dashboard...'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {generating ? 'This may take a few moments' : 'Please wait'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDashboard}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!dashboard) {
    return (
      <Box p={3}>
        <Alert severity="info" sx={{ mb: 2 }}>
          No dashboard found. Generate one to get started.
        </Alert>
        <Button variant="contained" onClick={handleRegenerateDashboard}>
          Generate Dashboard
        </Button>
      </Box>
    );
  }

  const { layouts, breakpoints, cols } = convertLayoutForGridLayout(dashboard.layout);

  return (
    <Box sx={{ p: 3 }}>
      {/* Dashboard Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">{dashboard.name}</Typography>
          <Button variant="outlined" onClick={handleRegenerateDashboard}>
            Regenerate
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {dashboard.description}
        </Typography>

        {/* Key Insights */}
        <InsightsSummary insights={dashboard.key_insights} />
      </Paper>

      {/* Filters */}
      {dashboard.filters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <DashboardFilters
            filters={dashboard.filters}
            activeFilters={activeFilters}
            onFiltersChange={setActiveFilters}
          />
        </Paper>
      )}

      {/* Dashboard Grid */}
      <div style={{ minHeight: '70vh' }}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={60}
          isDraggable={true}
          isResizable={true}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {dashboard.charts.map((chart) => (
            <Paper key={chart.id} sx={{ p: 2 }}>
              <DashboardChart
                chartConfig={chart}
                datasetId={datasetId!}
                filters={activeFilters}
              />
            </Paper>
          ))}
        </ResponsiveGridLayout>
      </div>
    </Box>
  );
};