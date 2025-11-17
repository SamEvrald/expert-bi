import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemSecondaryAction
} from '@mui/material';
import { Add, Delete, Close } from '@mui/icons-material';

interface Filter {
  id: string;
  column: string;
  operator: string;
  value: string | number | boolean | null;
}

interface FilterPanelProps {
  filters: Filter[];
  columns: string[];
  onFiltersChange: (filters: Filter[]) => void;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  columns,
  onFiltersChange,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters || []);

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'between', label: 'Between' }
  ];

  const addFilter = () => {
    const newFilter: Filter = {
      id: `filter-${Date.now()}`,
      column: columns[0] || '',
      operator: 'equals',
      value: ''
    };
    setLocalFilters([...localFilters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    setLocalFilters(
      localFilters.map(f => f.id === id ? { ...f, ...updates } : f)
    );
  };

  const deleteFilter = (id: string) => {
    setLocalFilters(localFilters.filter(f => f.id !== id));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  return (
    <Box sx={{ width: 400, p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Global Filters</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List>
        {localFilters.map((filter) => (
          <ListItem key={filter.id} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel>Column</InputLabel>
              <Select
                value={filter.column}
                onChange={(e) => updateFilter(filter.id, { column: e.target.value })}
                label="Column"
                size="small"
              >
                {columns.map((col) => (
                  <MenuItem key={col} value={col}>
                    {col}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={filter.operator}
                onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                label="Operator"
                size="small"
              >
                {operators.map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    {op.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box display="flex" alignItems="center" gap={1}>
              <TextField
                fullWidth
                label="Value"
                value={filter.value || ''}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                size="small"
              />
              <IconButton onClick={() => deleteFilter(filter.id)} size="small" color="error">
                <Delete />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<Add />}
        onClick={addFilter}
        sx={{ mb: 2 }}
        disabled={columns.length === 0}
      >
        Add Filter
      </Button>

      <Box display="flex" gap={1}>
        <Button variant="outlined" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" fullWidth onClick={applyFilters}>
          Apply Filters
        </Button>
      </Box>
    </Box>
  );
};