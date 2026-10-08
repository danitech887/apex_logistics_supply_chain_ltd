import React from 'react';
import { Calendar } from 'lucide-react';

export const DatePicker = ({
  label,
  name,
  value,
  onChange,
  error = null,
  required = false,
  min = undefined,
  max = undefined,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Calendar className="w-4 h-4" />
        </div>
        <input
          type="date"
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          min={min}
          max={max}
          required={required}
          className={`block w-full rounded-xl border pl-10 pr-3.5 py-2.5 sm:text-sm font-medium transition-all ${
            error
              ? 'border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-white hover:border-slate-300'
          } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};
