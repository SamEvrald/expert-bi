import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface ChartData {
  rowDistribution: Array<{ name: string; value: number }>;
  columnTypes?: Array<{ name: string; value: number }>;
  dataQuality?: Array<{ name: string; completeness: number; missing: number }>;
  topCategories?: Record<string, Array<{ name: string; value: number }>>;
}

interface DataVisualizerProps {
  chartData: ChartData;
  statistics?: {
    numerical: Record<string, {
      mean: number;
      median: number;
      std: number;
      min: number;
      max: number;
      count: number;
    }>;
    categorical: Record<string, Record<string, number>>;
  };
}

const DataVisualizer = ({ chartData, statistics }: DataVisualizerProps) => {
  const chartConfig = {
    data: { label: "Data", color: "hsl(var(--chart-1))" },
    value: { label: "Value", color: "hsl(var(--chart-2))" },
  };

  return (
    <div className="space-y-6">
      {/* Row Distribution Chart */}
      {chartData.rowDistribution && chartData.rowDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dataset Overview
            </CardTitle>
            <CardDescription>Basic dataset metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.rowDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Column Types Distribution */}
      {chartData.columnTypes && chartData.columnTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Column Types Distribution
            </CardTitle>
            <CardDescription>Distribution of data types across columns</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.columnTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {chartData.columnTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Data Quality Chart */}
      {chartData.dataQuality && chartData.dataQuality.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Data Completeness by Column
            </CardTitle>
            <CardDescription>Percentage of complete vs missing data per column</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.dataQuality}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completeness" fill="#10b981" name="Complete %" />
                  <Bar dataKey="missing" fill="#ef4444" name="Missing %" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Statistical Distribution Charts */}
      {statistics?.numerical && Object.keys(statistics.numerical).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Numerical Data Distribution
            </CardTitle>
            <CardDescription>Statistical overview of numerical columns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(statistics.numerical).map(([column, stats]) => {
                const distributionData = [
                  { name: 'Min', value: stats.min },
                  { name: 'Mean', value: stats.mean },
                  { name: 'Median', value: stats.median },
                  { name: 'Max', value: stats.max }
                ];

                return (
                  <div key={column} className="space-y-2">
                    <h4 className="font-medium">{column} Distribution</h4>
                    <ChartContainer config={chartConfig} className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={distributionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categorical Data Charts */}
      {statistics?.categorical && Object.keys(statistics.categorical).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Categorical Data Distribution
            </CardTitle>
            <CardDescription>Value distribution for categorical columns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(statistics.categorical).slice(0, 3).map(([column, counts]) => {
                const chartData = Object.entries(counts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([key, value]) => ({ name: key, value }));

                return (
                  <div key={column} className="space-y-2">
                    <h4 className="font-medium">{column} - Top Values</h4>
                    <ChartContainer config={chartConfig} className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataVisualizer;