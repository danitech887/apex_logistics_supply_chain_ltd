import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { MaintenanceForm } from '../components/MaintenanceForm';
import { AddVehicleModal } from '../components/AddVehicleModal';
import { useFeedback } from '../../../context/FeedbackContext';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Truck,
  Wrench,
  AlertTriangle,
  ShieldCheck,
  Plus,
  RefreshCw,
  Download,
  Eye,
  Gauge,
  CheckCircle2,
  Calendar,
  X,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const FleetStatusPage = () => {
  const { showSuccess, showError } = useFeedback();

  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Status Tab Filter
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [inspectVehicle, setInspectVehicle] = useState(null);

  // Fetch all fleet vehicles and active trips from PostgreSQL
  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        const [vehiclesRes, tripsRes] = await Promise.all([
          apiClient.get(ENDPOINTS.FLEET.VEHICLES),
          apiClient.get(ENDPOINTS.FLEET.TRIPS),
        ]);

        const rawVehicles = vehiclesRes.data?.results || vehiclesRes.data || [];
        const rawTrips = tripsRes.data?.results || tripsRes.data || [];

        setVehicles(Array.isArray(rawVehicles) ? rawVehicles : []);
        setTrips(Array.isArray(rawTrips) ? rawTrips : []);
        setDbConnected(true);

        if (isManual) {
          showSuccess({
            title: 'Fleet Assets Synchronized',
            message: `Loaded ${rawVehicles.length} commercial vehicle telematics records from PostgreSQL.`,
          });
        }
      } catch (err) {
        console.warn('Failed to fetch fleet vehicles from PostgreSQL:', err);
        setDbConnected(false);
        if (isManual) {
          showError({
            title: 'Sync Warning',
            message: 'Could not fetch latest fleet assets from database.',
          });
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [showSuccess, showError]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Clearing Maintenance via API: POST /api/v1/fleet/vehicles/{id}/service_complete/
  const handleClearMaintenance = async (id, cost, description) => {
    try {
      const res = await apiClient.post(`${ENDPOINTS.FLEET.VEHICLES}${id}/service_complete/`);
      const data = res.data;

      showSuccess({
        title: 'Maintenance Cycle Cleared',
        message: `Vehicle certified roadworthy and reset to AVAILABLE. Next service milestone set to ${Number(data.next_service_odometer).toLocaleString()} KM.`,
      });

      fetchData();
    } catch (err) {
      console.error('Failed to clear maintenance cycle:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to clear vehicle maintenance cycle.';
      showError({
        title: 'Maintenance Update Error',
        message: msg,
      });
      throw err;
    }
  };

  // Handle Adding New Vehicle via API: POST /api/v1/fleet/vehicles/
  const handleAddVehicle = async (payload) => {
    try {
      const res = await apiClient.post(ENDPOINTS.FLEET.VEHICLES, payload);
      const created = res.data;

      setVehicles((prev) => [created, ...prev]);

      showSuccess({
        title: 'Commercial Vehicle Registered',
        message: `Asset ${created.registration_plate} (${created.make} ${created.model}) added to telematics registry.`,
      });

      fetchData();
    } catch (err) {
      console.error('Failed to register vehicle:', err);
      const msg =
        err.response?.data?.registration_plate?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Failed to register vehicle asset.';
      showError({
        title: 'Vehicle Registration Error',
        message: msg,
      });
      throw err;
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!vehicles || vehicles.length === 0) {
      showError({ title: 'Export Notice', message: 'No vehicle records available to export.' });
      return;
    }

    const headers = [
      'Registration Plate',
      'Manufacturer / Make',
      'Model Specification',
      'Rated Payload (KG)',
      'Current Odometer (KM)',
      'Next Service Milestone (KM)',
      'Service Remaining (KM)',
      'Status',
      'Service Due Flag',
    ];

    const rows = vehicles.map((v) => {
      const currentOdo = Number(v.current_odometer || 0);
      const nextOdo = Number(v.next_service_odometer || 0);
      const remaining = nextOdo - currentOdo;
      return [
        `"${v.registration_plate}"`,
        `"${v.make}"`,
        `"${v.model}"`,
        Number(v.payload_capacity_kg || 0).toFixed(0),
        currentOdo,
        nextOdo,
        remaining,
        `"${v.status}"`,
        currentOdo >= nextOdo ? 'YES' : 'NO',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Apex_Fleet_Assets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess({
      title: 'Spreadsheet Exported',
      message: `Downloaded CSV asset registry for ${vehicles.length} commercial trucks.`,
    });
  };

  // Telemetry KPIs
  const kpis = useMemo(() => {
    let available = 0;
    let inTransit = 0;
    let maintenance = 0;
    let totalPayloadTons = 0;

    vehicles.forEach((v) => {
      const payload = Number(v.payload_capacity_kg || 0) / 1000;
      totalPayloadTons += payload;

      if (v.status === 'AVAILABLE') available += 1;
      else if (v.status === 'IN_TRANSIT') inTransit += 1;
      else if (v.status === 'MAINTENANCE' || v.current_odometer >= v.next_service_odometer) {
        maintenance += 1;
      }
    });

    return {
      total: vehicles.length,
      available,
      inTransit,
      maintenance,
      totalPayloadTons: totalPayloadTons.toFixed(1),
    };
  }, [vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    if (statusFilter === 'ALL') return vehicles;
    return vehicles.filter((v) => v.status === statusFilter);
  }, [vehicles, statusFilter]);

  // Table Columns
  const columns = [
    {
      header: 'Plate & Model Specification',
      accessor: 'registration_plate',
      cell: (r) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-black text-slate-900 text-sm tracking-tight">
              {r.registration_plate}
            </span>
            {r.current_odometer >= r.next_service_odometer && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                Service Due
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium block mt-0.5">
            {r.make} • {r.model}
          </span>
        </div>
      ),
    },
    {
      header: 'Rated Payload Ceiling',
      accessor: 'payload_capacity_kg',
      align: 'right',
      cell: (r) => (
        <div className="text-right">
          <span className="font-mono font-bold text-slate-800 text-xs block">
            {(Number(r.payload_capacity_kg || 0) / 1000).toFixed(1)} Tonnes
          </span>
          <span className="text-[10px] text-slate-400 font-mono block">
            {Number(r.payload_capacity_kg || 0).toLocaleString()} KG Max
          </span>
        </div>
      ),
    },
    {
      header: 'Current Telemetry Odometer',
      accessor: 'current_odometer',
      align: 'right',
      cell: (r) => (
        <div className="text-right">
          <span className="font-mono font-bold text-slate-900 text-xs flex items-center justify-end gap-1">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            {Number(r.current_odometer || 0).toLocaleString()} KM
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
            Logged GPS Reading
          </span>
        </div>
      ),
    },
    {
      header: 'Service Target & Health',
      accessor: 'next_service_odometer',
      align: 'right',
      cell: (r) => {
        const currentOdo = Number(r.current_odometer || 0);
        const nextOdo = Number(r.next_service_odometer || 0);
        const kmRemaining = nextOdo - currentOdo;
        const isOverdue = kmRemaining <= 0;
        const isNearDue = kmRemaining > 0 && kmRemaining <= 1500;

        // Progress toward next service (15,000 km standard window)
        const windowSize = 15000;
        const percentHealth = Math.max(0, Math.min(100, (kmRemaining / windowSize) * 100));

        return (
          <div className="text-right min-w-[140px]">
            <span
              className={`font-mono font-bold text-xs block ${
                isOverdue ? 'text-rose-600' : isNearDue ? 'text-amber-600' : 'text-slate-700'
              }`}
            >
              {nextOdo.toLocaleString()} KM Target
            </span>

            {/* Health Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isOverdue ? 'bg-rose-500 w-full' : isNearDue ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${isOverdue ? 100 : percentHealth}%` }}
              />
            </div>

            <span
              className={`block text-[10px] font-bold mt-0.5 ${
                isOverdue ? 'text-rose-600' : isNearDue ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              {isOverdue
                ? `Exceeded by ${Math.abs(kmRemaining).toLocaleString()} KM`
                : `${kmRemaining.toLocaleString()} KM remaining`}
            </span>
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
      header: 'Workshop & Inspection',
      sortable: false,
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end space-x-1.5">
          {r.status === 'MAINTENANCE' || r.current_odometer >= r.next_service_odometer ? (
            <button
              type="button"
              onClick={() => {
                setSelectedVehicle(r);
                setMaintenanceOpen(true);
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-2xs transition"
              title="Clear Preventative Maintenance Cycle"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Service Workshop</span>
            </button>
          ) : (
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
              Roadworthy
            </span>
          )}

          <button
            type="button"
            onClick={() => setInspectVehicle(r)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Inspect Vehicle Telematics"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={['Fleet Operations Workspace', 'Fleet Status & Telemetry']} />
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Commercial Fleet Status & Telemetry
            </h1>
            {dbConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PostgreSQL Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Offline Cache
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live telematics tracking, payload ceilings, preventative maintenance thresholds, and roadworthiness certification
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sync DB */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            title="Reload Vehicles from PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
            title="Export Vehicle Registry to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Register Asset */}
          <button
            type="button"
            onClick={() => setAddVehicleOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vehicle Asset</span>
          </button>
        </div>
      </div>

      {/* Dynamic Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Fleet Assets */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Fleet Assets
            </span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {kpis.total} Prime Movers
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              Cumulative Payload: {kpis.totalPayloadTons} Tonnes
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Roadworthy & Available */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Available for Dispatch
            </span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">
              {kpis.available} Trucks
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center mt-0.5">
              <ShieldCheck className="w-3 h-3 mr-0.5" /> Certified Roadworthy
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Active In Transit */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              In Transit On Corridor
            </span>
            <span className="text-xl font-black text-sky-700 mt-1 block">
              {kpis.inTransit} Trucks
            </span>
            <span className="text-[10px] font-semibold text-sky-600 flex items-center mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse mr-1" />
              Active Highway Telemetry
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: In Workshop / Maintenance Due */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Workshop / Service Due
            </span>
            <span className={`text-xl font-black mt-1 block ${kpis.maintenance > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {kpis.maintenance} Trucks
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              {kpis.maintenance > 0 ? 'Action Required in Workshop' : 'Zero Service Backlog'}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${kpis.maintenance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Fleet Assets', count: vehicles.length },
          { key: 'AVAILABLE', label: 'Available / Roadworthy', count: vehicles.filter((v) => v.status === 'AVAILABLE').length },
          { key: 'IN_TRANSIT', label: 'In Transit / On Route', count: vehicles.filter((v) => v.status === 'IN_TRANSIT').length },
          { key: 'MAINTENANCE', label: 'Workshop / Maintenance Due', count: vehicles.filter((v) => v.status === 'MAINTENANCE' || v.current_odometer >= v.next_service_odometer).length },
          { key: 'RETIRED', label: 'Decommissioned', count: vehicles.filter((v) => v.status === 'RETIRED').length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === tab.key ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Vehicles DataTable */}
      <DataTable
        columns={columns}
        data={filteredVehicles}
        searchPlaceholder="Filter trucks by plate (e.g. KDG 412M), make, model, status..."
        pageSize={6}
        isLoading={loading}
      />

      {/* Modal: Service Workshop */}
      <MaintenanceForm
        vehicle={selectedVehicle}
        isOpen={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        onComplete={handleClearMaintenance}
      />

      {/* Modal: Add New Vehicle Asset */}
      <AddVehicleModal
        isOpen={addVehicleOpen}
        onClose={() => setAddVehicleOpen(false)}
        onAddVehicle={handleAddVehicle}
      />

      {/* Modal: Inspect Vehicle Telematics */}
      {inspectVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 font-mono font-black text-sm">
                  {inspectVehicle.registration_plate}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {inspectVehicle.make} {inspectVehicle.model}
                  </h3>
                  <span className="text-xs text-slate-500">Commercial Fleet Asset Telematics</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectVehicle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              {/* Asset Technical Specifications */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Registration Plate:</span>
                  <span className="font-mono font-bold text-slate-900">{inspectVehicle.registration_plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Manufacturer / Model:</span>
                  <span className="font-bold text-slate-800">{inspectVehicle.make} {inspectVehicle.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Rated Payload Capacity:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {Number(inspectVehicle.payload_capacity_kg).toLocaleString()} KG ({(Number(inspectVehicle.payload_capacity_kg) / 1000).toFixed(1)} Tonnes)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Current Operational Status:</span>
                  <StatusBadge status={inspectVehicle.status} />
                </div>
              </div>

              {/* Preventative Maintenance Status */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Current Odometer:</span>
                  <span className="font-mono font-bold text-slate-900">{Number(inspectVehicle.current_odometer).toLocaleString()} KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Next Service Milestone:</span>
                  <span className="font-mono font-bold text-slate-900">{Number(inspectVehicle.next_service_odometer).toLocaleString()} KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Distance Until Next Workshop PM:</span>
                  <span className={`font-mono font-bold ${
                    inspectVehicle.current_odometer >= inspectVehicle.next_service_odometer ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {inspectVehicle.current_odometer >= inspectVehicle.next_service_odometer
                      ? `OVERDUE by ${(inspectVehicle.current_odometer - inspectVehicle.next_service_odometer).toLocaleString()} KM`
                      : `${(inspectVehicle.next_service_odometer - inspectVehicle.current_odometer).toLocaleString()} KM remaining`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="pt-1">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        inspectVehicle.current_odometer >= inspectVehicle.next_service_odometer ? 'bg-rose-500 w-full' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${
                          inspectVehicle.current_odometer >= inspectVehicle.next_service_odometer
                            ? 100
                            : Math.max(0, Math.min(100, ((inspectVehicle.next_service_odometer - inspectVehicle.current_odometer) / 15000) * 100))
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setInspectVehicle(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
