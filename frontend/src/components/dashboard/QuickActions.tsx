import React from 'react';
import { QuickAction } from '../../types/dashboard';
import { Upload, BarChart3, Download, Sparkles, FileText, Search } from 'lucide-react';

interface QuickActionsProps {
  onUpload: () => void;
  onAnalyze?: () => void;
  onExport?: () => void;
  onGenerateReport?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onUpload,
  onAnalyze,
  onExport,
  onGenerateReport,
}) => {
  const actions: QuickAction[] = [
    {
      id: 'upload',
      title: 'Upload Dataset',
      description: 'Add a new CSV, Excel, or JSON file',
      icon: <Upload className="w-6 h-6" />,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      action: onUpload,
    },
    {
      id: 'analyze',
      title: 'Run Analysis',
      description: 'Analyze all unprocessed datasets',
      icon: <BarChart3 className="w-6 h-6" />,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      action: onAnalyze || (() => {}),
    },
    {
      id: 'insights',
      title: 'Generate Insights',
      description: 'Get AI-powered data insights',
      icon: <Sparkles className="w-6 h-6" />,
      color: '#10b981',
      bgColor: '#d1fae5',
      action: onGenerateReport || (() => {}),
    },
    {
      id: 'export',
      title: 'Export Data',
      description: 'Download analysis results',
      icon: <Download className="w-6 h-6" />,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      action: onExport || (() => {}),
    },
    {
      id: 'report',
      title: 'Create Report',
      description: 'Generate comprehensive report',
      icon: <FileText className="w-6 h-6" />,
      color: '#ef4444',
      bgColor: '#fee2e2',
      action: onGenerateReport || (() => {}),
    },
    {
      id: 'search',
      title: 'Search Datasets',
      description: 'Find datasets and insights',
      icon: <Search className="w-6 h-6" />,
      color: '#06b6d4',
      bgColor: '#cffafe',
      action: () => document.getElementById('search-input')?.focus(),
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-center group"
          >
            <div
              className="p-3 rounded-full transition-transform group-hover:scale-110"
              style={{ backgroundColor: action.bgColor }}
            >
              <div style={{ color: action.color }}>{action.icon}</div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{action.title}</h4>
              <p className="text-xs text-gray-600 mt-0.5">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};