import React, { useRef, useEffect } from 'react';
import { Chart as ChartJS, registerables, ChartConfiguration } from 'chart.js';
import { ChartData, ChartOptions, CHART_COLOR_PALETTE } from '../../types/charts';

ChartJS.register(...registerables);

interface PieChartProps {
  data: ChartData;
  options?: Partial<ChartOptions>;
  height?: number;
  type?: 'pie' | 'doughnut';
}

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  options = {},
  height = 400,
  type = 'pie'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // For pie charts, use the first dataset
    const dataset = data.datasets[0] || { data: [], label: '' };

    chartRef.current = new ChartJS(ctx, {
      type: type,
      data: {
        labels: data.labels,
        datasets: [
          {
            ...dataset,
            backgroundColor: data.labels.map(
              (_, idx) => CHART_COLOR_PALETTE[idx % CHART_COLOR_PALETTE.length]
            ),
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options,
      } as ChartConfiguration['options'],
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, options, type]);

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};