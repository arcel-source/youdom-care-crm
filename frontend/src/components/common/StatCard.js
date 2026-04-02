import React from 'react';
import * as Icons from 'lucide-react';

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'indigo',
  loading = false,
}) {
  const Icon = Icons[icon] || Icons.Activity;

  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'bg-indigo-100 text-indigo-600',
      value: 'text-indigo-700',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-100 text-green-600',
      value: 'text-green-700',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'bg-amber-100 text-amber-600',
      value: 'text-amber-700',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-100 text-red-600',
      value: 'text-red-700',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
      value: 'text-blue-700',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-100 text-purple-600',
      value: 'text-purple-700',
    },
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className={`${c.bg} rounded-xl p-5 flex items-start gap-4`}>
      <div className={`${c.icon} p-3 rounded-xl flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className={`text-3xl font-bold ${c.value}`}>{value}</p>
        )}
        {(trend !== undefined || trendLabel) && !loading && (
          <div className="flex items-center gap-1 mt-1">
            {trend !== undefined && (
              <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
            {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
