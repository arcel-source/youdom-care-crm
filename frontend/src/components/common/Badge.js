import React from 'react';
import { getBadgeClasses, getStatusVariant } from '../../utils/helpers';

export default function Badge({ children, variant = 'gray', size = 'sm', dot = false }) {
  const classes = getBadgeClasses(variant);
  const sizes = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${classes} ${sizes[size]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, label, type = 'beneficiaire' }) {
  const variant = getStatusVariant(status);
  return <Badge variant={variant} dot>{label || status}</Badge>;
}
