import React from 'react';
import { Dataset } from '../../types/api.types';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Calendar,
  FileText,
  MoreVertical,
  Trash2,
  Eye,
  Download,
  BarChart3,
  Sparkles,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { formatNumber, formatBytes } from '../../utils/typeDetectionUtils';

interface DatasetCardProps {
  dataset: Dataset;
  onDelete: (id: number) => void;
  onExport?: (id: number) => void;
  hasAnalysis?: boolean;
  hasInsights?: boolean;
  viewMode?: 'grid' | 'list' | 'compact';
}

export const DatasetCard: React.FC<DatasetCardProps> = ({
  dataset,
  onDelete,
  onExport,
  hasAnalysis = false,
  hasInsights = false,
  viewMode = 'grid',
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Database className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{dataset.name}</h3>
              <p className="text-sm text-gray-600 truncate">{dataset.description || 'No description'}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="text-center">
              <p className="font-semibold text-gray-900">{formatNumber(dataset.row_count)}</p>
              <p className="text-xs">Rows</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">{dataset.column_count}</p>
              <p className="text-xs">Columns</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">{formatBytes(dataset.file_size)}</p>
              <p className="text-xs">Size</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasAnalysis && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                Analyzed
              </span>
            )}
            {hasInsights && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                {/* Insights count would go here */}
              </span>
            )}
            <button
              onClick={() => navigate(`/dataset/${dataset.id}`)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              View
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div 
        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
        onClick={() => navigate(`/dataset/${dataset.id}`)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Database className="w-5 h-5 text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{dataset.name}</p>
            <p className="text-xs text-gray-500">
              {formatNumber(dataset.row_count)} rows • {dataset.column_count} cols
            </p>
          </div>
        </div>
        {hasAnalysis && <CheckCircle className="w-5 h-5 text-green-500" />}
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    navigate(`/dataset/${dataset.id}`);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                {onExport && (
                  <button
                    onClick={() => {
                      onExport(dataset.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete(dataset.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white truncate">{dataset.name}</h3>
        <p className="text-sm text-white/80 truncate mt-1">
          {dataset.description || 'No description'}
        </p>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Rows</p>
            <p className="font-semibold text-gray-900">{formatNumber(dataset.row_count)}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Columns</p>
            <p className="font-semibold text-gray-900">{dataset.column_count}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Size</p>
            <p className="font-semibold text-gray-900">{formatBytes(dataset.file_size)}</p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
            <FileText className="w-3 h-3" />
            {dataset.file_type.toUpperCase()}
          </span>
          {hasAnalysis && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
              <CheckCircle className="w-3 h-3" />
              Analyzed
            </span>
          )}
          {hasInsights && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
              <Sparkles className="w-3 h-3" />
              Insights
            </span>
          )}
          {!hasAnalysis && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Created {new Date(dataset.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/dataset/${dataset.id}`)}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            View Details
          </button>
          <button
            onClick={() => navigate(`/dataset/${dataset.id}?tab=insights`)}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            title="Analyze"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};