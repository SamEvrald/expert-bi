import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { TrendingUp, Analytics, Insights } from '@mui/icons-material';

interface InsightsSummaryProps {
  insights: string[];
}

export const InsightsSummary: React.FC<InsightsSummaryProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Insights color="primary" />
        Key Insights
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {insights.map((insight, index) => (
          <Chip
            key={index}
            label={insight}
            variant="outlined"
            color="primary"
            icon={index === 0 ? <TrendingUp /> : <Analytics />}
            sx={{ mb: 1 }}
          />
        ))}
      </Box>
    </Box>
  );
};