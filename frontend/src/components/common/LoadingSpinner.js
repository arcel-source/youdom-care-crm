import React from 'react';

export default function LoadingSpinner({ size = 'md', color = 'indigo', text }) {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colors = {
    indigo: 'border-indigo-600',
    white: 'border-white',
    gray: 'border-gray-400',
    green: 'border-green-500',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} border-4 ${colors[color]} border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Chargement..."
      />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}

export function PageLoader({ text = 'Chargement...' }) {
  return (
    <div className="flex items-center justify-center min-h-64 py-16">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function InlineLoader() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}
