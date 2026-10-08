import React, { useState } from 'react';
import { X, Truck, ShieldAlert, Check } from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { CurrencyInput } from '../../../components/forms/CurrencyInput';

export const TruckAssignmentModal = ({ isOpen, onClose, onSchedule }) => {
  const [formData, setFormData] = useState({
    vehicleId: 'KDG 412M',
    driverName: 'Michael Kamau (EMP-041)',
    origin: 'Mombasa Port CFS',
    destination: 'Nairobi ICD Embakasi',
    cargoDescription: '40ft Ambient Container - FMCG Cargo',
    cargoWeightKg: '28000',
    agreedRate: '135000',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSchedule(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Schedule & Dispatch Manifest</h2>
              <p className="text-xs text-slate-500">
                Allocate truck asset, verify driver rest hours & axle payload
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assign Truck Asset
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="KDG 412M">KDG 412M - Scania R500 (Capacity: 32,000 kg)</option>
                <option value="KDE 889P">KDE 889P - Mercedes Actros 2640 (Capacity: 30,000 kg)</option>
                <option value="KDA 102Z">KDA 102Z - Isuzu FRR (Capacity: 14,000 kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assign Driver
              </label>
              <select
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Michael Kamau (EMP-041)">Michael Kamau (EMP-041) - Rested</option>
                <option value="Bernard Mutua (EMP-042)">Bernard Mutua (EMP-042) - Rested</option>
                <option value="Peter Otieno (EMP-048)">Peter Otieno (EMP-048) - Available</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ControlledInput
              label="Origin Route"
              required
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              placeholder="e.g. Mombasa Port CFS"
            />
            <ControlledInput
              label="Destination Route"
              required
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g. Nairobi ICD Embakasi"
            />
          </div>

          <ControlledInput
            label="Cargo Classification & Manifest Details"
            required
            value={formData.cargoDescription}
            onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
            placeholder="e.g. Agricultural Teas in Palletized Bags"
          />

          <div className="grid grid-cols-2 gap-3">
            <ControlledInput
              label="Gross Cargo Weight (KG)"
              type="number"
              required
              value={formData.cargoWeightKg}
              onChange={(e) => setFormData({ ...formData, cargoWeightKg: e.target.value })}
              helperText="Must not exceed axle payload ceiling"
            />
            <CurrencyInput
              label="Agreed Freight Tariff"
              required
              value={formData.agreedRate}
              onChange={(e) => setFormData({ ...formData, agreedRate: e.target.value })}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Pre-flight checks passed: Vehicle is marked <span className="font-bold text-emerald-700">AVAILABLE</span>, Driver rest period is compliant, and payload is within rated tolerance.
            </p>
          </div>

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
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
            >
              Confirm & Create Manifest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
