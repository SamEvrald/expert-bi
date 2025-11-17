import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Menu,
  MenuItem
} from '@mui/material';
import {
  DragIndicator,
  MoreVert,
  Settings,
  Delete,
  ContentCopy,
  Refresh
} from '@mui/icons-material';
import { dashboardService } from '../../services/dashboardService';
import { ChartRenderer } from './ChartRenderer';

interface DraggableChartWidgetProps {
  widget: any;
  selected: boolean;
  preview: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  datasetId: number;
}

export const DraggableChartWidget: React.FC<DraggableChartWidgetProps> = ({
  widget,
  selected,
  preview,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  onMenuOpen,
  datasetId
}) => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    loadChartData();
  }, [widget.config, widget.filters]);

  const loadChartData = async () => {
    if (!widget.config.x_axis || !widget.config.y_axis) {
      setLoading(false);
      setError('Please configure chart axes');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getChartData(datasetId, {
        chart_type: widget.type,
        config: widget.config,
        filters: widget.filters || []
      });

      if (response.success) {
        setChartData(response.data);
      } else {
        setError('Failed to load chart data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = () => {
    loadChartData();
    handleMenuClose();
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        onClick={onClick}
        sx={{
          height: '100%',
          border: selected ? '2px solid' : '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          cursor: preview ? 'default' : 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: preview ? 2 : 4,
            transform: preview ? 'none' : 'translateY(-2px)'
          }
        }}
      >
        <CardHeader
          avatar={
            !preview && (
              <Box
                {...attributes}
                {...listeners}
                sx={{
                  cursor: 'grab',
                  '&:active': { cursor: 'grabbing' },
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <DragIndicator />
              </Box>
            )
          }
          action={
            !preview && (
              <IconButton onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
            )
          }
          title={widget.title}
          titleTypographyProps={{ variant: 'h6', noWrap: true }}
          subheader={widget.type.toUpperCase()}
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ height: 'calc(100% - 80px)', pt: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : chartData ? (
            <ChartRenderer
              type={widget.type}
              data={chartData}
              config={widget.config}
            />
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Configure this widget to display data
            </Alert>
          )}
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEdit(); handleMenuClose(); }}>
          <Settings sx={{ mr: 1 }} fontSize="small" /> Configure
        </MenuItem>
        <MenuItem onClick={handleRefresh}>
          <Refresh sx={{ mr: 1 }} fontSize="small" /> Refresh
        </MenuItem>
        <MenuItem onClick={() => { onDuplicate(); handleMenuClose(); }}>
          <ContentCopy sx={{ mr: 1 }} fontSize="small" /> Duplicate
        </MenuItem>
        <MenuItem onClick={() => { onDelete(); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" /> Delete
        </MenuItem>
      </Menu>
    </div>
  );
};