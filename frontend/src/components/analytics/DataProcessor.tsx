import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Loader2, Database, TrendingUp } from 'lucide-react';

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: Record<string, unknown>;
}

interface AnalysisResult {
  summary: {
    totalRows: number;
    totalColumns: number;
    fileSize: number;
    status: string;
    dataQuality?: string;
  };
  columns: Array<{
    name: string;
    type: string;
    nullCount?: number;
    uniqueCount?: number;
    sampleValues?: (string | number)[];
    completeness?: number;
  }>;
  insights: Array<{
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    description: string;
  }>;
  chartData: {
    rowDistribution: Array<{ name: string; value: number }>;
    columnTypes?: Array<{ name: string; value: number }>;
    dataQuality?: Array<{ name: string; completeness: number; missing: number }>;
  };
  preview: Array<Record<string, string | number | boolean | null>>;
  dataQuality?: {
    score: string;
    completeness: number;
    uniqueness: number;
    missingValues: number;
    duplicates: number;
    totalCells: number;
  };
}

interface DataProcessorProps {
  datasetId: string;
  onProcessingComplete?: (analysis: AnalysisResult) => void;
}

const DataProcessor = ({ datasetId, onProcessingComplete }: DataProcessorProps) => {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'loading',
      name: 'Data Loading',
      description: 'Loading and parsing CSV file',
      status: 'pending',
      progress: 0
    },
    {
      id: 'cleaning',
      name: 'Data Cleaning',
      description: 'Identifying missing values, duplicates, and data issues',
      status: 'pending',
      progress: 0
    },
    {
      id: 'analysis',
      name: 'Statistical Analysis',
      description: 'Calculating descriptive statistics and distributions',
      status: 'pending',
      progress: 0
    },
    {
      id: 'insights',
      name: 'Insight Generation',
      description: 'Generating automated insights and recommendations',
      status: 'pending',
      progress: 0
    },
    {
      id: 'visualization',
      name: 'Chart Preparation',
      description: 'Preparing data for visualizations',
      status: 'pending',
      progress: 0
    }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const processStep = useCallback(async (stepIndex: number): Promise<void> => {
    setCurrentStep(stepIndex);
    
    // Update step status to processing
    setSteps(prev => prev.map((step, idx) => 
      idx === stepIndex 
        ? { ...step, status: 'processing', progress: 0 }
        : step
    ));

    // Simulate progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setSteps(prev => prev.map((step, idx) => 
        idx === stepIndex 
          ? { ...step, progress }
          : step
      ));
    }

    // Mark step as completed
    setSteps(prev => prev.map((step, idx) => 
      idx === stepIndex 
        ? { ...step, status: 'completed', progress: 100 }
        : step
    ));
  }, []);

  const startProcessing = useCallback(async (): Promise<void> => {
    setIsProcessing(true);
    
    // Simulate processing steps
    for (let i = 0; i < steps.length; i++) {
      await processStep(i);
    }
    
    setIsProcessing(false);
    
    // Fetch final analysis results
    try {
      const response = await fetch(`/api/datasets/${datasetId}/analysis`);
      const result = await response.json();
      if (result.success && onProcessingComplete) {
        onProcessingComplete(result.data as AnalysisResult);
      }
    } catch (error) {
      console.error('Failed to fetch analysis results:', error);
      // Handle error - could set error state for steps
      setSteps(prev => prev.map(step => 
        step.status === 'processing' 
          ? { ...step, status: 'error' }
          : step
      ));
    }
  }, [datasetId, onProcessingComplete, processStep, steps.length]);

  useEffect(() => {
    if (datasetId && !isProcessing) {
      startProcessing();
    }
  }, [datasetId, isProcessing, startProcessing]);

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepBadge = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const overallProgress = (steps.filter(s => s.status === 'completed').length / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Processing Pipeline
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your dataset is in progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              {isProcessing ? 'Processing data...' : 'Analysis complete'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Steps</CardTitle>
          <CardDescription>
            Each step in the comprehensive data analysis workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{step.name}</h4>
                    {getStepBadge(step)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                  {step.status === 'processing' && (
                    <Progress value={step.progress} className="w-full h-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processing Details */}
      <Card>
        <CardHeader>
          <CardTitle>What's Being Analyzed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Data Quality Assessment</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Missing value detection</li>
                <li>• Duplicate record identification</li>
                <li>• Data type validation</li>
                <li>• Completeness scoring</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Statistical Analysis</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Descriptive statistics</li>
                <li>• Distribution analysis</li>
                <li>• Correlation detection</li>
                <li>• Outlier identification</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Insight Generation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Pattern recognition</li>
                <li>• Anomaly detection</li>
                <li>• Trend identification</li>
                <li>• Data recommendations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Visualization Prep</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Chart data preparation</li>
                <li>• Optimal chart selection</li>
                <li>• Interactive elements</li>
                <li>• Dashboard layout</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataProcessor;