import React from 'react';

const variantStyles = {
  success: {
    container: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
  },
  warning: {
    container: 'bg-amber-100 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
  },
  danger: {
    container: 'bg-rose-100 text-rose-700 border border-rose-200',
    dot: 'bg-rose-500',
  },
  info: {
    container: 'bg-sky-100 text-sky-700 border border-sky-200',
    dot: 'bg-sky-500',
  },
  neutral: {
    container: 'bg-slate-100 text-slate-600 border border-slate-200',
    dot: 'bg-slate-400',
  },
  teal: {
    container: 'bg-teal-100 text-teal-700 border border-teal-200',
    dot: 'bg-teal-500',
  },
};

const sizeStyles = {
  xs: 'text-xs px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-sm px-2.5 py-1 gap-1.5',
};

const dotSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
};

const Badge = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  className = '',
}) => {
  const styles = variantStyles[variant] || variantStyles.neutral;
  const sizeClass = sizeStyles[size] || sizeStyles.sm;
  const dotSize = dotSizes[size] || dotSizes.sm;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${styles.container} ${sizeClass} ${className}`}
    >
      {dot && (
        <span className={`relative inline-flex rounded-full ${dotSize} ${styles.dot} flex-shrink-0`}>
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles.dot} opacity-75`}
            />
          )}
        </span>
      )}
      {children}
    </span>
  );
};

const STATUS_VARIANT_MAP = {
  actif: 'success',
  inactif: 'neutral',
  en_attente: 'warning',
  suspendu: 'danger',
  nouveau: 'info',
  contacte: 'teal',
  qualifie: 'warning',
  devis_envoye: 'info',
  gagne: 'success',
  perdu: 'danger',
  payee: 'success',
  en_attente_paiement: 'warning',
  impayee: 'danger',
  annulee: 'neutral',
};

export const StatusBadge = ({ status, label, size = 'xs' }) => {
  const variant = STATUS_VARIANT_MAP[status] || 'neutral';
  return (
    <Badge variant={variant} size={size} dot>
      {label || status}
    </Badge>
  );
};

export default Badge;
