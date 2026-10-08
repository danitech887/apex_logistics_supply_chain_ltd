import React, { useState } from 'react';
import { X, Calendar, Play, AlertCircle } from 'lucide-react';
import { DatePicker } from '../../../components/forms/DatePicker';
import { HelperMessage } from '../../../components/feedback/HelperMessage';

export const NewPayRunModal = ({ isOpen, onClose, onSave }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Format first and last day of next month or current month
  const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
  const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    period_start: firstDay,
    period_end: lastDay,
    run_date: today,
    status: 'DRAFT',
  });

  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.period_start || !formData.period_end) {
      setFormError('Both period start and end dates are required.');
      return;
    }
    if (new Date(formData.period_start) > new Date(formData.period_end)) {
      setFormError('Period start date must be before period end date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create pay run cycle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">
                Initiate New Pay Run Cycle
              </h2>
              <p className="text-xs text-indigo-100">
                Setup statutory period & trigger batch calculations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <HelperMessage
              type="error"
              title="Validation Notice"
              message={formError}
              onClose={() => setFormError(null)}
            />
          )}

          <div className="space-y-3">
            <DatePicker
              label="Cycle Period Start"
              required
              value={formData.period_start}
              onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
              disabled={isSubmitting}
            />

            <DatePicker
              label="Cycle Period End"
              required
              value={formData.period_end}
              onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
              disabled={isSubmitting}
            />

            <DatePicker
              label="Run & Execution Date"
              required
              value={formData.run_date}
              onChange={(e) => setFormData({ ...formData, run_date: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Automatic Processing:</p>
            <p>
              Creating this cycle will automatically compute KRA PAYE, NSSF, SHA, and Housing Levy for all currently active workforce personnel in the database.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isSubmitting ? 'Computing...' : 'Create & Compute'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
