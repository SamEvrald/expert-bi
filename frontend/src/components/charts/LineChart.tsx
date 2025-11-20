import React, { useRef, useEffect } from 'react';
import { Chart as ChartJS, registerables, ChartConfiguration } from 'chart.js';
import { ChartData, ChartOptions } from '../../types/charts';

ChartJS.register(...registerables);

interface LineChartProps {
  data: ChartData;
  options?: Partial<ChartOptions>;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  options = {},
  height = 400 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create new chart
    chartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: data.datasets.map((dataset) => ({
          ...dataset,
          tension: 0.4,
          fill: false,
        })),
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
  }, [data, options]);

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};