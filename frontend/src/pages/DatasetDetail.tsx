import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Dataset, ColumnType, Insight, DataPreview } from '../types/api.types';
import { TypeDetectionResults } from '../components/analytics/type-detection/TypeDetectionResults';
import { InsightsList } from '../components/analytics/insights/InsightsList';
import { DataPreviewTable } from '../components/analytics/DataPreviewTable';
import { StatisticsViewer } from '../components/analytics/StatisticsViewer';
import ErrorHandler from '../utils/errorHandler';
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Download,
  AlertCircle,
  Database,
  TrendingUp,
  Eye,
  BarChart3,
  Sparkles,
} from 'lucide-react';

type TabType = 'overview' | 'preview' | 'types' | 'insights' | 'statistics';

const DatasetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [columnTypes, setColumnTypes] = useState<Record<string, ColumnType>>({});
  const [insights, setInsights] = useState<Insight[]>([]);
  const [preview, setPreview] = useState<DataPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<{
    types: boolean;
    insights: boolean;
  }>({
    types: false,
    insights: false,
  });

  useEffect(() => {
    if (id) {
      loadDataset();
    }
  }, [id]);

  const loadDataset = async () => {
    try {
      setLoading(true);
      const datasetId = parseInt(id!);

      const [datasetRes, typesRes, previewRes] = await Promise.allSettled([
        api.getDataset(datasetId),
        api.detectTypes(datasetId),
        api.getDatasetPreview(datasetId, 100),
      ]);
      
      // Load insights separately
      let insightsRes: any = { status: 'rejected' };
      try {
        insightsRes = { status: 'fulfilled', value: await api.getInsights(datasetId) };
      } catch (error) {
        insightsRes = { status: 'rejected', reason: error };
      }

      if (datasetRes.status === 'fulfilled' && datasetRes.value.success) {
        setDataset(datasetRes.value.data!);
      }

      if (typesRes.status === 'fulfilled' && typesRes.value.success) {
        setColumnTypes(typesRes.value.data!.columns);
      }

      if (insightsRes.status === 'fulfilled' && insightsRes.value.success) {
        setInsights(insightsRes.value.data!);
      }

      if (previewRes.status === 'fulfilled' && previewRes.value.success) {
        setPreview(previewRes.value.data!);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!id) return;

    try {
      setProcessing((prev) => ({ ...prev, insights: true }));
      const result = await api.getInsights(parseInt(id));
      if (result.success && result.data) {
        setInsights(result.data);
        setActiveTab('insights');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to generate insights');
    } finally {
      setProcessing((prev) => ({ ...prev, insights: false }));
    }
  };

  const handleDetectTypes = async () => {
    if (!id) return;

    try {
      setProcessing((prev) => ({ ...prev, types: true }));
      const result = await api.detectTypes(parseInt(id));
      if (result.success && result.data) {
        setColumnTypes(result.data.columns);
        setActiveTab('types');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to detect types');
    } finally {
      setProcessing((prev) => ({ ...prev, types: false }));
    }
  };

  const handleDeleteDataset = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteDataset(parseInt(id));
      navigate('/dashboard');
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to delete dataset');
    }
  };

  const handleExportDataset = async () => {
    if (!id) return;

    try {
      const blob = await api.exportDataset(parseInt(id), 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset?.name || 'dataset'}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to export dataset');
    }
  };

  const handleDeleteInsight = async (insightId: number) => {
    if (!id || !window.confirm('Delete this insight?')) return;

    try {
      await api.deleteInsight(parseInt(id), insightId);
      setInsights((prev) => prev.filter((i) => i.id !== insightId));
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to delete insight');
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

  if (!dataset) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Dataset Not Found</h2>
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

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Database },
    { id: 'preview' as TabType, label: 'Preview', icon: Eye, badge: preview?.displayed_rows },
    { id: 'types' as TabType, label: 'Types', icon: BarChart3, badge: Object.keys(columnTypes).length },
    { id: 'insights' as TabType, label: 'Insights', icon: Sparkles, badge: insights.length },
    { id: 'statistics' as TabType, label: 'Statistics', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{dataset.name}</h1>
                {dataset.description && (
                  <p className="text-sm text-gray-600">{dataset.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>{dataset.row_count.toLocaleString()} rows</span>
                  <span>•</span>
                  <span>{dataset.column_count} columns</span>
                  <span>•</span>
                  <span>{(dataset.file_size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDetectTypes}
                disabled={processing.types}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {processing.types ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Detect Types
                  </>
                )}
              </button>

              <button
                onClick={handleGenerateInsights}
                disabled={processing.insights}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {processing.insights ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Insights
                  </>
                )}
              </button>

              <button
                onClick={handleExportDataset}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              <button
                onClick={handleDeleteDataset}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-600 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <OverviewTab dataset={dataset} columnTypes={columnTypes} insights={insights} />
        )}

        {activeTab === 'preview' && (
          <div>
            {preview ? (
              <DataPreviewTable preview={preview} columnTypes={columnTypes} />
            ) : (
              <EmptyState
                icon={Eye}
                title="No Preview Available"
                description="Data preview could not be loaded"
              />
            )}
          </div>
        )}

        {activeTab === 'types' && (
          <div>
            {Object.keys(columnTypes).length > 0 ? (
              <TypeDetectionResults
                columnTypes={columnTypes}
                datasetName={dataset.name}
                onExport={handleExportDataset}
              />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No Type Detection Results"
                description="Click 'Detect Types' to analyze column data types"
                action={
                  <button
                    onClick={handleDetectTypes}
                    disabled={processing.types}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {processing.types ? 'Detecting...' : 'Detect Types Now'}
                  </button>
                }
              />
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div>
            {insights.length > 0 ? (
              <InsightsList
                insights={insights}
                onDeleteInsight={handleDeleteInsight}
                onRefresh={handleGenerateInsights}
              />
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No Insights Generated"
                description="Click 'Generate Insights' to analyze your data and discover patterns"
                action={
                  <button
                    onClick={handleGenerateInsights}
                    disabled={processing.insights}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {processing.insights ? 'Generating...' : 'Generate Insights Now'}
                  </button>
                }
              />
            )}
          </div>
        )}

        {activeTab === 'statistics' && (
          <StatisticsViewer dataset={dataset} columnTypes={columnTypes} />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  dataset: Dataset;
  columnTypes: Record<string, ColumnType>;
  insights: Insight[];
}> = ({ dataset, columnTypes, insights }) => {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Rows</h3>
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {dataset.row_count.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Columns</h3>
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{dataset.column_count}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Types Detected</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {Object.keys(columnTypes).length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Insights</h3>
            <Sparkles className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{insights.length}</p>
        </div>
      </div>

      {/* File Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">File Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">File Name</p>
            <p className="font-medium text-gray-900">{dataset.file_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">File Size</p>
            <p className="font-medium text-gray-900">
              {(dataset.file_size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">File Type</p>
            <p className="font-medium text-gray-900">{dataset.file_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="font-medium text-gray-900">
              {new Date(dataset.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Type Detection</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                Object.keys(columnTypes).length > 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {Object.keys(columnTypes).length > 0 ? 'Complete' : 'Pending'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Insights Generation</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                insights.length > 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {insights.length > 0 ? `${insights.length} Generated` : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
};

export default DatasetDetail;