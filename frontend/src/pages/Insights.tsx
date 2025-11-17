import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Dataset, Insight } from '../types/api.types';
import { InsightsList } from '../components/analytics/insights/InsightsList';
import { Loader2, ArrowLeft, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import ErrorHandler from '../utils/errorHandler';

const InsightsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const datasetId = parseInt(id!);

      // Load dataset info
      const datasetResult = await api.getDataset(datasetId);
      if (!datasetResult.success || !datasetResult.data) {
        throw new Error('Failed to load dataset');
      }
      setDataset(datasetResult.data);

      // Load existing insights
      try {
        const insightsResult = await api.getInsights(datasetId);
        if (insightsResult.success && insightsResult.data) {
          setInsights(insightsResult.data);
        }
      } catch (err) {
        console.log('No existing insights, will need to generate');
      }
    } catch (err) {
      setError('Failed to load dataset');
      ErrorHandler.handle(err, 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!id) return;

    try {
      setGenerating(true);
      const datasetId = parseInt(id);

      const result = await api.generateInsights(datasetId);
      if (result.success && result.data) {
        setInsights(result.data.insights);
      }
    } catch (err) {
      ErrorHandler.handle(err, 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!id) return;

    try {
      const datasetId = parseInt(id);
      const blob = await api.exportInsights(datasetId, 'pdf');

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset?.name || 'dataset'}_insights.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      ErrorHandler.handle(err, 'Failed to export insights');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            {error || 'Dataset Not Found'}
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const hasInsights = insights.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Insights: {dataset.name}
                </h1>
                <p className="text-sm text-gray-600">
                  AI-powered analysis and recommendations
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateInsights}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Insights...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  {hasInsights ? 'Regenerate Insights' : 'Generate Insights'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {hasInsights ? (
          <InsightsList 
            insights={insights} 
            onExport={handleExport}
            showFilters={true}
          />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Insights Generated Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Click the "Generate Insights" button above to let AI analyze your dataset and
                discover patterns, trends, outliers, and actionable recommendations.
              </p>
              <button
                onClick={handleGenerateInsights}
                disabled={generating}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Insights Now
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPage;