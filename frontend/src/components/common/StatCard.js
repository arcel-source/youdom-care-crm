import React from 'react';
import * as Icons from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

const SPARKLINE_DATA = {
  up: [
    { v: 40 }, { v: 44 }, { v: 42 }, { v: 48 }, { v: 46 }, { v: 52 }, { v: 58 },
  ],
  down: [
    { v: 58 }, { v: 52 }, { v: 55 }, { v: 48 }, { v: 46 }, { v: 42 }, { v: 40 },
  ],
  flat: [
    { v: 50 }, { v: 52 }, { v: 49 }, { v: 51 }, { v: 50 }, { v: 52 }, { v: 51 },
  ],
};

const COLOR_CONFIG = {
  teal: {
    bg: 'from-teal-50 to-white',
    iconBg: 'bg-teal-100',
    iconText: 'text-teal-600',
    value: 'text-teal-700',
    sparkline: '#0d9488',
    border: 'border-teal-100',
  },
  emerald: {
    bg: 'from-emerald-50 to-white',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    value: 'text-emerald-700',
    sparkline: '#059669',
    border: 'border-emerald-100',
  },
  green: {
    bg: 'from-emerald-50 to-white',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    value: 'text-emerald-700',
    sparkline: '#059669',
    border: 'border-emerald-100',
  },
  amber: {
    bg: 'from-amber-50 to-white',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    value: 'text-amber-700',
    sparkline: '#d97706',
    border: 'border-amber-100',
  },
  rose: {
    bg: 'from-rose-50 to-white',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-600',
    value: 'text-rose-700',
    sparkline: '#e11d48',
    border: 'border-rose-100',
  },
  red: {
    bg: 'from-rose-50 to-white',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-600',
    value: 'text-rose-700',
    sparkline: '#e11d48',
    border: 'border-rose-100',
  },
  blue: {
    bg: 'from-blue-50 to-white',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    value: 'text-blue-700',
    sparkline: '#2563eb',
    border: 'border-blue-100',
  },
  indigo: {
    bg: 'from-indigo-50 to-white',
    iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-600',
    value: 'text-indigo-700',
    sparkline: '#4f46e5',
    border: 'border-indigo-100',
  },
  slate: {
    bg: 'from-slate-50 to-white',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    value: 'text-slate-700',
    sparkline: '#475569',
    border: 'border-slate-100',
  },
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'teal',
  loading = false,
  sparkline = true,
  subtitle,
}) {
  const Icon = Icons[icon] || Icons.Activity;
  const c = COLOR_CONFIG[color] || COLOR_CONFIG.teal;

  let sparkData = SPARKLINE_DATA.flat;
  if (trend !== undefined) {
    if (trend > 0) sparkData = SPARKLINE_DATA.up;
    else if (trend < 0) sparkData = SPARKLINE_DATA.down;
  }

  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${c.bg} rounded-2xl border ${c.border}
                  shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-fadeIn`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className={`${c.iconBg} p-2.5 rounded-xl flex-shrink-0`}>
          <Icon size={20} className={c.iconText} />
        </div>

        {/* Sparkline */}
        {sparkline && !loading && (
          <div className="w-20 h-8 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={c.sparkline}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Value & title */}
      <div className="px-4 pb-3">
        <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>

        {loading ? (
          <div className="space-y-1.5">
            <div className="h-7 w-24 skeleton" />
            <div className="h-3.5 w-16 skeleton" />
          </div>
        ) : (
          <>
            <p className={`text-2xl font-bold ${c.value} leading-none`}>{value}</p>

            {subtitle && (
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            )}

            {(trend !== undefined || trendLabel) && (
              <div className="flex items-center gap-1.5 mt-2">
                {trend !== undefined && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full
                    ${isPositive ? 'bg-emerald-100 text-emerald-700' : isNegative ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                    {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(trend)}%
                  </span>
                )}
                {trendLabel && (
                  <span className="text-xs text-slate-400">{trendLabel}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Subtle decorative circle */}
      <div
        className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-10 ${c.iconBg}`}
      />
    </div>
  );
}
