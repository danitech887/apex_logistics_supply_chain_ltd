import React, { useState } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { TruckAssignmentModal } from '../components/TruckAssignmentModal';
import {
  Truck,
  Plus,
  Play,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Fuel,
} from 'lucide-react';

export const DispatchBoard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [reconciliationAlert, setReconciliationAlert] = useState(null);

  const [trips, setTrips] = useState([
    {
      id: 'trp-01',
      vehiclePlate: 'KDG 412M',
      driverName: 'Michael Kamau',
      origin: 'Mombasa Port CFS',
      destination: 'Nairobi ICD Embakasi',
      cargo: '40ft Ambient Container - FMCG Cargo',
      weightKg: 28000,
      agreedRate: 135000,
      status: 'IN_TRANSIT',
      startOdometer: 142100,
      endOdometer: null,
      departureTime: 'Today, 06:30 AM',
      reconciled: false,
    },
    {
      id: 'trp-02',
      vehiclePlate: 'KDE 889P',
      driverName: 'Bernard Mutua',
      origin: 'Nairobi Central Depot',
      destination: 'Kisumu Regional CFS',
      cargo: 'Pharmaceutical & Medical Consumables',
      weightKg: 14500,
      agreedRate: 98000,
      status: 'SCHEDULED',
      startOdometer: 89340,
      endOdometer: null,
      departureTime: 'Scheduled for 16:00 PM',
      reconciled: false,
    },
    {
      id: 'trp-03',
      vehiclePlate: 'KDA 102Z',
      driverName: 'Peter Otieno',
      origin: 'Nakuru Milling Silos',
      destination: 'Mombasa Port Export Gate',
      cargo: '20ft Bulk Grain Feed',
      weightKg: 26000,
      agreedRate: 110000,
      status: 'COMPLETED',
      startOdometer: 215400,
      endOdometer: 216010,
      departureTime: 'Yesterday, 14:00 PM',
      reconciled: true,
    },
  ]);

  const handleDispatch = (tripId) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: 'IN_TRANSIT' } : t))
    );
  };

  const handleCompleteAndReconcile = (trip) => {
    const endOdo = (trip.startOdometer || 142100) + 485; // 485 km Mombasa to Nairobi
    setTrips((prev) =>
      prev.map((t) =>
        t.id === trip.id
          ? {
              ...t,
              status: 'COMPLETED',
              endOdometer: endOdo,
              reconciled: true,
            }
          : t
      )
    );

    // Cross-department reconciliation alert
    setReconciliationAlert({
      tripId: trip.id,
      plate: trip.vehiclePlate,
      distance: 485,
      invoiceNo: `INV-${trip.id.toUpperCase()}`,
      amount: trip.agreedRate * 1.16,
    });
  };

  const columns = [
    {
      header: 'Trip ID & Asset',
      accessor: 'id',
      cell: (r) => (
        <div>
          <span className="font-mono font-bold text-indigo-600 block">{r.id}</span>
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-0.5">
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            {r.vehiclePlate}
          </span>
        </div>
      ),
    },
    {
      header: 'Driver',
      accessor: 'driverName',
      cell: (r) => <span className="font-bold text-slate-800 text-xs">{r.driverName}</span>,
    },
    {
      header: 'Transit Route',
      accessor: 'origin',
      cell: (r) => (
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="font-semibold text-slate-700">{r.origin}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-indigo-700">{r.destination}</span>
        </div>
      ),
    },
    {
      header: 'Cargo Manifest',
      accessor: 'cargo',
      cell: (r) => (
        <div>
          <span className="text-xs text-slate-800 block truncate max-w-xs">{r.cargo}</span>
          <span className="text-[11px] text-slate-400 font-mono">
            {r.weightKg.toLocaleString()} KG
          </span>
        </div>
      ),
    },
    {
      header: 'Agreed Tariff',
      accessor: 'agreedRate',
      align: 'right',
      cell: (r) => (
        <span className="font-mono font-bold text-slate-900">
          KES {r.agreedRate.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Operational Actions',
      sortable: false,
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end space-x-2">
          {r.status === 'SCHEDULED' && (
            <button
              onClick={() => handleDispatch(r.id)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-2xs transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Dispatch Truck</span>
            </button>
          )}

          {r.status === 'IN_TRANSIT' && (
            <button
              onClick={() => handleCompleteAndReconcile(r)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Complete & Reconcile</span>
            </button>
          )}

          {r.status === 'COMPLETED' && (
            <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Reconciled
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={['Fleet Operations Workspace', 'Dispatch Board']} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Live Transit & Dispatch Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time highway manifests, driver allocation, and automated Stage 7 post-delivery settlement
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Dispatch</span>
          </button>
        </div>
      </div>

      {/* Cross-Department Reconciliation Alert */}
      {reconciliationAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between animate-fade-in shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                Stage 7 Automated Cross-Department Settlement Succeeded!
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Trip for <span className="font-bold">{reconciliationAlert.plate}</span> completed ({reconciliationAlert.distance} KM logged).
              </p>
              <ul className="text-[11px] text-emerald-800 mt-2 list-disc list-inside space-y-0.5 font-medium">
                <li>
                  <span className="font-bold">Finance:</span> Final Tax Invoice #{reconciliationAlert.invoiceNo} issued for KES {reconciliationAlert.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })} (AR debited, Revenue credited).
                </li>
                <li>
                  <span className="font-bold">Fleet Ops:</span> Truck asset {reconciliationAlert.plate} reset to <span className="font-bold">AVAILABLE</span>; odometer updated.
                </li>
                <li>
                  <span className="font-bold">HR / Payroll:</span> Driver per-diem and mileage allowance pushed automatically to upcoming pay run.
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setReconciliationAlert(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded-md"
          >
            Dismiss
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={trips}
        searchPlaceholder="Filter dispatches by truck plate, driver, origin, status..."
        pageSize={5}
      />

      <TruckAssignmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSchedule={(data) => {
          setTrips((prev) => [
            {
              id: `trp-0${prev.length + 1}`,
              vehiclePlate: data.vehicleId,
              driverName: data.driverName.split(' (')[0],
              origin: data.origin,
              destination: data.destination,
              cargo: data.cargoDescription,
              weightKg: Number(data.cargoWeightKg),
              agreedRate: Number(data.agreedRate),
              status: 'SCHEDULED',
              startOdometer: 145000,
              endOdometer: null,
              departureTime: 'Ready for departure',
              reconciled: false,
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
};
