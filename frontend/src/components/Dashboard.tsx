import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  FileUp, 
  BarChart3, 
  LogOut, 
  TrendingUp, 
  Search,
  Filter,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Calendar,
  FileText,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid3x3,
  List,
  Layers
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Dataset } from '../types/api.types';
import { DashboardStats as Stats, ActivityItem, SortOption, ViewMode, FilterOption } from '../types/dashboard';
import { DashboardStats } from './dashboard/DashboardStats';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { QuickActions } from './dashboard/QuickActions';
import { DatasetCard } from './dashboard/DatasetCard';
import ErrorHandler from '../utils/errorHandler';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalDatasets: 0,
    totalRows: 0,
    totalColumns: 0,
    totalSize: 0,
    recentUploads: 0,
    analyzedDatasets: 0,
    totalInsights: 0,
    avgConfidence: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  
  // Filters and view
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const result = await api.getDatasets();
      
      if (Array.isArray(result)) {
        setDatasets(result);
        calculateStats(result);
        generateActivities(result);
      } else if (result.success && result.data) {
        setDatasets(result.data);
        calculateStats(result.data);
        generateActivities(result.data);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (datasets: Dataset[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats: Stats = {
      totalDatasets: datasets.length,
      totalRows: datasets.reduce((sum, d) => sum + (d.row_count || 0), 0),
      totalColumns: datasets.reduce((sum, d) => sum + (d.column_count || 0), 0),
      totalSize: datasets.reduce((sum, d) => sum + (d.file_size || 0), 0),
      recentUploads: datasets.filter(d => new Date(d.created_at) > weekAgo).length,
      analyzedDatasets: 0,
      totalInsights: 0,
      avgConfidence: 0,
    };

    setStats(stats);
  };

  const generateActivities = (datasets: Dataset[]) => {
    const activities: ActivityItem[] = datasets
      .slice(0, 10)
      .map((dataset) => ({
        id: `upload-${dataset.id}`,
        type: 'upload' as const,
        title: 'Dataset Uploaded',
        description: `${dataset.name} was uploaded`,
        timestamp: dataset.created_at,
        datasetId: dataset.id,
        datasetName: dataset.name,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setActivities(activities);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await api.uploadDataset(formData);
      
      if (result.success || result) {
        setShowUploadModal(false);
        await loadDashboardData();
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to upload dataset');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDataset = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this dataset?')) {
      return;
    }

    try {
      await api.deleteDataset(id);
      await loadDashboardData();
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to delete dataset');
    }
  };

  const handleExportDataset = async (id: number) => {
    try {
      const dataset = datasets.find(d => d.id === id);
      if (!dataset) return;
      
      // For now, just show a message - you'll need to implement export on backend
      alert('Export functionality coming soon!');
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to export dataset');
    }
  };

  // Filter and sort datasets
  const filteredDatasets = useMemo(() => {
    let filtered = [...datasets];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    switch (filterBy) {
      case 'analyzed':
        break;
      case 'unanalyzed':
        break;
      case 'recent': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(d => new Date(d.created_at) > weekAgo);
        break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'size':
          comparison = (a.file_size || 0) - (b.file_size || 0);
          break;
        case 'rows':
          comparison = (a.row_count || 0) - (b.row_count || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [datasets, searchTerm, filterBy, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's your data overview.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadDashboardData()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Upload Dataset
              </button>
            </div>
          </div>

          {/* Statistics */}
          <DashboardStats stats={stats} />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Datasets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <QuickActions
              onUpload={() => setShowUploadModal(true)}
              onAnalyze={() => {}}
              onExport={() => {}}
              onGenerateReport={() => {}}
            />

            {/* Filters and Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search datasets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Datasets</option>
                  <option value="analyzed">Analyzed</option>
                  <option value="unanalyzed">Unanalyzed</option>
                  <option value="recent">Recent (7 days)</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="size">Sort by Size</option>
                  <option value="rows">Sort by Rows</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* View Mode */}
                <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'compact'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Datasets */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  My Datasets
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredDatasets.length})
                  </span>
                </h2>
              </div>

              {filteredDatasets.length === 0 ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                  <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm || filterBy !== 'all' ? 'No datasets found' : 'No datasets yet'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || filterBy !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Upload your first dataset to get started with analysis'}
                  </p>
                  {!searchTerm && filterBy === 'all' && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Upload Dataset
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
                      : 'space-y-4'
                  }
                >
                  {filteredDatasets.map((dataset) => (
                    <DatasetCard
                      key={dataset.id}
                      dataset={dataset}
                      onDelete={handleDeleteDataset}
                      onExport={handleExportDataset}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="lg:col-span-1">
            <ActivityFeed activities={activities} maxItems={15} />
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Dataset</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Choose a CSV, Excel, or JSON file
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? 'Uploading...' : 'Select File'}
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;