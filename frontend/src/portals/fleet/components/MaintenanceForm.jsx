import React, { useState } from 'react';
import { X, Wrench, CheckCircle2 } from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { CurrencyInput } from '../../../components/forms/CurrencyInput';

export const MaintenanceForm = ({ vehicle, isOpen, onClose, onComplete }) => {
  const [cost, setCost] = useState('48500');
  const [description, setDescription] = useState('Engine oil & fuel filter replacement, brake pads overhaul');

  if (!isOpen || !vehicle) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(vehicle.id, cost, description);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Workshop Service Log</h2>
              <p className="text-xs text-slate-500">{vehicle.registrationPlate} • Preventative Maintenance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Odometer:</span>
              <span className="font-mono font-bold text-slate-800">{vehicle.currentOdometer?.toLocaleString()} KM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Threshold:</span>
              <span className="font-mono font-bold text-rose-600">{vehicle.nextServiceOdometer?.toLocaleString()} KM</span>
            </div>
          </div>

          <ControlledInput
            label="Service Actions Carried Out"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <CurrencyInput
            label="Parts & Labor Cost"
            required
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition"
            >
              Clear Service & Reset to AVAILABLE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
