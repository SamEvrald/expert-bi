import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useParams, Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, LineChart, Line } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, BarChart3, Download, ArrowLeft, FileText, Database, Lightbulb, Loader2, AlertTriangle, CheckCircle, Info, Filter, SortAsc, SortDesc, Eye, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import LoadingAnalysis from '@/components/LoadingAnalysis';
import ErrorHandler from '../utils/errorHandler';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface ColumnInfo {
  name: string;
  type: 'number' | 'string' | 'boolean' | string;
  nullCount?: number;
  uniqueCount?: number;
  sampleValues?: (string | number)[];
  completeness?: number;
  [key: string]: unknown;
}

interface Insight {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description: string;
}

interface StatisticalSummary {
  numerical: Record<string, {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    count: number;
  }>;
  categorical: Record<string, Record<string, number>>;
}

interface DataQuality {
  score: string;
  completeness: number;
  uniqueness: number;
  missingValues: number;
  duplicates: number;
  totalCells: number;
}

interface ChartData {
  rowDistribution: Array<{ name: string; value: number }>;
  columnTypes?: Array<{ name: string; value: number }>;
  dataQuality?: Array<{ name: string; completeness: number; missing: number }>;
  topCategories?: Record<string, Array<{ name: string; value: number }>>;
}

interface AnalysisResult {
  summary: {
    totalRows: number;
    totalColumns: number;
    fileSize: number;
    status: string;
    dataQuality?: string;
  };
  columns: ColumnInfo[];
  insights: Insight[];
  statistics?: StatisticalSummary;
  chartData: ChartData;
  preview: Array<Record<string, string | number | boolean | null>>;
  dataQuality?: DataQuality;
}

interface DrillDownData {
  column: string;
  data: Array<Record<string, unknown>>;
  title: string;
}

interface ChartClickData {
  activeLabel?: string;
}

type SortByType = 'name' | 'completeness' | 'uniqueness';
type SortOrderType = 'asc' | 'desc';
type StatisticViewType = 'mean' | 'median' | 'std' | 'all';
type ChartTypeType = 'bar' | 'line' | 'scatter';

