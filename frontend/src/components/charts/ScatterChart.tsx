import React, { useRef, useEffect } from 'react';
import { Chart as ChartJS, registerables, ChartConfiguration } from 'chart.js';
import { ChartData, ChartOptions } from '../../types/charts';

ChartJS.register(...registerables);

interface ScatterChartProps {
  data: ChartData;
  options?: Partial<ChartOptions>;
  height?: number;
}

export const ScatterChart: React.FC<ScatterChartProps> = ({ 
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

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Convert data to scatter format
    const scatterData = {
      datasets: data.datasets.map((dataset, idx) => ({
        label: dataset.label,
        data: data.labels.map((label, i) => ({
          x: i,
          y: dataset.data[i],
        })),
        backgroundColor: dataset.backgroundColor,
        borderColor: dataset.borderColor,
        pointRadius: 5,
        pointHoverRadius: 7,
      })),
    };

    const config: ChartConfiguration<'scatter'> = {
      type: 'scatter',
      data: scatterData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options,
      },
    };

    chartRef.current = new ChartJS(ctx, config);

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