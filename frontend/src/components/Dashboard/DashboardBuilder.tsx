import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add,
  Save,
  Preview,
  Delete,
  DragIndicator,
  BarChart,
  ShowChart,
  PieChart,
  TableChart,
  ScatterPlot,
  BubbleChart,
  DonutLarge,
  Timeline,
  Settings,
  FilterList,
  Refresh,
  ContentCopy,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { dashboardService } from '../../services/dashboardService';
import { DraggableChartWidget } from './DraggableChartWidget';
import { ChartConfigurator } from './ChartConfigurator';
import { FilterPanel } from './FilterPanel';
import { ChartPreview } from './ChartPreview';

interface ChartWidget {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'donut' | 'table' | 'metric';
  title: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
  filters?: any[];
}

interface DashboardConfig {
  id?: number;
  name: string;
  description: string;
  layout: ChartWidget[];
  globalFilters: any[];
  refreshInterval?: number;
}

export const DashboardBuilder: React.FC = () => {
  const { datasetId, dashboardId } = useParams<{ datasetId: string; dashboardId?: string }>();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DashboardConfig>({
    name: 'New Dashboard',
    description: '',
    layout: [],
    globalFilters: []
  });

  const [widgets, setWidgets] = useState<ChartWidget[]>([]);
  const [activeWidget, setActiveWidget] = useState<ChartWidget | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [tabValue, setTabValue] = useState(0);
  const [columns, setColumns] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const chartTypes = [
    { type: 'bar', icon: <BarChart />, label: 'Bar Chart', description: 'Compare categories' },
    { type: 'line', icon: <ShowChart />, label: 'Line Chart', description: 'Show trends over time' },
    { type: 'pie', icon: <PieChart />, label: 'Pie Chart', description: 'Show proportions' },
    { type: 'scatter', icon: <ScatterPlot />, label: 'Scatter Plot', description: 'Show correlations' },
    { type: 'area', icon: <Timeline />, label: 'Area Chart', description: 'Show cumulative trends' },
    { type: 'donut', icon: <DonutLarge />, label: 'Donut Chart', description: 'Show part-to-whole' },
    { type: 'table', icon: <TableChart />, label: 'Data Table', description: 'Tabular view' },
    { type: 'metric', icon: <Dashboard />, label: 'Metric Card', description: 'Single KPI display' }
  ];

  useEffect(() => {
    loadDashboard();
    loadDatasetColumns();
  }, [dashboardId, datasetId]);

  const loadDashboard = async () => {
    if (dashboardId && dashboardId !== 'new') {
      try {
        const response = await dashboardService.getDashboard(parseInt(dashboardId));
        if (response.success) {
          setDashboard(response.data);
          setWidgets(response.data.layout || []);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        showSnackbar('Failed to load dashboard', 'error');
      }
    }
  };

  const loadDatasetColumns = async () => {
    try {
      const response = await dashboardService.getDatasetColumns(parseInt(datasetId!));
      if (response.success) {
        setColumns(response.data.columns);
      }
    } catch (error) {
      console.error('Failed to load columns:', error);
    }
  };

  // Update handlers with proper types:
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const widget = widgets.find(w => w.id === active.id);
    setActiveWidget(widget || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveWidget(null);
  };

  const addWidget = (type: string) => {
    const newWidget: ChartWidget = {
      id: `widget-${Date.now()}`,
      type: type as any,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      config: {
        x_axis: '',
        y_axis: '',
        aggregation: 'sum',
        color_scheme: 'default'
      },
      position: {
        x: 0,
        y: widgets.length * 2,
        w: 6,
        h: 4
      },
      filters: []
    };

    setWidgets([...widgets, newWidget]);
    setSelectedWidget(newWidget.id);
    setConfigDialogOpen(true);
  };

  const updateWidget = (widgetId: string, updates: Partial<ChartWidget>) => {
    setWidgets(widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w));
  };

  const deleteWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
    if (selectedWidget === widgetId) {
      setSelectedWidget(null);
    }
  };

  const duplicateWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      const newWidget = {
        ...widget,
        id: `widget-${Date.now()}`,
        title: `${widget.title} (Copy)`,
        position: {
          ...widget.position,
          y: widget.position.y + widget.position.h + 1
        }
      };
      setWidgets([...widgets, newWidget]);
    }
  };

  const saveDashboard = async () => {
    try {
      setSaving(true);

      const dashboardData = {
        ...dashboard,
        layout: widgets,
        dataset_id: parseInt(datasetId!)
      };

      let response;
      if (dashboardId && dashboardId !== 'new') {
        response = await dashboardService.updateDashboard(parseInt(dashboardId), dashboardData);
      } else {
        response = await dashboardService.createDashboard(dashboardData);
      }

      if (response.success) {
        showSnackbar('Dashboard saved successfully', 'success');
        if (!dashboardId || dashboardId === 'new') {
          navigate(`/datasets/${datasetId}/dashboards/${response.data.id}`);
        }
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save dashboard', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigSave = (config: any) => {
    if (selectedWidget) {
      updateWidget(selectedWidget, { config });
      setConfigDialogOpen(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleWidgetClick = (widgetId: string) => {
    setSelectedWidget(widgetId);
  };

  const handleWidgetEdit = (widgetId: string) => {
    setSelectedWidget(widgetId);
    setConfigDialogOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, widgetId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedWidget(widgetId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Left Sidebar - Widget Palette */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%'
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon />
            Add Widgets
          </Typography>

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Charts" />
            <Tab label="Metrics" />
          </Tabs>

          {tabValue === 0 && (
            <List>
              {chartTypes.filter(ct => ct.type !== 'metric').map((chartType) => (
                <ListItem
                  key={chartType.type}
                  onClick={() => addWidget(chartType.type)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'scale(1.02)',
                      transition: 'transform 0.2s'
                    }
                  }}
                >
                  <ListItemIcon>{chartType.icon}</ListItemIcon>
                  <ListItemText
                    primary={chartType.label}
                    secondary={chartType.description}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          )}

          {tabValue === 1 && (
            <List>
              <ListItem
                button
                onClick={() => addWidget('metric')}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemIcon>
                  <Dashboard />
                </ListItemIcon>
                <ListItemText
                  primary="Metric Card"
                  secondary="Display single KPI"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>

      {/* Main Canvas */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Toolbar */}
        <Paper sx={{ p: 2, borderRadius: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                size="small"
                value={dashboard.name}
                onChange={(e) => setDashboard({ ...dashboard, name: e.target.value })}
                placeholder="Dashboard Name"
                sx={{ width: 300 }}
              />
              <TextField
                size="small"
                value={dashboard.description}
                onChange={(e) => setDashboard({ ...dashboard, description: e.target.value })}
                placeholder="Description (optional)"
                sx={{ width: 400 }}
              />
            </Box>

            <Box display="flex" gap={1}>
              <Tooltip title="Global Filters">
                <IconButton onClick={() => setFilterPanelOpen(true)} color="primary">
                  <FilterList />
                </IconButton>
              </Tooltip>

              <Tooltip title="Preview">
                <IconButton onClick={() => setPreviewMode(!previewMode)} color={previewMode ? 'primary' : 'default'}>
                  <Preview />
                </IconButton>
              </Tooltip>

              <Tooltip title="Refresh Data">
                <IconButton onClick={loadDashboard}>
                  <Refresh />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={saveDashboard}
                disabled={saving || widgets.length === 0}
              >
                {saving ? 'Saving...' : 'Save Dashboard'}
              </Button>
            </Box>
          </Box>

          {widgets.length > 0 && (
            <Box mt={2}>
              <Chip
                label={`${widgets.length} widget${widgets.length !== 1 ? 's' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Paper>

        {/* Dashboard Canvas */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, backgroundColor: '#f5f5f5' }}>
          {widgets.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
            >
              <DashboardIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Start Building Your Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select a chart type from the left panel to add your first widget
              </Typography>
            </Box>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Grid container spacing={2}>
                <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
                  {widgets.map((widget) => (
                    <Grid
                      key={widget.id}
                      xs={widget.position.w}
                      sx={{
                        position: 'relative',
                        minHeight: widget.position.h * 100
                      }}
                    >
                      <DraggableChartWidget
                        widget={widget}
                        selected={selectedWidget === widget.id}
                        preview={previewMode}
                        onClick={() => handleWidgetClick(widget.id)}
                        onEdit={() => handleWidgetEdit(widget.id)}
                        onDelete={() => deleteWidget(widget.id)}
                        onDuplicate={() => duplicateWidget(widget.id)}
                        onMenuOpen={(e) => handleMenuOpen(e, widget.id)}
                        datasetId={parseInt(datasetId!)}
                      />
                    </Grid>
                  ))}
                </SortableContext>
              </Grid>

              <DragOverlay>
                {activeWidget ? (
                  <Card sx={{ width: 300, opacity: 0.8 }}>
                    <CardContent>
                      <Typography variant="h6">{activeWidget.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activeWidget.type.toUpperCase()}
                      </Typography>
                    </CardContent>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </Box>
      </Box>

      {/* Widget Configuration Dialog */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configure Widget
          {selectedWidget && (
            <TextField
              size="small"
              value={widgets.find(w => w.id === selectedWidget)?.title || ''}
              onChange={(e) => updateWidget(selectedWidget, { title: e.target.value })}
              placeholder="Widget Title"
              sx={{ ml: 2, width: 300 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedWidget && (
            <ChartConfigurator
              widget={widgets.find(w => w.id === selectedWidget)!}
              columns={columns}
              onSave={handleConfigSave}
              datasetId={parseInt(datasetId!)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setConfigDialogOpen(false)}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Panel */}
      <Drawer
        anchor="right"
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
      >
        <FilterPanel
          filters={dashboard.globalFilters}
          columns={columns}
          onFiltersChange={(filters) => setDashboard({ ...dashboard, globalFilters: filters })}
          onClose={() => setFilterPanelOpen(false)}
        />
      </Drawer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleWidgetEdit(selectedWidget!); handleMenuClose(); }}>
          <Settings sx={{ mr: 1 }} /> Configure
        </MenuItem>
        <MenuItem onClick={() => { duplicateWidget(selectedWidget!); handleMenuClose(); }}>
          <ContentCopy sx={{ mr: 1 }} /> Duplicate
        </MenuItem>
        <MenuItem onClick={() => { deleteWidget(selectedWidget!); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};