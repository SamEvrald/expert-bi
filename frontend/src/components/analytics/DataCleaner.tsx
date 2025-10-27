import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  Filter, 
  Trash2, 
  RotateCcw, 
  Download,
  Eye,
  EyeOff,
  Settings,
  Zap,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/lib/api';

interface Column {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  nullCount: number;
  uniqueCount: number;
  completeness: number;
  sampleValues: (string | number)[];
  issues: string[];
}

interface CleaningRule {
  id: string;
  type: 'remove_nulls' | 'fill_missing' | 'remove_duplicates' | 'normalize' | 'convert_type' | 'filter_rows';
  column?: string;
  params: Record<string, string | number | boolean>;
  description: string;
  applied: boolean;
}

interface DataCleanerProps {
  datasetId: number;
  onCleaningComplete?: (cleanedDatasetId: number) => void;
}

interface AnalysisColumn {
  name: string;
  type: string;
  nullCount?: number;
  uniqueCount?: number;
  completeness?: number;
  sampleValues?: (string | number)[];
  [key: string]: unknown;
}

const DataCleaner: React.FC<DataCleanerProps> = ({ datasetId, onCleaningComplete }) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [cleaningRules, setCleaningRules] = useState<CleaningRule[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const generateIssues = useCallback((col: AnalysisColumn): string[] => {
    const issues: string[] = [];
    if (col.nullCount && col.nullCount > 0) {
      issues.push(`${col.nullCount} missing values`);
    }
    if (col.completeness && col.completeness < 90) {
      issues.push('Low completeness');
    }
    if (col.type === 'string' && col.uniqueCount === 1) {
      issues.push('Constant value');
    }
    return issues;
  }, []);

  const generateCleaningSuggestions = useCallback((columns: Column[]) => {
    const suggestions: CleaningRule[] = [];

    columns.forEach(col => {
      // Suggest removing nulls for low completeness
      if (col.nullCount > 0 && col.completeness < 50) {
        suggestions.push({
          id: `remove_nulls_${col.name}`,
          type: 'remove_nulls',
          column: col.name,
          params: {},
          description: `Remove rows with missing ${col.name} values`,
          applied: false
        });
      }

      // Suggest filling missing values for moderate completeness
      if (col.nullCount > 0 && col.completeness >= 50 && col.completeness < 95) {
        const fillValue = col.type === 'number' ? 'mean' : 'mode';
        suggestions.push({
          id: `fill_missing_${col.name}`,
          type: 'fill_missing',
          column: col.name,
          params: { method: fillValue },
          description: `Fill missing ${col.name} with ${fillValue}`,
          applied: false
        });
      }

      // Suggest normalization for numeric columns
      if (col.type === 'number' && col.sampleValues.length > 0) {
        const values = col.sampleValues.filter((v): v is number => typeof v === 'number');
        if (values.length > 0) {
          const max = Math.max(...values);
          const min = Math.min(...values);
          if (max - min > 1000) {
            suggestions.push({
              id: `normalize_${col.name}`,
              type: 'normalize',
              column: col.name,
              params: { method: 'min_max' },
              description: `Normalize ${col.name} values (0-1 scale)`,
              applied: false
            });
          }
        }
      }
    });

    // Suggest duplicate removal
    suggestions.push({
      id: 'remove_duplicates',
      type: 'remove_duplicates',
      params: {},
      description: 'Remove duplicate rows',
      applied: false
    });

    setCleaningRules(suggestions);
  }, []);

  const analyzeDataset = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const response = await ApiService.getDatasetAnalysis(datasetId);
      if (response.success && response.data) {
        const analysisData = response.data;
        
        // Transform analysis data to column format
        const columnData: Column[] = analysisData.columns.map((col: AnalysisColumn) => ({
          name: col.name,
          type: col.type as 'string' | 'number' | 'boolean' | 'date',
          nullCount: col.nullCount || 0,
          uniqueCount: col.uniqueCount || 0,
          completeness: col.completeness || 100,
          sampleValues: col.sampleValues || [],
          issues: generateIssues(col)
        }));

        setColumns(columnData);
        setPreviewData(analysisData.preview.slice(0, 10)); // First 10 rows for preview
        
        // Generate automatic cleaning suggestions
        generateCleaningSuggestions(columnData);
      }
    } catch (error) {
      console.error('Failed to analyze dataset:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze dataset for cleaning',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [datasetId, generateIssues, generateCleaningSuggestions, toast]);

  useEffect(() => {
    analyzeDataset();
  }, [analyzeDataset]);

  const addCustomRule = (ruleType: CleaningRule['type']) => {
    const newRule: CleaningRule = {
      id: `custom_${Date.now()}`,
      type: ruleType,
      params: {},
      description: `Custom ${ruleType.replace('_', ' ')} rule`,
      applied: false
    };

    setCleaningRules(prev => [...prev, newRule]);
  };

  const updateRule = (ruleId: string, updates: Partial<CleaningRule>) => {
    setCleaningRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  };

  const removeRule = (ruleId: string) => {
    setCleaningRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const toggleRule = (ruleId: string) => {
    setCleaningRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, applied: !rule.applied } : rule
      )
    );
  };

  const applyCleaningRules = async () => {
    const appliedRules = cleaningRules.filter(rule => rule.applied);
    if (appliedRules.length === 0) {
      toast({
        title: 'No Rules Selected',
        description: 'Please select at least one cleaning rule to apply',
        variant: 'destructive'
      });
      return;
    }

    setIsCleaning(true);
    setProgress(0);

    try {
      // Simulate API call for data cleaning
      // In a real implementation, you would send the rules to your backend
      const cleaningPayload = {
        datasetId,
        rules: appliedRules
      };

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Mock successful cleaning
      const cleanedDatasetId = datasetId + 1000; // Mock new dataset ID

      toast({
        title: 'Cleaning Complete',
        description: `Applied ${appliedRules.length} cleaning rules successfully`,
      });

      if (onCleaningComplete) {
        onCleaningComplete(cleanedDatasetId);
      }

    } catch (error) {
      console.error('Cleaning failed:', error);
      toast({
        title: 'Cleaning Failed',
        description: 'An error occurred while cleaning the data',
        variant: 'destructive'
      });
    } finally {
      setIsCleaning(false);
      setProgress(0);
    }
  };

  const getIssueIcon = (issue: string) => {
    if (issue.includes('missing')) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (issue.includes('completeness')) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  const getRuleIcon = (type: CleaningRule['type']) => {
    switch (type) {
      case 'remove_nulls': return <Trash2 className="h-4 w-4" />;
      case 'fill_missing': return <Settings className="h-4 w-4" />;
      case 'remove_duplicates': return <Filter className="h-4 w-4" />;
      case 'normalize': return <Zap className="h-4 w-4" />;
      case 'convert_type': return <RotateCcw className="h-4 w-4" />;
      case 'filter_rows': return <Filter className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <Database className="h-12 w-12 text-primary animate-pulse" />
            <h3 className="text-lg font-semibold">Analyzing Dataset</h3>
            <p className="text-muted-foreground text-center">
              Examining data quality and generating cleaning suggestions...
            </p>
            <Progress value={75} className="w-full max-w-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Data Cleaning & Transformation
          </CardTitle>
          <CardDescription>
            Review data quality issues and apply cleaning rules to improve your dataset
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Cleaning Rules</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="apply">Apply Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Quality Overview</CardTitle>
              <CardDescription>
                Issues detected in your dataset that may need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {columns.map((column) => (
                    <div key={column.name} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{column.name}</h4>
                          <Badge variant="outline">{column.type}</Badge>
                          <Badge variant="secondary">
                            {column.completeness.toFixed(1)}% complete
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {column.uniqueCount} unique values
                        </div>
                      </div>
                      
                      {column.issues.length > 0 && (
                        <div className="space-y-2">
                          {column.issues.map((issue, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {getIssueIcon(issue)}
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {column.issues.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>No issues detected</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cleaning Rules</CardTitle>
              <CardDescription>
                Configure and apply data cleaning transformations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addCustomRule('remove_nulls')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Nulls
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addCustomRule('fill_missing')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Fill Missing
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addCustomRule('normalize')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Normalize
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addCustomRule('filter_rows')}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter Rows
                  </Button>
                </div>

                <Separator />

                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {cleaningRules.map((rule) => (
                      <div key={rule.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={rule.applied}
                              onCheckedChange={() => toggleRule(rule.id)}
                            />
                            {getRuleIcon(rule.type)}
                            <div>
                              <h4 className="font-medium">{rule.description}</h4>
                              {rule.column && (
                                <p className="text-sm text-muted-foreground">
                                  Column: {rule.column}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Data Preview
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </CardTitle>
              <CardDescription>
                Preview of your data before and after cleaning
              </CardDescription>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          {Object.keys(previewData[0] || {}).map(header => (
                            <th key={header} className="text-left p-2 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index} className="border-b border-border">
                            {Object.values(row).map((value, idx) => (
                              <td key={idx} className="p-2">
                                {value === null || value === undefined ? (
                                  <span className="text-muted-foreground italic">null</span>
                                ) : (
                                  String(value)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="apply" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apply Cleaning Rules</CardTitle>
              <CardDescription>
                Review and execute the selected cleaning transformations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Rules to Apply:</h4>
                  <div className="space-y-2">
                    {cleaningRules.filter(rule => rule.applied).map(rule => (
                      <div key={rule.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{rule.description}</span>
                      </div>
                    ))}
                  </div>
                  {cleaningRules.filter(rule => rule.applied).length === 0 && (
                    <p className="text-sm text-muted-foreground">No rules selected</p>
                  )}
                </div>

                {isCleaning && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Applying cleaning rules...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={applyCleaningRules}
                    disabled={isCleaning || cleaningRules.filter(rule => rule.applied).length === 0}
                    className="flex-1"
                  >
                    {isCleaning ? (
                      <>
                        <Settings className="h-4 w-4 mr-2 animate-spin" />
                        Cleaning Data...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Apply Cleaning Rules
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={analyzeDataset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refresh Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataCleaner;