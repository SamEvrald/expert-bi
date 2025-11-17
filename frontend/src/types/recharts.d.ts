import 'recharts';

declare module 'recharts' {
  import { ComponentType, ReactNode } from 'react';

  export interface ResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
    aspect?: number;
    minWidth?: number;
    minHeight?: number;
    debounce?: number;
    children?: ReactNode;
    className?: string;
  }

  export const ResponsiveContainer: ComponentType<ResponsiveContainerProps>;
  export const BarChart: ComponentType<any>;
  export const LineChart: ComponentType<any>;
  export const PieChart: ComponentType<any>;
  export const ScatterChart: ComponentType<any>;
  export const AreaChart: ComponentType<any>;
  export const Bar: ComponentType<any>;
  export const Line: ComponentType<any>;
  export const Area: ComponentType<any>;
  export const Pie: ComponentType<any>;
  export const Scatter: ComponentType<any>;
  export const XAxis: ComponentType<any>;
  export const YAxis: ComponentType<any>;
  export const ZAxis: ComponentType<any>;
  export const CartesianGrid: ComponentType<any>;
  export const Tooltip: ComponentType<any>;
  export const Legend: ComponentType<any>;
  export const Cell: ComponentType<any>;
  export const Label: ComponentType<any>;
  export const LabelList: ComponentType<any>;
  export const ReferenceLine: ComponentType<any>;
  export const ReferenceArea: ComponentType<any>;
  export const ReferenceDot: ComponentType<any>;
  export const Brush: ComponentType<any>;
  export const ErrorBar: ComponentType<any>;
}