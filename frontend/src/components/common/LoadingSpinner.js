import React from 'react';

/* ─── Spinner ─────────────────────────────────────────────────────────── */
const sizeMap = {
  sm: { outer: 'w-5 h-5', border: 'border-2' },
  md: { outer: 'w-8 h-8', border: 'border-2' },
  lg: { outer: 'w-12 h-12', border: 'border-[3px]' },
};

export const Spinner = ({ size = 'md', color = 'teal', className = '' }) => {
  const { outer, border } = sizeMap[size] || sizeMap.md;
  const trackColor = color === 'white' ? 'border-white/20' : 'border-teal-100';
  const spinColor = color === 'white' ? 'border-t-white' : 'border-t-teal-600';

  return (
    <div
      className={`${outer} ${border} rounded-full animate-spin ${trackColor} ${spinColor} ${className}`}
    />
  );
};

/* ─── Skeleton ────────────────────────────────────────────────────────── */
export const SkeletonBar = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <div
    className={`${width} ${height} bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded-lg animate-pulse ${className}`}
    style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}
  />
);

export const SkeletonCircle = ({ size = 'w-10 h-10', className = '' }) => (
  <div
    className={`${size} rounded-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse ${className}`}
  />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <SkeletonCircle size="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <SkeletonBar width="w-1/2" height="h-3" />
        <SkeletonBar width="w-1/3" height="h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonBar height="h-3" />
      <SkeletonBar width="w-4/5" height="h-3" />
      <SkeletonBar width="w-2/3" height="h-3" />
    </div>
  </div>
);

export const SkeletonRow = ({ className = '' }) => (
  <div className={`flex items-center gap-4 py-3 px-4 ${className}`}>
    <SkeletonCircle size="w-8 h-8" />
    <SkeletonBar width="w-1/4" height="h-3" />
    <SkeletonBar width="w-1/5" height="h-3" />
    <SkeletonBar width="w-1/6" height="h-3" />
    <SkeletonBar width="w-1/6" height="h-6" className="rounded-full" />
  </div>
);

/* ─── PageLoader ──────────────────────────────────────────────────────── */
export const PageLoader = ({ message = 'Chargement en cours…' }) => (
  <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 animate-fadeIn">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-teal-100 rounded-full" />
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-teal-600 rounded-full animate-spin" />
    </div>
    <p className="text-sm text-slate-400 font-medium">{message}</p>
  </div>
);

export const InlineLoader = ({ className = '' }) => (
  <Spinner size="sm" className={`inline-block ${className}`} />
);

/* ─── Default export ──────────────────────────────────────────────────── */
const LoadingSpinner = ({ size = 'md', color = 'teal', className = '' }) => (
  <Spinner size={size} color={color} className={className} />
);

export default LoadingSpinner;
