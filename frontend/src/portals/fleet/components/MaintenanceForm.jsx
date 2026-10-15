import React, { useState } from 'react';
import { X, Wrench, CheckCircle2, ShieldCheck, Gauge, AlertCircle } from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { CurrencyInput } from '../../../components/forms/CurrencyInput';

export const MaintenanceForm = ({ vehicle, isOpen, onClose, onComplete }) => {
  const [cost, setCost] = useState('48500');
  const [description, setDescription] = useState('Comprehensive 15,000 KM PM: engine oil, fuel filters, brake pad overhaul, and suspension lubrication');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !vehicle) return null;

  const plate = vehicle.registration_plate || vehicle.registrationPlate || 'Vehicle';
  const currentOdo = Number(vehicle.current_odometer ?? vehicle.currentOdometer ?? 0);
  const nextServiceOdo = Number(vehicle.next_service_odometer ?? vehicle.nextServiceOdometer ?? 0);
  const newServiceTarget = currentOdo + 15000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Service action description is required.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onComplete(vehicle.id, cost, description);
      onClose();
    } catch (err) {
      console.error('Service completion failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to clear maintenance status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Preventative Maintenance Log</h2>
              <p className="text-xs text-slate-500">
                <span className="font-mono font-bold text-slate-700">{plate}</span> • {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Telemetry Metrics Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Current Odometer:</span>
              <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                {currentOdo.toLocaleString()} KM
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Service Due Milestone:</span>
              <span className="font-mono font-bold text-rose-600">
                {nextServiceOdo.toLocaleString()} KM (Reached)
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-700 font-bold">New Service Milestone (+15,000 KM):</span>
              <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {newServiceTarget.toLocaleString()} KM
              </span>
            </div>
          </div>

          <ControlledInput
            label="Workshop Service Actions Carried Out"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Engine oil replacement, fuel filter overhaul, KeNHA suspension inspection"
          />

          <CurrencyInput
            label="Workshop Parts & Labor Cost (KES)"
            required
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />

          {/* Compliance Banner */}
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold block">Roadworthiness Sign-Off</span>
              Submitting clears the <span className="font-semibold text-rose-700">MAINTENANCE</span> lock, certifies the truck as roadworthy, and resets the status to <span className="font-semibold text-emerald-700">AVAILABLE</span> for dispatch.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Clearing Service...' : 'Certify & Reset to AVAILABLE'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
