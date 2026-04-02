import React, { forwardRef } from 'react';

const Input = forwardRef(function Input({
  label,
  error,
  helper,
  prefix,
  suffix,
  type = 'text',
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
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 text-gray-400 pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={`
            w-full border rounded-lg px-3 py-2 text-sm transition-colors
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            ${error ? 'border-red-400 bg-red-50 text-red-900 placeholder-red-300' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}
            ${prefix ? 'pl-9' : ''}
            ${suffix ? 'pr-9' : ''}
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 text-gray-400 pointer-events-none">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {helper && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-400">{helper}</p>
      )}
    </div>
  );
});

export default Input;
