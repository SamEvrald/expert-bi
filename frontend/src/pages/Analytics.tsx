import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Separator } from ",,/components/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from "recharts";
import { TrendingUp, BarChart3, Download, ArrowLeft, FileText, Database, Lightbulb, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ApiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type SampleValue = string | number | boolean | null;

interface ColumnInfo {
  name: string;
  type: 'number' | 'string' | 'boolean' | string;
  unique?: number;
  missing?: number;
  sample?: SampleValue[];
  [key: string]: unknown;
}

type ChartDataPoint = Record<string, string | number | boolean | null>;
interface ChartSpec {
  type: 'bar' | 'pie' | 'scatter' | string;
  data: ChartDataPoint[];
  xKey?: string;
  yKey?: string;
  valueKey?: string;
  title?: string;
}

interface AnalysisResult {
  columns: ColumnInfo[];
  rowCount: number;
  summary: {
    numerical: Record<string, { mean: number; median: number; std: number; min: number; max: number }>;
    categorical: Record<string, Record<string, number>>;
    correlations: Record<string, Record<string, number>>;
  };
  insights: string[];
  chartData: ChartSpec[];
}

type DatasetInfo = { originalName?: string; id?: number; fileName?: string; [key: string]: unknown };

const Analytics = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      if (location.state?.datasetId) {
        setLoading(true);
        try {
          const analysisResponse = await ApiService.getDatasetAnalysis(location.state.datasetId);
          setAnalysis(analysisResponse.data as AnalysisResult);
          setDataset({ originalName: 'Dataset Analysis' });
        } catch (error) {
          console.error('Failed to load analysis:', error);
          toast({
            title: "Error",
            description: "Failed to load analysis results",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      } else if (location.state?.analysis) {
        setAnalysis(location.state.analysis as AnalysisResult);
      }
    };

    loadAnalysis();
  }, [location.state, toast]);

  if (!user) return <Navigate to="/login" replace />;
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading analysis results...</span>
        </div>
      </div>
    );
  }
  if (!analysis) return <Navigate to="/upload" replace />;

  const chartConfig = {
    data: { label: "Data", color: "hsl(var(--chart-1))" },
    value: { label: "Value", color: "hsl(var(--chart-2))" },
  };

  const renderChart = (chart: ChartSpec, index: number) => {
    switch (chart.type) {
      case 'bar':
        return (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={chart.xKey} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey={chart.yKey} fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'pie':
        return (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chart.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey={chart.valueKey}
                >
                  {chart.data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'scatter':
        return (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={chart.xKey} />
                <YAxis dataKey={chart.yKey} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Scatter data={chart.data} dataKey={chart.yKey} fill="hsl(var(--chart-1))" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Data Analysis Report</h1>
                <p className="text-muted-foreground mt-1">
                  {dataset?.originalName || location.state?.fileName || 'Comprehensive insights from your data'}
                </p>
              </div>
            </div>
            <Button variant="gradient">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Rows</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{analysis.rowCount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Database className="h-6 w-6 text-chart-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Columns</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{analysis.columns.length}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <FileText className="h-6 w-6 text-chart-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Insights</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{analysis.insights.length}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Lightbulb className="h-6 w-6 text-chart-tertiary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              Key Insights
            </CardTitle>
            <CardDescription>
              Automatically generated insights from your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {analysis.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Column Information */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Column Overview
            </CardTitle>
            <CardDescription>
              Detailed information about each column in your dataset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.columns.map((col, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-foreground">{col.name}</h4>
                      <Badge variant={col.type === 'number' ? 'default' : col.type === 'string' ? 'secondary' : 'outline'}>
                        {col.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{col.unique ?? '—'} unique</span>
                      {col.missing && <span>{col.missing} missing</span>}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Sample values:</span>{' '}
                    {col.sample && col.sample.length > 0 ? (col.sample.slice(0, 3).join(', ')) : '—'}
                    {col.sample && col.sample.length > 3 && '...'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Visualizations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.chartData?.map((chart, index) => (
               <Card key={index} className="shadow-card">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <BarChart3 className="h-5 w-5 text-accent" />
                     {chart.title}
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   {renderChart(chart, index)}
                 </CardContent>
               </Card>
            )) || null}
          </div>
        </div>

        {/* Statistical Summary */}
        {analysis?.summary?.numerical && Object.keys(analysis.summary.numerical).length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-accent" />
                Statistical Summary
              </CardTitle>
              <CardDescription>
                Descriptive statistics for numerical columns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-medium">Column</th>
                      <th className="text-left p-2 font-medium">Mean</th>
                      <th className="text-left p-2 font-medium">Median</th>
                      <th className="text-left p-2 font-medium">Std Dev</th>
                      <th className="text-left p-2 font-medium">Min</th>
                      <th className="text-left p-2 font-medium">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analysis.summary.numerical).map(([col, stats]) => (
                      <tr key={col} className="border-b border-border">
                        <td className="p-2 font-medium">{col}</td>
                        <td className="p-2">{stats.mean}</td>
                        <td className="p-2">{stats.median}</td>
                        <td className="p-2">{stats.std}</td>
                        <td className="p-2">{stats.min}</td>
                        <td className="p-2">{stats.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;