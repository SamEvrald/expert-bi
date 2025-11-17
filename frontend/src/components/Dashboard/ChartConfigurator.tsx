import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

interface ChartConfig {
  x_axis?: string;
  y_axis?: string;
  aggregation?: string;
  group_by?: string;
  color_scheme?: string;
  show_legend?: boolean;
  show_grid?: boolean;
  show_values?: boolean;
  height?: number;
  animated?: boolean;
  sort_order?: string;
  limit?: number | null;
  x_label?: string;
  y_label?: string;
  stacked?: boolean;
}

interface Widget {
  type: 'bar' | 'line' | 'pie' | 'area' | string;
  config?: ChartConfig;
}

interface ChartConfiguratorProps {
  widget: Widget;
  columns: string[];
  onSave: (config: ChartConfig) => void;
  datasetId: number;
}

export const ChartConfigurator: React.FC<ChartConfiguratorProps> = ({
  widget,
  columns,
  onSave,
}) => {
  const [config, setConfig] = useState<ChartConfig>(widget.config || {});

  const aggregationOptions = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'median', label: 'Median' }
  ];

  const colorSchemes = [
    { value: 'default', label: 'Default' },
    { value: 'blues', label: 'Blues' },
    { value: 'greens', label: 'Greens' },
    { value: 'reds', label: 'Reds' },
    { value: 'rainbow', label: 'Rainbow' },
    { value: 'pastel', label: 'Pastel' }
  ];

  const handleConfigChange = (key: string, value: string | number | boolean | null) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onSave(newConfig);
  };

  const renderAxisConfiguration = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
        Data Configuration
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* X-Axis */}
        <FormControl fullWidth>
          <InputLabel>X-Axis (Category)</InputLabel>
          <Select
            value={config.x_axis || ''}
            onChange={(e) => handleConfigChange('x_axis', e.target.value)}
            label="X-Axis (Category)"
          >
            {columns.map((col) => (
              <MenuItem key={col} value={col}>
                {col}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Y-Axis */}
        <FormControl fullWidth>
          <InputLabel>Y-Axis (Value)</InputLabel>
          <Select
            value={config.y_axis || ''}
            onChange={(e) => handleConfigChange('y_axis', e.target.value)}
            label="Y-Axis (Value)"
          >
            {columns.map((col) => (
              <MenuItem key={col} value={col}>
                {col}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Aggregation */}
        <FormControl fullWidth>
          <InputLabel>Aggregation</InputLabel>
          <Select
            value={config.aggregation || 'sum'}
            onChange={(e) => handleConfigChange('aggregation', e.target.value)}
            label="Aggregation"
          >
            {aggregationOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Group By (Optional) */}
        {(widget.type === 'bar' || widget.type === 'line') && (
          <FormControl fullWidth>
            <InputLabel>Group By (Optional)</InputLabel>
            <Select
              value={config.group_by || ''}
              onChange={(e) => handleConfigChange('group_by', e.target.value)}
              label="Group By (Optional)"
            >
              <MenuItem value="">None</MenuItem>
              {columns.map((col) => (
                <MenuItem key={col} value={col}>
                  {col}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    </Box>
  );

  const renderStyleConfiguration = () => (
    <Box mt={3}>
      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
        Style Configuration
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* Color Scheme */}
        <FormControl fullWidth>
          <InputLabel>Color Scheme</InputLabel>
          <Select
            value={config.color_scheme || 'default'}
            onChange={(e) => handleConfigChange('color_scheme', e.target.value)}
            label="Color Scheme"
          >
            {colorSchemes.map((scheme) => (
              <MenuItem key={scheme.value} value={scheme.value}>
                {scheme.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Show Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.show_legend !== false}
                onChange={(e) => handleConfigChange('show_legend', e.target.checked)}
              />
            }
            label="Show Legend"
          />
        </Box>

        {/* Show Grid */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.show_grid !== false}
                onChange={(e) => handleConfigChange('show_grid', e.target.checked)}
              />
            }
            label="Show Grid"
          />
        </Box>

        {/* Show Values */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.show_values || false}
                onChange={(e) => handleConfigChange('show_values', e.target.checked)}
              />
            }
            label="Show Values on Chart"
          />
        </Box>

        {/* Chart Height */}
        <TextField
          fullWidth
          type="number"
          label="Chart Height (px)"
          value={config.height || 400}
          onChange={(e) => handleConfigChange('height', parseInt(e.target.value))}
          inputProps={{ min: 200, max: 800 }}
        />

        {/* Animation */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.animated !== false}
                onChange={(e) => handleConfigChange('animated', e.target.checked)}
              />
            }
            label="Enable Animation"
          />
        </Box>
      </Box>
    </Box>
  );

  const renderAdvancedOptions = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography>Advanced Options</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {/* Sort Order */}
            <FormControl fullWidth>
              <InputLabel>Sort Order</InputLabel>
              <Select
                value={config.sort_order || 'none'}
                onChange={(e) => handleConfigChange('sort_order', e.target.value)}
                label="Sort Order"
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>

            {/* Limit Results */}
            <TextField
              fullWidth
              type="number"
              label="Limit Results"
              value={config.limit || ''}
              onChange={(e) => handleConfigChange('limit', parseInt(e.target.value) || null)}
              placeholder="No limit"
              inputProps={{ min: 1 }}
            />
          </Box>

          {/* Custom Labels */}
          <TextField
            fullWidth
            label="X-Axis Label"
            value={config.x_label || ''}
            onChange={(e) => handleConfigChange('x_label', e.target.value)}
            placeholder="Auto-generated"
          />

          <TextField
            fullWidth
            label="Y-Axis Label"
            value={config.y_label || ''}
            onChange={(e) => handleConfigChange('y_label', e.target.value)}
            placeholder="Auto-generated"
          />

          {/* Stacked Chart */}
          {(widget.type === 'bar' || widget.type === 'area') && (
            <FormControlLabel
              control={
                <Switch
                  checked={config.stacked || false}
                  onChange={(e) => handleConfigChange('stacked', e.target.checked)}
                />
              }
              label="Stacked Chart"
            />
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box sx={{ p: 2 }}>
      {renderAxisConfiguration()}
      <Divider sx={{ my: 3 }} />
      {renderStyleConfiguration()}
      <Divider sx={{ my: 3 }} />
      {renderAdvancedOptions()}
    </Box>
  );
};