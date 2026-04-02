import React, { forwardRef } from 'react';

const TextArea = forwardRef(function TextArea({
  label,
  error,
  helper,
  required = false,
  maxLength,
  rows = 4,
  className = '',
  containerClassName = '',
  ...props
}, ref) {
  const id = props.id || props.name || Math.random().toString(36).slice(2);
  const currentLength = props.value ? String(props.value).length : 0;

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full border rounded-lg px-3 py-2 text-sm resize-y transition-colors
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          ${error ? 'border-red-400 bg-red-50 text-red-900 placeholder-red-300' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${className}
        `}
        aria-invalid={!!error}
        {...props}
      />
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-xs text-red-600">⚠ {error}</p>
        ) : helper ? (
          <p className="text-xs text-gray-400">{helper}</p>
        ) : <span />}
        {maxLength && (
          <p className={`text-xs ${currentLength >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

export default TextArea;
