import React, { useState, useEffect, useMemo } from 'react';
import { X, Fuel, Plus, Check, AlertCircle, Gauge, Receipt, Building, Truck, DollarSign } from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { CurrencyInput } from '../../../components/forms/CurrencyInput';
import { useAuth } from '../../../hooks/useAuth';

export const HIGHWAY_FUEL_STATIONS = [
  'TotalEnergies Mtito Andei Highway',
  'Shell Voi Corridor Station',
  'Rubis Salama Bypass Station',
  'Ola Energy Sultan Hamud',
  'Vivo Energy Athi River Terminal',
  'National Oil Kibwezi Depot',
  'Gulf Energy Makindu Highway Hub',
];

export const LogFuelModal = ({ isOpen, onClose, onLogFuel, trips = [] }) => {
  const { user } = useAuth();
  const currentTenant = user?.tenant || {
    id: '1017d569-1402-485f-b34d-41030b15d2a0',
    company_name: 'Apex Logistics & Supply Chain Ltd',
    subdomain: 'apex-hq',
  };

  const [formData, setFormData] = useState({
    tripId: '',
    stationName: 'TotalEnergies Mtito Andei Highway',
    receiptNumber: '',
    litersFilled: '350',
    costPerLiter: '185.50',
    odometerReading: '',
  });

  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Active / eligible trips for fuel procurement
  const activeTrips = useMemo(() => {
    const active = trips.filter((t) => t.status === 'IN_TRANSIT' || t.status === 'SCHEDULED' || t.status === 'ASSIGNED');
    return active.length > 0 ? active : trips;
  }, [trips]);

  // Selected trip details
  const selectedTrip = useMemo(() => {
    return trips.find((t) => String(t.id) === String(formData.tripId));
  }, [trips, formData.tripId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultTrip = activeTrips[0] || trips[0];
      const defaultOdo = defaultTrip?.start_odometer ? String(defaultTrip.start_odometer + 220) : '142320';
      const randomReceipt = `RCP-FUEL-${Math.floor(100000 + Math.random() * 900000)}`;

      setFormData({
        tripId: defaultTrip?.id || '',
        stationName: 'TotalEnergies Mtito Andei Highway',
        receiptNumber: randomReceipt,
        litersFilled: '380',
        costPerLiter: '185.50',
        odometerReading: defaultOdo,
      });
      setTouched({});
      setServerError('');
      setIsSubmitting(false);
    }
  }, [isOpen, activeTrips, trips]);

  if (!isOpen) return null;

  const litersNum = parseFloat(formData.litersFilled) || 0;
  const rateNum = parseFloat(formData.costPerLiter) || 0;
  const totalCost = (litersNum * rateNum).toFixed(2);
  const odoNum = parseInt(formData.odometerReading, 10) || 0;

  // Form Validation
  const errors = {};
  if (!formData.tripId) errors.tripId = 'Please select an active highway trip.';
  if (!formData.stationName.trim()) errors.stationName = 'Station name is required.';
  if (!formData.receiptNumber.trim()) errors.receiptNumber = 'Fiscal receipt number is required.';
  if (litersNum <= 0) errors.litersFilled = 'Liters dispensed must be greater than 0.';
  if (rateNum <= 0) errors.costPerLiter = 'Unit cost per liter must be positive.';
  if (odoNum <= 0) errors.odometerReading = 'Valid pump odometer reading is required.';
  else if (selectedTrip && selectedTrip.start_odometer && odoNum < selectedTrip.start_odometer) {
    errors.odometerReading = `Odometer (${odoNum} KM) cannot be less than trip departure reading (${selectedTrip.start_odometer} KM).`;
  }

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      tripId: true,
      stationName: true,
      receiptNumber: true,
      litersFilled: true,
      costPerLiter: true,
      odometerReading: true,
    });
    setServerError('');

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const payload = {
        trip: formData.tripId,
        tripId: formData.tripId,
        station_name: formData.stationName.trim(),
        stationName: formData.stationName.trim(),
        receipt_number: formData.receiptNumber.trim().toUpperCase(),
        receiptNumber: formData.receiptNumber.trim().toUpperCase(),
        liters_filled: litersNum,
        litersFilled: litersNum,
        cost_per_liter: rateNum,
        costPerLiter: rateNum,
        total_cost: parseFloat(totalCost),
        totalCost: parseFloat(totalCost),
        odometer_reading: odoNum,
        odometerReading: odoNum,
      };

      await onLogFuel(payload);
      onClose();
    } catch (err) {
      console.error('Failed to log fuel procurement:', err);
      const msg =
        err.response?.data?.receipt_number?.[0] ||
        err.response?.data?.trip?.[0] ||
        err.response?.data?.odometer_reading?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Failed to log highway fuel procurement.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Log En-Route Fuel Procurement</h2>
              <p className="text-xs text-slate-500">
                Record commercial diesel fill-up and fiscal pump receipt voucher
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Operating Tenant & Corridor Banner */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Apex Logistics"
                  className="h-full w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">{currentTenant.company_name}</span>
                <span className="text-[11px] text-slate-500">
                  Official Transit Corridor Dispatch • Corporate Fleet Card Voucher
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Verified Voucher
            </span>
          </div>

          {/* Assign Active Highway Trip */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Active Corridor Transit Trip <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.tripId}
              onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Choose Highway Dispatch Manifest --</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.vehicle_plate || 'Truck'} • {t.origin} → {t.destination} ({t.driver_name || 'Driver'}) - [{t.status}]
                </option>
              ))}
            </select>
            {touched.tripId && errors.tripId && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.tripId}</p>
            )}
            {selectedTrip && (
              <div className="mt-1.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 flex justify-between">
                <span>Truck Asset: <b className="font-mono">{selectedTrip.vehicle_plate}</b></span>
                <span>Driver: <b>{selectedTrip.driver_name}</b></span>
                <span>Departure Odo: <b className="font-mono">{selectedTrip.start_odometer || 0} KM</b></span>
              </div>
            )}
          </div>

          {/* Station Name & Fiscal Receipt Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Highway Fuel Station <span className="text-rose-500">*</span>
              </label>
              <input
                list="station-list"
                value={formData.stationName}
                onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                placeholder="e.g. TotalEnergies Mtito Andei"
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <datalist id="station-list">
                {HIGHWAY_FUEL_STATIONS.map((st, i) => (
                  <option key={i} value={st} />
                ))}
              </datalist>
              {touched.stationName && errors.stationName && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.stationName}</p>
              )}
            </div>

            <div>
              <ControlledInput
                label="Fiscal Pump Receipt Number"
                required
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. RCP-FUEL-90812"
                error={touched.receiptNumber ? errors.receiptNumber : null}
              />
            </div>
          </div>

          {/* Fuel Liters & Unit Tariff */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <ControlledInput
                label="Liters Dispensed"
                type="number"
                step="0.01"
                required
                value={formData.litersFilled}
                onChange={(e) => setFormData({ ...formData, litersFilled: e.target.value })}
                placeholder="350.00"
                error={touched.litersFilled ? errors.litersFilled : null}
              />
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                Automotive Gas Oil (AGO)
              </span>
            </div>

            <div>
              <ControlledInput
                label="Tariff Per Liter (KES)"
                type="number"
                step="0.01"
                required
                value={formData.costPerLiter}
                onChange={(e) => setFormData({ ...formData, costPerLiter: e.target.value })}
                placeholder="185.50"
                error={touched.costPerLiter ? errors.costPerLiter : null}
              />
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                EPRA Regulated Tariff
              </span>
            </div>

            <div>
              <ControlledInput
                label="Pump Odometer (KM)"
                type="number"
                required
                value={formData.odometerReading}
                onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                placeholder="142350"
                error={touched.odometerReading ? errors.odometerReading : null}
              />
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                Recorded at Station Pump
              </span>
            </div>
          </div>

          {/* Total Cost Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Total Fuel Expenditure (Auto-Calculated)
              </span>
              <span className="text-xl font-black font-mono mt-0.5 block">
                KES {Number(totalCost).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {litersNum.toLocaleString()} Liters @ KES {rateNum.toFixed(2)}/L
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
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
              disabled={!isValid || isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Log...' : 'Confirm & Log Fuel Procurement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
