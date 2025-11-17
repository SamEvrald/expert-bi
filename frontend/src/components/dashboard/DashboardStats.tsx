import React from 'react';
import { DashboardStats as Stats } from '../../types/dashboard';
import {
  Database,
  Layers,
  HardDrive,
  TrendingUp,
  Upload,
  CheckCircle,
  Sparkles,
  Target,
} from 'lucide-react';
import { formatNumber, formatBytes } from '../../utils/typeDetectionUtils';

interface DashboardStatsProps {
  stats: Stats;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Datasets',
      value: formatNumber(stats.totalDatasets),
      icon: Database,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      change: stats.recentUploads > 0 ? `+${stats.recentUploads} this week` : null,
    },
    {
      title: 'Total Rows',
      value: formatNumber(stats.totalRows),
      icon: Layers,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      subtext: 'Across all datasets',
    },
    {
      title: 'Total Columns',
      value: formatNumber(stats.totalColumns),
      icon: TrendingUp,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      subtext: 'Data fields',
    },
    {
      title: 'Total Storage',
      value: formatBytes(stats.totalSize),
      icon: HardDrive,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      subtext: 'Used storage',
    },
    {
      title: 'Analyzed',
      value: `${stats.analyzedDatasets}/${stats.totalDatasets}`,
      icon: CheckCircle,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      percentage: stats.totalDatasets > 0 
        ? Math.round((stats.analyzedDatasets / stats.totalDatasets) * 100)
        : 0,
    },
    {
      title: 'Insights',
      value: formatNumber(stats.totalInsights),
      icon: Sparkles,
      color: 'pink',
      gradient: 'from-pink-500 to-pink-600',
      subtext: 'Generated insights',
    },
    {
      title: 'Avg Confidence',
      value: `${(stats.avgConfidence * 100).toFixed(0)}%`,
      icon: Target,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      subtext: 'Analysis accuracy',
    },
    {
      title: 'Recent Uploads',
      value: formatNumber(stats.recentUploads),
      icon: Upload,
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      subtext: 'Last 7 days',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className={`bg-gradient-to-br ${stat.gradient} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white opacity-90">
                  {stat.title}
                </h3>
                <Icon className="w-5 h-5 text-white opacity-75" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              {stat.percentage !== undefined && (
                <div className="mt-2">
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/75 mt-1">{stat.percentage}% Complete</p>
                </div>
              )}
              {stat.change && (
                <p className="text-xs text-white/75 mt-1">{stat.change}</p>
              )}
              {stat.subtext && (
                <p className="text-xs text-white/75 mt-1">{stat.subtext}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};