import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from 'lucide-react';

export const HelperMessage = ({
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  title = null,
  message,
  onClose = null,
  className = '',
}) => {
  if (!message) return null;

  const styles = {
    success: {
      container: 'bg-emerald-50/80 border-emerald-200/90 text-emerald-900',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-950',
    },
    error: {
      container: 'bg-rose-50/80 border-rose-200/90 text-rose-900',
      icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
      titleColor: 'text-rose-950',
    },
    warning: {
      container: 'bg-amber-50/80 border-amber-200/90 text-amber-900',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-950',
    },
    info: {
      container: 'bg-indigo-50/80 border-indigo-200/90 text-indigo-900',
      icon: <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />,
      titleColor: 'text-indigo-950',
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div
      role="alert"
      className={`flex items-start justify-between p-3.5 border rounded-2xl shadow-sm text-xs font-medium transition-all ${current.container} ${className}`}
    >
      <div className="flex items-start space-x-2.5">
        {current.icon}
        <div>
          {title && (
            <p className={`font-bold tracking-tight text-xs ${current.titleColor} mb-0.5`}>
              {title}
            </p>
          )}
          <div className="leading-relaxed">{message}</div>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-black/5 transition"
          aria-label="Dismiss message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
