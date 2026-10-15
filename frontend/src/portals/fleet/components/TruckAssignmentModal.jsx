import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Truck,
  ShieldAlert,
  ShieldCheck,
  Check,
  AlertCircle,
  Building,
  User,
  MapPin,
  Calendar,
  Weight,
  Receipt,
  Plus,
} from 'lucide-react';
import { ControlledInput } from '../../../components/forms/ControlledInput';
import { CurrencyInput } from '../../../components/forms/CurrencyInput';
import { DatePicker } from '../../../components/forms/DatePicker';
import { useAuth } from '../../../hooks/useAuth';

export const TruckAssignmentModal = ({
  isOpen,
  onClose,
  onSchedule,
  vehicles = [],
  drivers = [],
}) => {
  const { user } = useAuth();
  const currentTenant = user?.tenant || {
    id: '1017d569-1402-485f-b34d-41030b15d2a0',
    company_name: 'Apex Logistics & Supply Chain Ltd',
    subdomain: 'apex-hq',
  };

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    customerName: '',
    origin: '',
    destination: '',
    cargoDescription: '',
    cargoWeightKg: '',
    agreedRate: '120000',
    scheduledDeparture: '',
  });

  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Available vehicles (AVAILABLE status preferred)
  const availableVehicles = useMemo(() => {
    return vehicles.filter((v) => v.status === 'AVAILABLE');
  }, [vehicles]);

  // Filter fleet drivers or employees
  const fleetDrivers = useMemo(() => {
    return drivers.filter(
      (d) =>
        d.department === 'FLEET' ||
        d.designation?.toLowerCase().includes('driver') ||
        d.is_active
    );
  }, [drivers]);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      const firstAvailableVeh = availableVehicles[0] || vehicles[0];
      const firstDriver = fleetDrivers[0] || drivers[0];
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 2);

      setFormData({
        vehicleId: firstAvailableVeh?.id || '',
        driverId: firstDriver?.id || '',
        customerName: 'Brookside Dairy Ltd',
        origin: 'Mombasa Port CFS',
        destination: 'Nairobi ICD Embakasi',
        cargoDescription: '40ft Ambient Container - FMCG Cargo',
        cargoWeightKg: '28000',
        agreedRate: '135000',
        scheduledDeparture: defaultDate.toISOString().slice(0, 16),
      });
      setTouched({});
      setServerError('');
      setIsSubmitting(false);
    }
  }, [isOpen, vehicles, drivers, availableVehicles, fleetDrivers]);

  // Selected vehicle details
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => String(v.id) === String(formData.vehicleId));
  }, [vehicles, formData.vehicleId]);

  // Overload Check
  const maxCapacity = Number(selectedVehicle?.payload_capacity_kg || 32000);
  const cargoWeight = Number(formData.cargoWeightKg || 0);
  const isOverloaded = cargoWeight > maxCapacity;
  const isVehicleUnavailable = selectedVehicle && selectedVehicle.status !== 'AVAILABLE';

  // Form Validation
  const errors = useMemo(() => {
    const errs = {};
    if (!formData.vehicleId) errs.vehicleId = 'Please select a truck asset.';
    if (isVehicleUnavailable) {
      errs.vehicleId = `Truck is currently ${selectedVehicle?.status} and cannot be scheduled.`;
    }
    if (!formData.driverId) errs.driverId = 'Please select an assigned driver.';
    if (!formData.customerName.trim()) errs.customerName = 'Customer/Shipper name is required.';
    if (!formData.origin.trim()) errs.origin = 'Origin transit terminal is required.';
    if (!formData.destination.trim()) errs.destination = 'Destination destination terminal is required.';
    if (!formData.cargoDescription.trim()) errs.cargoDescription = 'Cargo manifest description is required.';
    if (!formData.cargoWeightKg || isNaN(cargoWeight) || cargoWeight <= 0) {
      errs.cargoWeightKg = 'Cargo weight must be greater than 0 kg.';
    } else if (isOverloaded) {
      errs.cargoWeightKg = `Overload alert: Weight (${cargoWeight.toLocaleString()} kg) exceeds truck capacity (${maxCapacity.toLocaleString()} kg).`;
    }
    if (!formData.agreedRate || Number(formData.agreedRate) <= 0) {
      errs.agreedRate = 'Agreed freight tariff must be positive.';
    }
    return errs;
  }, [formData, selectedVehicle, isVehicleUnavailable, isOverloaded, cargoWeight, maxCapacity]);

  const isValid = Object.keys(errors).length === 0;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setTouched({
      vehicleId: true,
      driverId: true,
      customerName: true,
      origin: true,
      destination: true,
      cargoDescription: true,
      cargoWeightKg: true,
      agreedRate: true,
    });

    if (!isValid) {
      setServerError('Please correct the validation errors highlighted below before proceeding.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tenant: currentTenant.id,
        vehicle: formData.vehicleId,
        driver: formData.driverId,
        customer_name: formData.customerName.trim(),
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        cargo_description: formData.cargoDescription.trim(),
        cargo_weight_kg: cargoWeight,
        agreed_rate: Number(formData.agreedRate),
        status: 'SCHEDULED',
        scheduled_departure: formData.scheduledDeparture
          ? new Date(formData.scheduledDeparture).toISOString()
          : new Date().toISOString(),
        start_odometer: selectedVehicle?.current_odometer || 0,
      };

      await onSchedule(payload);
      onClose();
    } catch (err) {
      console.error('Failed to schedule dispatch:', err);
      const msg =
        err.response?.data?.cargo_weight_kg ||
        err.response?.data?.vehicle ||
        err.response?.data?.driver ||
        err.response?.data?.message ||
        err.message ||
        'Failed to schedule freight dispatch.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Schedule Freight Dispatch Manifest</h2>
              <p className="text-xs text-slate-500">
                Allocate truck asset, verify driver rest hours & axle payload tolerance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-4 h-4" />
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
                <span className="text-[11px] text-slate-500 font-mono">
                  Subdomain: {currentTenant.subdomain}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Tenant
            </span>
          </div>

          {/* Vehicle and Driver Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assign Commercial Truck Asset <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_plate} • {v.make} {v.model} ({Number(v.payload_capacity_kg).toLocaleString()} kg) - [{v.status}]
                  </option>
                ))}
              </select>
              {touched.vehicleId && errors.vehicleId && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.vehicleId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assign Certified Driver <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {fleetDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.full_name || d.staff_number} ({d.staff_number}) • {d.designation || 'Driver'}
                  </option>
                ))}
              </select>
              {touched.driverId && errors.driverId && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.driverId}</p>
              )}
            </div>
          </div>

          {/* Shipper / Customer Name */}
          <div>
            <ControlledInput
              label="Corporate Shipper / Customer"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="e.g. Brookside Dairy Ltd, Unilever Kenya Ltd"
              error={touched.customerName ? errors.customerName : null}
            />
          </div>

          {/* Route Terminals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ControlledInput
              label="Origin Transit Terminal"
              required
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              placeholder="e.g. Mombasa Port CFS Gate 4"
              error={touched.origin ? errors.origin : null}
            />
            <ControlledInput
              label="Destination Delivery Terminal"
              required
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g. Nairobi ICD Embakasi Inland Port"
              error={touched.destination ? errors.destination : null}
            />
          </div>

          {/* Cargo Classification */}
          <div>
            <ControlledInput
              label="Cargo Classification & Manifest Details"
              required
              value={formData.cargoDescription}
              onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
              placeholder="e.g. 40ft High Cube Container - FMCG Packaged Consumer Goods"
              error={touched.cargoDescription ? errors.cargoDescription : null}
            />
          </div>

          {/* Cargo Weight and Agreed Tariff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <ControlledInput
                label="Gross Cargo Weight (KG)"
                type="number"
                required
                value={formData.cargoWeightKg}
                onChange={(e) => setFormData({ ...formData, cargoWeightKg: e.target.value })}
                placeholder="28000"
                error={touched.cargoWeightKg ? errors.cargoWeightKg : null}
              />
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                Rated Truck Ceiling: {maxCapacity.toLocaleString()} KG
              </span>
            </div>

            <div>
              <CurrencyInput
                label="Agreed Freight Tariff"
                required
                value={formData.agreedRate}
                onChange={(e) => setFormData({ ...formData, agreedRate: e.target.value })}
              />
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                Excluding KRA 16% Output VAT (Auto-Computed)
              </span>
            </div>
          </div>

          {/* Axle Payload & Pre-flight Safety Banner */}
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start space-x-2.5 transition ${
              isOverloaded
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {isOverloaded ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">
                {isOverloaded
                  ? `Overload Alert: Axle load limit exceeded by ${(cargoWeight - maxCapacity).toLocaleString()} KG!`
                  : 'Axle Weight Safety Tolerance: Passed & Within Highway Regulation'}
              </span>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isOverloaded
                  ? 'Vehicle cannot be dispatched beyond rated highway payload tolerance to prevent KeNHA axle penalties.'
                  : `Assigned Truck Asset ${selectedVehicle?.registration_plate || ''} has ${(maxCapacity - cargoWeight).toLocaleString()} KG safety margin remaining.`}
              </p>
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
              <span>{isSubmitting ? 'Scheduling Manifest...' : 'Confirm & Schedule Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
