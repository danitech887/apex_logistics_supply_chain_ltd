import React, { useState } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { MaintenanceForm } from '../components/MaintenanceForm';
import { Truck, Wrench, AlertTriangle, ShieldCheck, Plus } from 'lucide-react';

export const FleetStatusPage = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  const [vehicles, setVehicles] = useState([
    {
      id: 'v-1',
      registrationPlate: 'KDG 412M',
      make: 'Scania',
      model: 'R500 Highline Prime Mover',
      payloadCapacityKg: 32000,
      currentOdometer: 142585,
      nextServiceOdometer: 145000,
      status: 'AVAILABLE',
    },
    {
      id: 'v-2',
      registrationPlate: 'KDE 889P',
      make: 'Mercedes-Benz',
      model: 'Actros 2640LS 6x4',
      payloadCapacityKg: 30000,
      currentOdometer: 89340,
      nextServiceOdometer: 90000,
      status: 'AVAILABLE',
    },
    {
      id: 'v-3',
      registrationPlate: 'KDA 102Z',
      make: 'Isuzu',
      model: 'FRR 90 Forward Medium Freight',
      payloadCapacityKg: 14000,
      currentOdometer: 216010,
      nextServiceOdometer: 215000, // Exceeded! Service due
      status: 'MAINTENANCE',
    },
    {
      id: 'v-4',
      registrationPlate: 'KDB 773Y',
      make: 'Volvo',
      model: 'FH16 540 Globetrotter',
      payloadCapacityKg: 34000,
      currentOdometer: 112000,
      nextServiceOdometer: 125000,
      status: 'IN_TRANSIT',
    },
    {
      id: 'v-5',
      registrationPlate: 'KDC 551L',
      make: 'MAN',
      model: 'TGX 26.480 EfficientLine',
      payloadCapacityKg: 31000,
      currentOdometer: 64500,
      nextServiceOdometer: 75000,
      status: 'AVAILABLE',
    },
  ]);

  const handleClearMaintenance = (id, cost, description) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              status: 'AVAILABLE',
              nextServiceOdometer: v.currentOdometer + 15000,
            }
          : v
      )
    );
  };

  const columns = [
    {
      header: 'Plate & Model',
      accessor: 'registrationPlate',
      cell: (r) => (
        <div>
          <span className="font-mono font-black text-slate-900 block text-sm">
            {r.registrationPlate}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {r.make} {r.model}
          </span>
        </div>
      ),
    },
    {
      header: 'Rated Payload',
      accessor: 'payloadCapacityKg',
      align: 'right',
      cell: (r) => (
        <span className="font-mono font-bold text-slate-800">
          {(r.payloadCapacityKg / 1000).toFixed(1)} Tonnes
        </span>
      ),
    },
    {
      header: 'Current Odometer',
      accessor: 'currentOdometer',
      align: 'right',
      cell: (r) => (
        <span className="font-mono text-slate-700">
          {r.currentOdometer.toLocaleString()} KM
        </span>
      ),
    },
    {
      header: 'Service Milestone',
      accessor: 'nextServiceOdometer',
      align: 'right',
      cell: (r) => {
        const isOverdue = r.currentOdometer >= r.nextServiceOdometer;
        return (
          <div className="text-right">
            <span
              className={`font-mono font-bold ${
                isOverdue ? 'text-rose-600' : 'text-slate-600'
              }`}
            >
              {r.nextServiceOdometer.toLocaleString()} KM
            </span>
            {isOverdue && (
              <span className="block text-[10px] font-bold text-rose-600 uppercase">
                Service Due!
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Asset Status',
      accessor: 'status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Workshop Action',
      sortable: false,
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end">
          {r.status === 'MAINTENANCE' ? (
            <button
              onClick={() => {
                setSelectedVehicle(r);
                setMaintenanceOpen(true);
              }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-2xs transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Service Workshop</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400">Roadworthy</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={['Fleet Operations Workspace', 'Fleet Telemetry & Status']} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Commercial Fleet Asset Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking 120 heavy articulated prime movers and distribution vans across transit hubs
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={vehicles}
        searchPlaceholder="Filter trucks by plate, make, model, status..."
        pageSize={6}
      />

      <MaintenanceForm
        vehicle={selectedVehicle}
        isOpen={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        onComplete={handleClearMaintenance}
      />
    </div>
  );
};
