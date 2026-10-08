import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', text }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2 py-6">
      <Loader2 className={`${sizes[size]} text-indigo-600 animate-spin`} />
      {text && <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{text}</p>}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-3 animate-pulse">
      <div className="h-10 bg-slate-100 rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-50/80 rounded-lg w-full flex items-center space-x-4 px-4">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-1/6" />
          <div className="h-4 bg-slate-200 rounded w-1/5" />
        </div>
      ))}
    </div>
  );
};
