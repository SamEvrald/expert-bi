import React from 'react';
import { ActivityItem } from '../../types/dashboard';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  BarChart3,
  Sparkles,
  Download,
  Trash2,
  PieChart,
  Clock,
} from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const ACTIVITY_ICONS: Record<ActivityItem['type'], React.ReactNode> = {
  upload: <Upload className="w-4 h-4" />,
  analysis: <BarChart3 className="w-4 h-4" />,
  insight: <Sparkles className="w-4 h-4" />,
  export: <Download className="w-4 h-4" />,
  delete: <Trash2 className="w-4 h-4" />,
  chart: <PieChart className="w-4 h-4" />,
};

const ACTIVITY_COLORS: Record<ActivityItem['type'], { bg: string; text: string; icon: string }> = {
  upload: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
  analysis: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
  insight: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-500' },
  export: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500' },
  delete: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
  chart: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-500' },
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities, 
  maxItems = 10 
}) => {
  const navigate = useNavigate();
  const displayedActivities = activities.slice(0, maxItems);

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityTime.toLocaleDateString();
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.datasetId) {
      navigate(`/dataset/${activity.datasetId}`);
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No recent activity</p>
        <p className="text-sm text-gray-500 mt-1">Upload a dataset to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-600">Latest updates and actions</p>
      </div>

      <div className="divide-y divide-gray-200">
        {displayedActivities.map((activity) => {
          const colors = ACTIVITY_COLORS[activity.type];
          const icon = ACTIVITY_ICONS[activity.type];

          return (
            <div
              key={activity.id}
              onClick={() => handleActivityClick(activity)}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                activity.datasetId ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.icon}`}>
                  {icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {activity.description}
                      </p>
                      {activity.datasetName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Dataset: {activity.datasetName}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {getTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length > maxItems && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all activity ({activities.length})
          </button>
        </div>
      )}
    </div>
  );
};