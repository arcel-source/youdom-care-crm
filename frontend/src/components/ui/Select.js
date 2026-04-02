import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(function Select({
  label,
  error,
  helper,
  options = [],
  placeholder = 'Sélectionner...',
  required = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) {
  const id = props.id || props.name || Math.random().toString(36).slice(2);

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={`
            w-full border rounded-lg px-3 py-2 text-sm appearance-none pr-8 transition-colors
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            ${error ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-300 bg-white text-gray-900'}
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${className}
          `}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => {
            if (typeof opt === 'string') {
              return <option key={opt} value={opt}>{opt}</option>;
            }
            return (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className="text-xs text-red-600">⚠ {error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-gray-400">{helper}</p>
      )}
    </div>
  );
});

export default Select;
