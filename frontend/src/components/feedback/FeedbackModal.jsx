import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';

export const FeedbackModal = ({
  isOpen,
  onClose,
  type = 'info', // 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title,
  message,
  details = null,
  confirmText = 'OK',
  cancelText = null,
  onConfirm = null,
  confirmVariant = 'primary', // 'primary' | 'danger' | 'warning'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = {
    success: {
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
      bgIcon: 'bg-emerald-50 ring-8 ring-emerald-50/50',
      borderAccent: 'border-emerald-200',
      badge: 'text-emerald-700 bg-emerald-100/70',
      badgeText: 'Success',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
    },
    error: {
      icon: <XCircle className="w-8 h-8 text-rose-600" />,
      bgIcon: 'bg-rose-50 ring-8 ring-rose-50/50',
      borderAccent: 'border-rose-200',
      badge: 'text-rose-700 bg-rose-100/70',
      badgeText: 'Error',
      buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
      bgIcon: 'bg-amber-50 ring-8 ring-amber-50/50',
      borderAccent: 'border-amber-200',
      badge: 'text-amber-700 bg-amber-100/70',
      badgeText: 'Warning',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
    },
    info: {
      icon: <Info className="w-8 h-8 text-indigo-600" />,
      bgIcon: 'bg-indigo-50 ring-8 ring-indigo-50/50',
      borderAccent: 'border-indigo-200',
      badge: 'text-indigo-700 bg-indigo-100/70',
      badgeText: 'Notice',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20',
    },
    confirm: {
      icon: confirmVariant === 'danger'
        ? <AlertOctagon className="w-8 h-8 text-rose-600" />
        : <AlertTriangle className="w-8 h-8 text-amber-600" />,
      bgIcon: confirmVariant === 'danger'
        ? 'bg-rose-50 ring-8 ring-rose-50/50'
        : 'bg-amber-50 ring-8 ring-amber-50/50',
      borderAccent: confirmVariant === 'danger' ? 'border-rose-200' : 'border-amber-200',
      badge: confirmVariant === 'danger' ? 'text-rose-700 bg-rose-100/70' : 'text-amber-700 bg-amber-100/70',
      badgeText: 'Confirmation Required',
      buttonBg: confirmVariant === 'danger'
        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
    },
  };

  const currentConfig = config[type] || config.info;

  // Render detail fields if structured error object is present
  const renderDetails = () => {
    if (!details) return null;

    if (typeof details === 'string') {
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 overflow-x-auto max-h-36">
          {details}
        </div>
      );
    }

    if (typeof details === 'object') {
      return (
        <div className="mt-3 p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl text-xs space-y-1 max-h-40 overflow-y-auto">
          <p className="font-bold text-rose-900 tracking-wide uppercase text-[10px] mb-1">
            Validation Details:
          </p>
          {Object.entries(details).map(([key, val]) => (
            <div key={key} className="flex items-start space-x-1.5 text-rose-800">
              <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-500" />
              <div>
                <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                <span>{Array.isArray(val) ? val.join(', ') : String(val)}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scale-up">
        {/* Top Accent Strip */}
        <div className={`h-1.5 w-full ${currentConfig.buttonBg.split(' ')[0]}`} />

        <div className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon & Badge */}
          <div className="flex items-center space-x-4 mb-4">
            <div className={`p-3 rounded-2xl ${currentConfig.bgIcon} flex items-center justify-center shrink-0`}>
              {currentConfig.icon}
            </div>
            <div>
              <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${currentConfig.badge}`}>
                {currentConfig.badgeText}
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                {title}
              </h3>
            </div>
          </div>

          {/* Main Message */}
          <div className="mt-2 text-sm text-slate-600 leading-relaxed font-medium">
            {message}
          </div>

          {/* Details (if any) */}
          {renderDetails()}

          {/* Modal Actions */}
          <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            {cancelText && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition shadow-sm"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (onConfirm) {
                  onConfirm();
                } else {
                  onClose();
                }
              }}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition ${currentConfig.buttonBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
