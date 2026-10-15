import React, { useState, useEffect } from 'react';
import { X, Truck, Plus, Check, AlertCircle, Gauge, Scale, ShieldCheck } from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { useAuth } from '../../../hooks/useAuth';

export const AddVehicleModal = ({ isOpen, onClose, onAddVehicle }) => {
  const { user } = useAuth();
  const currentTenant = user?.tenant || {
    id: '1017d569-1402-485f-b34d-41030b15d2a0',
    company_name: 'Apex Logistics & Supply Chain Ltd',
    subdomain: 'apex-hq',
  };

  const [formData, setFormData] = useState({
    registration_plate: '',
    make: 'Scania',
    model: 'G460 6x4 Prime Mover',
    payload_capacity_kg: '32000',
    current_odometer: '120000',
    next_service_odometer: '135000',
    status: 'AVAILABLE',
  });

  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        registration_plate: '',
        make: 'Scania',
        model: 'G460 6x4 Prime Mover',
        payload_capacity_kg: '32000',
        current_odometer: '120000',
        next_service_odometer: '135000',
        status: 'AVAILABLE',
      });
      setTouched({});
      setServerError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-update next service odometer when current odometer changes
  const handleCurrentOdoChange = (val) => {
    const odoNum = parseInt(val, 10);
    setFormData((prev) => ({
      ...prev,
      current_odometer: val,
      next_service_odometer: !isNaN(odoNum) ? String(odoNum + 15000) : prev.next_service_odometer,
    }));
  };

  const currentOdo = parseInt(formData.current_odometer, 10) || 0;
  const nextServiceOdo = parseInt(formData.next_service_odometer, 10) || 0;
  const payloadKg = parseFloat(formData.payload_capacity_kg) || 0;

  // Validation
  const errors = {};
  const cleanedPlate = formData.registration_plate.trim().toUpperCase();
  if (!cleanedPlate) {
    errors.registration_plate = 'Registration plate is required (e.g. KDG 412M).';
  } else if (!/^K[A-Z]{2}\s?[0-9]{3}[A-Z]$/.test(cleanedPlate)) {
    errors.registration_plate = 'Enter a valid Kenya commercial plate format (e.g. KDG 412M).';
  }

  if (!formData.make.trim()) errors.make = 'Vehicle make is required.';
  if (!formData.model.trim()) errors.model = 'Vehicle model is required.';
  if (payloadKg <= 0) errors.payload_capacity_kg = 'Payload capacity must be greater than 0 kg.';
  if (currentOdo < 0) errors.current_odometer = 'Current odometer reading cannot be negative.';
  if (nextServiceOdo < currentOdo) {
    errors.next_service_odometer = 'Next service milestone cannot be less than current odometer.';
  }

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      registration_plate: true,
      make: true,
      model: true,
      payload_capacity_kg: true,
      current_odometer: true,
      next_service_odometer: true,
    });
    setServerError('');

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const payload = {
        tenant: currentTenant.id,
        registration_plate: cleanedPlate,
        make: formData.make.trim(),
        model: formData.model.trim(),
        payload_capacity_kg: payloadKg,
        current_odometer: currentOdo,
        next_service_odometer: nextServiceOdo,
        status: formData.status,
      };

      await onAddVehicle(payload);
      onClose();
    } catch (err) {
      console.error('Failed to register vehicle asset:', err);
      const msg =
        err.response?.data?.registration_plate?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Failed to register commercial vehicle asset.';
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
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Register Commercial Vehicle Asset</h2>
              <p className="text-xs text-slate-500">
                Onboard prime mover or rigid cargo truck into telematics registry
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

          {/* Operating Tenant Banner */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Apex Logistics"
                  className="h-full w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">{currentTenant.company_name}</span>
                <span className="text-[11px] text-slate-500">
                  Commercial Fleet Asset Registry • Roadworthy Certified
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Fleet Ledger
            </span>
          </div>

          {/* Registration Plate & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <ControlledInput
                label="Vehicle Registration Plate"
                required
                value={formData.registration_plate}
                onChange={(e) => setFormData({ ...formData, registration_plate: e.target.value.toUpperCase() })}
                placeholder="e.g. KDF 111A"
                error={touched.registration_plate ? errors.registration_plate : null}
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Format: KXX 000X (e.g. KDG 412M, KDA 102Z)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Initial Operational Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="AVAILABLE">AVAILABLE - Ready for Highway Dispatch</option>
                <option value="MAINTENANCE">MAINTENANCE - In Workshop / Service Due</option>
                <option value="IN_TRANSIT">IN_TRANSIT - Active Transit Route</option>
                <option value="RETIRED">RETIRED - Decommissioned</option>
              </select>
            </div>
          </div>

          {/* Make & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Manufacturer / Make <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Scania">Scania (Sweden)</option>
                <option value="Mercedes-Benz">Mercedes-Benz (Germany)</option>
                <option value="Volvo">Volvo Trucks (Sweden)</option>
                <option value="Isuzu">Isuzu East Africa (Japan/KE)</option>
                <option value="MAN">MAN Truck & Bus (Germany)</option>
                <option value="FAW">FAW Commercial (China)</option>
                <option value="Mitsubishi Fuso">Mitsubishi Fuso (Japan)</option>
              </select>
              {touched.make && errors.make && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.make}</p>
              )}
            </div>

            <ControlledInput
              label="Model Specification"
              required
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g. R500 Highline Prime Mover"
              error={touched.model ? errors.model : null}
            />
          </div>

          {/* Payload Capacity & Odometers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <ControlledInput
                label="Rated Payload (KG)"
                type="number"
                required
                value={formData.payload_capacity_kg}
                onChange={(e) => setFormData({ ...formData, payload_capacity_kg: e.target.value })}
                placeholder="32000"
                error={touched.payload_capacity_kg ? errors.payload_capacity_kg : null}
              />
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {(payloadKg / 1000).toFixed(1)} Metric Tonnes
              </span>
            </div>

            <div>
              <ControlledInput
                label="Current Odometer (KM)"
                type="number"
                required
                value={formData.current_odometer}
                onChange={(e) => handleCurrentOdoChange(e.target.value)}
                placeholder="120000"
                error={touched.current_odometer ? errors.current_odometer : null}
              />
            </div>

            <div>
              <ControlledInput
                label="Next Service Milestone (KM)"
                type="number"
                required
                value={formData.next_service_odometer}
                onChange={(e) => setFormData({ ...formData, next_service_odometer: e.target.value })}
                placeholder="135000"
                error={touched.next_service_odometer ? errors.next_service_odometer : null}
              />
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                Interval: +{(nextServiceOdo - currentOdo).toLocaleString()} KM
              </span>
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Asset...' : 'Register Commercial Truck Asset'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