const Analytics = () => {
  const { user } = useAuth();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState<{ originalName?: string; id?: number } | null>(null);
  
  // Interactive filters and sorting
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortByType>('name');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('asc');
  const [filterText, setFilterText] = useState('');
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [statisticView, setStatisticView] = useState<StatisticViewType>('mean');
  const [chartType, setChartType] = useState<ChartTypeType>('bar');
  const [topN, setTopN] = useState([10]);
  
  // Drill-down state
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  // Filtered and sorted data
  const filteredColumns = useMemo(() => {
    if (!analysis) return [];
    
    const filtered = analysis.columns.filter(col => {
      const matchesFilter = filterText === '' || 
        col.name.toLowerCase().includes(filterText.toLowerCase()) ||
        col.type.toLowerCase().includes(filterText.toLowerCase());
      
      const hasIssues = (col.nullCount && col.nullCount > 0) || 
        (col.completeness && col.completeness < 100);
      
      return matchesFilter && (!showOnlyIssues || hasIssues);
    });

    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      
      switch (sortBy) {
        case 'completeness':
          aVal = a.completeness || 0;
          bVal = b.completeness || 0;
          break;
        case 'uniqueness':
          aVal = a.uniqueCount || 0;
          bVal = b.uniqueCount || 0;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [analysis, filterText, showOnlyIssues, sortBy, sortOrder]);

  // Statistical chart data based on selected view
  const statisticalChartData = useMemo(() => {
    if (!analysis?.statistics?.numerical) return [];
    
    return Object.entries(analysis.statistics.numerical).map(([column, stats]) => ({
      name: column,
      mean: stats.mean,
      median: stats.median,
      std: stats.std,
      min: stats.min,
      max: stats.max,
      count: stats.count
    }));
  }, [analysis]);

  // Top categorical data based on topN filter
  const topCategoricalData = useMemo(() => {
    if (!analysis?.statistics?.categorical) return {};
    
    const result: Record<string, Array<{ name: string; value: number }>> = {};
    
    Object.entries(analysis.statistics.categorical).forEach(([column, counts]) => {
      result[column] = Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, topN[0])
        .map(([key, value]) => ({ name: key, value }));
    });
    
    return result;
  }, [analysis, topN]);

  useEffect(() => {
    const loadAnalysis = async () => {
      const datasetId = params.id || location.state?.datasetId;
      
      if (datasetId) {
        setLoading(true);
        try {
          const datasetResponse = await api.getDataset(datasetId);
          
          if (!datasetResponse.success || !datasetResponse.data) {
            throw new Error('Failed to fetch dataset');
          }
          
          const datasetData = datasetResponse.data;
          
          setDataset({ 
            originalName: datasetData.name || `Dataset ${datasetId}`,
            id: parseInt(datasetId.toString())
          });

          if (datasetData.status !== 'ready') {
            console.log(`Dataset status: ${datasetData.status}, waiting...`);
            setTimeout(() => loadAnalysis(), 2000);
            return;
          }

          const analysisResponse = await api.getDatasetAnalysis(datasetId);
          
          if (!analysisResponse.success || !analysisResponse.data) {
            throw new Error('Failed to fetch analysis');
          }
          
          const analysisData = analysisResponse.data;
          
          // Build summary from available data
          const summary = {
            totalRows: analysisData.row_count || 0,
            totalColumns: analysisData.column_count || 0,
            fileSize: datasetData.file_size || 0,
            status: datasetData.status || 'ready',
            dataQuality: analysisData.dataQuality?.score || 'Good'
          };

          // Ensure columns are in the right format with proper type assertions
          const columns: ColumnInfo[] = analysisData.columns.map(col => {
            const nullCount = typeof col.null_count === 'number' ? col.null_count : 0;
            const totalRows = summary.totalRows;
            
            return {
              name: col.name,
              type: typeof col.data_type === 'string' ? col.data_type : 'string',
              nullCount: nullCount,
              uniqueCount: typeof col.unique_count === 'number' ? col.unique_count : undefined,
              sampleValues: Array.isArray(col.sample_values) 
                ? col.sample_values.map(v => typeof v === 'string' || typeof v === 'number' ? v : String(v))
                : undefined,
              completeness: totalRows > 0
                ? ((totalRows - nullCount) / totalRows * 100)
                : 100
            };
          });

          // Create default insights if not provided
          const insights = analysisData.insights || [];

          // Transform the analysis data
          const transformedAnalysis: AnalysisResult = {
            summary,
            columns,
            insights,
            statistics: analysisData.statistics || { numerical: {}, categorical: {} },
            chartData: {
              rowDistribution: analysisData.chartData?.rowDistribution || [
                { name: 'Total Rows', value: summary.totalRows }
              ],
              columnTypes: analysisData.chartData?.columnTypes || [],
              dataQuality: analysisData.chartData?.dataQuality || [],
              topCategories: analysisData.chartData?.topCategories || {}
            },
            preview: (analysisData.preview || []).map(row => {
              const cleanRow: Record<string, string | number | boolean | null> = {};
              for (const [key, value] of Object.entries(row)) {
                if (value === null || value === undefined) {
                  cleanRow[key] = null;
                } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                  cleanRow[key] = value;
                } else {
                  cleanRow[key] = String(value);
                }
              }
              return cleanRow;
            }),
            dataQuality: analysisData.dataQuality
          };
          
          console.log('Analysis data received:', transformedAnalysis);
          setAnalysis(transformedAnalysis);
          
        } catch (error) {
          console.error('Failed to load analysis:', error);
          toast({
            title: "Error",
            description: "Failed to load analysis results",
            variant: "destructive",
          });
          
          setTimeout(() => {
            navigate('/upload');
          }, 3000);
        } finally {
          setLoading(false);
        }
      } else if (location.state?.analysis) {
        const stateAnalysis = location.state.analysis as AnalysisResult;
        if (!stateAnalysis.chartData.topCategories) {
          stateAnalysis.chartData.topCategories = {};
        }
        setAnalysis(stateAnalysis);
      } else {
        navigate('/upload');
      }
    };

    loadAnalysis();
  }, [params.id, location.state, toast, navigate]);

  const handleDrillDown = (column: string, type: 'categorical' | 'numerical') => {
    if (!analysis) return;
    
    const drillData: DrillDownData = {
      column,
      title: `${column} - Detailed View`,
      data: []
    };

    if (type === 'categorical' && analysis.statistics?.categorical[column]) {
      drillData.data = Object.entries(analysis.statistics.categorical[column])
        .map(([key, value]) => ({ category: key, count: value, percentage: (value / analysis.summary.totalRows * 100).toFixed(2) }))
        .sort((a, b) => (b.count as number) - (a.count as number));
    } else if (type === 'numerical' && analysis.statistics?.numerical[column]) {
      const stats = analysis.statistics.numerical[column];
      drillData.data = [
        { metric: 'Mean', value: stats.mean.toFixed(2) },
        { metric: 'Median', value: stats.median.toFixed(2) },
        { metric: 'Standard Deviation', value: stats.std.toFixed(2) },
        { metric: 'Minimum', value: stats.min },
        { metric: 'Maximum', value: stats.max },
        { metric: 'Count', value: stats.count }
      ];
    }

    setDrillDownData(drillData);
    setShowDrillDown(true);
  };

  const handleChartClick = (data: ChartClickData, column: string) => {
    // Determine if it's categorical or numerical
    const isNumerical = analysis?.statistics?.numerical[column];
    handleDrillDown(column, isNumerical ? 'numerical' : 'categorical');
  };

  const handleDetectTypes = async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const datasetId = parseInt(params.id);

      const result = await api.detectTypes(datasetId);
      if (result.success && result.data) {
        setAnalysis((prev) => ({
          ...prev!,
          columns: prev?.columns.map((col) => ({
            ...col,
            type: result.data.columns[col.name]?.detected_type || col.type,
          })) || [],
        }));
      }
    } catch (err) {
      ErrorHandler.handle(err, 'Failed to detect column types');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!params.id) return;

    try {
      const datasetId = parseInt(params.id);
      const blob = await api.exportDataset(datasetId, 'csv');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset?.originalName || 'dataset'}_analysis.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      ErrorHandler.handle(err, 'Failed to export dataset');
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  
  if (loading) {
    return <LoadingAnalysis />;
  }
  
  if (!analysis && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No Analysis Found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find analysis data for this dataset. Redirecting to upload page...
            </p>
            <Button onClick={() => navigate('/upload')}>
              Go to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartConfig = {
    data: { label: "Data", color: "hsl(var(--chart-1))" },
    value: { label: "Value", color: "hsl(var(--chart-2))" },
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Interactive Data Analysis</h1>
                <p className="text-muted-foreground mt-1">
                  {dataset?.originalName || 'Complete insights and statistical analysis'}
                </p>
              </div>
            </div>
            <Button variant="default" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quality">Data Quality</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="visualizations">Interactive Charts</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Filters and Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="filter-text">Search Columns</Label>
                    <Input
                      id="filter-text"
                      placeholder="Filter by name or type..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sort-by">Sort By</Label>
                    <Select value={sortBy} onValueChange={(value: SortByType) => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="completeness">Completeness</SelectItem>
                        <SelectItem value="uniqueness">Unique Values</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sort-order">Sort Order</Label>
                    <Button
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="w-full justify-start"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                      {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-issues"
                      checked={showOnlyIssues}
                      onCheckedChange={setShowOnlyIssues}
                    />
                    <Label htmlFor="show-issues">Show only issues</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Rows</p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {analysis?.summary?.totalRows?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <Database className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Columns</p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {analysis?.summary?.totalColumns || analysis?.columns?.length || '0'}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data Quality</p>
                      <p className="text-2xl font-bold text-foreground mt-2">
                        {analysis?.dataQuality?.score || 'Good'}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">File Size</p>
                      <p className="text-2xl font-bold text-foreground mt-2">
                        {((analysis?.summary?.fileSize || 0) / 1024).toFixed(1)}KB
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Column Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Column Overview ({filteredColumns.length} columns)</CardTitle>
                <CardDescription>Click on any column to see detailed analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredColumns.map((col, index) => (
                    <div 
                      key={index} 
                      className="p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleDrillDown(col.name, col.type === 'number' ? 'numerical' : 'categorical')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-foreground">{col.name}</h4>
                          <Badge variant={col.type === 'number' ? 'default' : 'secondary'}>
                            {col.type}
                          </Badge>
                          {col.completeness !== undefined && (
                            <Badge variant="outline">
                              {col.completeness}% complete
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{col.uniqueCount ?? '—'} unique</span>
                          {col.nullCount && <span>{col.nullCount} missing</span>}
                          <Eye className="h-4 w-4" />
                        </div>
                      </div>
                      {col.sampleValues && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Sample values:</span>{' '}
                          {col.sampleValues.slice(0, 3).join(', ')}
                          {col.sampleValues.length > 3 && '...'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            {/* Statistics Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Statistics View Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="statistic-view">Statistic to Display</Label>
                    <Select value={statisticView} onValueChange={(value: StatisticViewType) => setStatisticView(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mean">Mean</SelectItem>
                        <SelectItem value="median">Median</SelectItem>
                        <SelectItem value="std">Standard Deviation</SelectItem>
                        <SelectItem value="all">All Statistics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="chart-type">Chart Type</Label>
                    <Select value={chartType} onValueChange={(value: ChartTypeType) => setChartType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="scatter">Scatter Plot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="top-n">Top N Categories: {topN[0]}</Label>
                    <Slider
                      value={topN}
                      onValueChange={setTopN}
                      max={20}
                      min={5}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Statistical Charts */}
            {analysis?.statistics?.numerical && Object.keys(analysis.statistics.numerical).length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Numerical Statistics - {statisticView === 'all' ? 'All Metrics' : statisticView.charAt(0).toUpperCase() + statisticView.slice(1)}</CardTitle>
                    <CardDescription>Click on any bar to see detailed breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                          <BarChart data={statisticalChartData} onClick={(data) => data?.activeLabel && handleChartClick(data, data.activeLabel)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            {statisticView === 'all' ? (
                              <>
                                <Bar dataKey="mean" fill="hsl(var(--chart-1))" name="Mean" />
                                <Bar dataKey="median" fill="hsl(var(--chart-2))" name="Median" />
                                <Bar dataKey="std" fill="hsl(var(--chart-3))" name="Std Dev" />
                              </>
                            ) : (
                              <Bar dataKey={statisticView} fill="hsl(var(--chart-1))" name={statisticView.charAt(0).toUpperCase() + statisticView.slice(1)} />
                            )}
                          </BarChart>
                        ) : chartType === 'line' ? (
                          <LineChart data={statisticalChartData} onClick={(data) => data?.activeLabel && handleChartClick(data, data.activeLabel)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            {statisticView === 'all' ? (
                              <>
                                <Line type="monotone" dataKey="mean" stroke="hsl(var(--chart-1))" name="Mean" />
                                <Line type="monotone" dataKey="median" stroke="hsl(var(--chart-2))" name="Median" />
                                <Line type="monotone" dataKey="std" stroke="hsl(var(--chart-3))" name="Std Dev" />
                              </>
                            ) : (
                              <Line type="monotone" dataKey={statisticView} stroke="hsl(var(--chart-1))" name={statisticView.charAt(0).toUpperCase() + statisticView.slice(1)} />
                            )}
                          </LineChart>
                        ) : (
                          <ScatterChart data={statisticalChartData} onClick={(data) => data?.activeLabel && handleChartClick(data, data.activeLabel)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mean" name="Mean" />
                            <YAxis dataKey="std" name="Std Dev" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Scatter dataKey="median" fill="hsl(var(--chart-1))" />
                          </ScatterChart>
                        )}
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Statistics Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Descriptive Statistics</CardTitle>
                    <CardDescription>Detailed numerical summary</CardDescription>
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
                          {Object.entries(analysis.statistics.numerical).map(([col, stats]) => (
                            <tr 
                              key={col} 
                              className="border-b border-border hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleDrillDown(col, 'numerical')}
                            >
                              <td className="p-2 font-medium">{col}</td>
                              <td className="p-2">{stats.mean.toFixed(2)}</td>
                              <td className="p-2">{stats.median.toFixed(2)}</td>
                              <td className="p-2">{stats.std.toFixed(2)}</td>
                              <td className="p-2">{stats.min}</td>
                              <td className="p-2">{stats.max}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Categorical Data Charts */}
            {analysis?.statistics?.categorical && Object.keys(analysis.statistics.categorical).length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(topCategoricalData).slice(0, 4).map(([column, data]) => (
                  <Card key={column}>
                    <CardHeader>
                      <CardTitle>{column} - Top {topN[0]} Values</CardTitle>
                      <CardDescription>Click to see all categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data} onClick={() => handleDrillDown(column, 'categorical')}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="visualizations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column Types Distribution */}
              {analysis?.chartData.columnTypes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Column Types Distribution</CardTitle>
                    <CardDescription>Interactive pie chart</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analysis.chartData.columnTypes}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {analysis.chartData.columnTypes.map((entry, index) => (
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

              {/* Dataset Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Dataset Overview</CardTitle>
                  <CardDescription>Click bars for detailed information</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysis?.chartData.rowDistribution}>
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
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            {analysis?.dataQuality && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Completeness</p>
                        <p className="text-3xl font-bold text-foreground mt-2">
                          {analysis.dataQuality.completeness}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Uniqueness</p>
                        <p className="text-3xl font-bold text-foreground mt-2">
                          {analysis.dataQuality.uniqueness}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Duplicates</p>
                        <p className="text-3xl font-bold text-foreground mt-2">
                          {analysis.dataQuality.duplicates}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {analysis.chartData.dataQuality && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Completeness by Column</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analysis.chartData.dataQuality}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="completeness" fill="hsl(var(--chart-1))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Automated Insights
                </CardTitle>
                <CardDescription>
                  AI-generated insights from your data analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis?.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      {getInsightIcon(insight.type)}
                      <div>
                        <p className="font-medium text-foreground">{insight.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Drill-Down Dialog */}
      <Dialog open={showDrillDown} onOpenChange={setShowDrillDown}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{drillDownData?.title}</DialogTitle>
            <DialogDescription>
              Detailed analysis for {drillDownData?.column}
            </DialogDescription>
          </DialogHeader>
          {drillDownData && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {Object.keys(drillDownData.data[0] || {}).map(key => (
                        <th key={key} className="text-left p-2 font-medium">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drillDownData.data.map((row, index) => (
                      <tr key={index} className="border-b border-border">
                        {Object.values(row).map((value, idx) => (
                          <td key={idx} className="p-2">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analytics;