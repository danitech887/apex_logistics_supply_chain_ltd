import React from 'react';

export const CurrencyInput = ({
  label,
  name,
  value,
  onChange,
  currency = 'KES',
  placeholder = '0.00',
  error = null,
  required = false,
  disabled = false,
  helperText = null,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {currency}
          </span>
        </div>
        <input
          type="number"
          step="0.01"
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-xl border pl-16 pr-3.5 py-2.5 sm:text-sm font-semibold text-right tabular-nums transition-all ${
            error
              ? 'border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-white hover:border-slate-300'
          } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
    </div>
  );
};
