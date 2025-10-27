import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Database, BarChart3, TrendingUp } from 'lucide-react';

const LoadingAnalysis = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Analyzing Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-muted-foreground">
              Our AI is performing comprehensive analysis on your dataset...
            </div>
            
            <Progress value={75} className="w-full" />
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Database className="h-4 w-4 text-green-500" />
                <span>Data loading and validation - Complete</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span>Statistical analysis - In Progress</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Generating insights - Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoadingAnalysis;