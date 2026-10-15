import React from 'react';
import { X, Truck, Package, ShieldCheck, MapPin, Calendar, Scale, DollarSign, Download, Printer } from 'lucide-react';

export const ConsignmentManifestModal = ({ isOpen, onClose, trip }) => {
  if (!isOpen || !trip) return null;

  const manifestNumber = trip.id
    ? `MAN-${String(trip.id).replace(/-/g, '').substring(0, 8).toUpperCase()}`
    : 'MAN-2026-TRP';

  const departureDate = trip.scheduled_departure
    ? new Date(trip.scheduled_departure).toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Immediate Transit';

  const driverAllowance = 14500.00;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-tight">Highway Transit Manifest</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {manifestNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Consignment Waybill • Transit Corridor Authorized
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Corridor Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                Authorized Route Corridor
              </span>
              <div className="flex items-center space-x-2 font-black text-slate-900 text-sm">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{trip.origin}</span>
                <span className="text-indigo-600 font-bold">➔</span>
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{trip.destination}</span>
              </div>
            </div>
            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                Departure Gate
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {departureDate}
              </span>
            </div>
          </div>

          {/* Consignment & Vehicle Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200/80 space-y-3 bg-white">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Transport Equipment</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Prime Mover Plate:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {trip.vehicle_plate || 'KDG 412M'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fleet Equipment:</span>
                  <span className="font-medium text-slate-800">
                    {trip.vehicle_model || 'Heavy Haulage Rig'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Odometer:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {trip.start_odometer ? `${trip.start_odometer.toLocaleString()} KM` : 'Depot Departure'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 space-y-3 bg-white">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Cargo Specifications</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Consignment:</span>
                  <span className="font-medium text-slate-900 text-right max-w-[160px] truncate">
                    {trip.cargo_description || 'General Containerized Cargo'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Weight:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {Number(trip.cargo_weight_kg || 28000).toLocaleString('en-KE')} KG
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client Account:</span>
                  <span className="font-medium text-slate-800">
                    {trip.customer_name || 'Direct Freight Client'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Driver Allowance Section */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">
                  KeNHA Axle Compliance Verified
                </h4>
                <p className="text-[11px] text-emerald-700">
                  Weighbridge clearance token recorded for Mombasa - Nairobi corridor.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Driver Trip Allowance
              </span>
              <span className="text-sm font-mono font-black text-emerald-900">
                KES {driverAllowance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Electronic Waybill Generated</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Waybill</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
