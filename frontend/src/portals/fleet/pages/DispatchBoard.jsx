import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/tables/StatusBadge';
import { TruckAssignmentModal } from '../components/TruckAssignmentModal';
import { useFeedback } from '../../../context/FeedbackContext';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Truck,
  Plus,
  Play,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Fuel,
  RefreshCw,
  Download,
  Eye,
  AlertCircle,
  Gauge,
  X,
  Building,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  PackageCheck,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const DispatchBoard = () => {
  const { showSuccess, showError, showConfirm } = useFeedback();

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [reconciliationAlert, setReconciliationAlert] = useState(null);

  // Quick Action Dialogs: Dispatch & Complete Odometer Entry
  const [dispatchModalTrip, setDispatchModalTrip] = useState(null);
  const [startOdoInput, setStartOdoInput] = useState('');
  const [completeModalTrip, setCompleteModalTrip] = useState(null);
  const [endOdoInput, setEndOdoInput] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Fetch all fleet data from PostgreSQL
  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        const [tripsRes, vehiclesRes, employeesRes] = await Promise.all([
          apiClient.get(ENDPOINTS.FLEET.TRIPS),
          apiClient.get(ENDPOINTS.FLEET.VEHICLES),
          apiClient.get(ENDPOINTS.HR.EMPLOYEES),
        ]);

        const rawTrips = tripsRes.data?.results || tripsRes.data || [];
        const rawVehicles = vehiclesRes.data?.results || vehiclesRes.data || [];
        const rawEmployees = employeesRes.data?.results || employeesRes.data || [];

        setTrips(Array.isArray(rawTrips) ? rawTrips : []);
        setVehicles(Array.isArray(rawVehicles) ? rawVehicles : []);
        setDrivers(Array.isArray(rawEmployees) ? rawEmployees : []);
        setDbConnected(true);

        if (isManual) {
          showSuccess({
            title: 'Fleet Operations Synchronized',
            message: `Loaded ${rawTrips.length} highway transit manifests from PostgreSQL.`,
          });
        }
      } catch (err) {
        console.warn('Failed to load fleet data from database:', err);
        setDbConnected(false);
        if (isManual) {
          showError({
            title: 'Sync Warning',
            message: 'Could not fetch latest transit manifests from PostgreSQL.',
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

  // Schedule New Trip
  const handleScheduleTrip = async (payload) => {
    try {
      const res = await apiClient.post(ENDPOINTS.FLEET.TRIPS, payload);
      const created = res.data;
      setTrips((prev) => [created, ...prev]);

      showSuccess({
        title: 'Dispatch Manifest Scheduled',
        message: `Manifest created for route ${created.origin} -> ${created.destination} (${created.vehicle_plate || 'Assigned Asset'}).`,
      });
      fetchData();
    } catch (err) {
      console.error('Failed to schedule trip:', err);
      const msg =
        err.response?.data?.cargo_weight_kg?.[0] ||
        err.response?.data?.vehicle?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Failed to schedule transit trip.';
      showError({
        title: 'Dispatch Scheduling Error',
        message: msg,
      });
      throw err;
    }
  };

  // Open Dispatch Modal
  const openDispatchDialog = (trip) => {
    setDispatchModalTrip(trip);
    const matchedVeh = vehicles.find((v) => String(v.id) === String(trip.vehicle));
    const vehOdo = matchedVeh?.current_odometer;
    setStartOdoInput(trip.start_odometer != null && trip.start_odometer > 0 ? trip.start_odometer : (vehOdo ?? 0));
    setActionError('');
  };

  // Submit Dispatch Action: POST /api/v1/fleet/trips/{id}/dispatch/
  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchModalTrip) return;

    setActionSubmitting(true);
    setActionError('');
    try {
      const res = await apiClient.post(`${ENDPOINTS.FLEET.TRIPS}${dispatchModalTrip.id}/dispatch/`, {
        start_odometer: parseInt(startOdoInput, 10),
      });
      const updated = res.data;

      setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setDispatchModalTrip(null);

      showSuccess({
        title: 'Truck Dispatched',
        message: `Truck asset ${updated.vehicle_plate} is now IN_TRANSIT on the highway corridor.`,
      });
      fetchData();
    } catch (err) {
      console.error('Dispatch failed:', err);
      const msg = err.response?.data?.vehicle || err.response?.data?.driver || err.response?.data?.message || err.message || 'Failed to dispatch truck.';
      setActionError(msg);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Open Complete Dialog
  const openCompleteDialog = (trip) => {
    setCompleteModalTrip(trip);
    const startOdo = Number(trip.start_odometer || 0);
    const estEnd = startOdo > 0 ? startOdo + 485 : 485;
    setEndOdoInput(estEnd);
    setActionError('');
  };

  // Submit Complete & Reconcile: POST /api/v1/fleet/trips/{id}/complete/
  const handleConfirmComplete = async (e) => {
    e.preventDefault();
    if (!completeModalTrip) return;

    const startOdo = completeModalTrip.start_odometer || 0;
    const endOdo = parseInt(endOdoInput, 10);

    if (endOdo < startOdo) {
      setActionError(`Closing odometer (${endOdo} km) cannot be less than opening odometer (${startOdo} km).`);
      return;
    }

    setActionSubmitting(true);
    setActionError('');
    try {
      const res = await apiClient.post(`${ENDPOINTS.FLEET.TRIPS}${completeModalTrip.id}/complete/`, {
        end_odometer: endOdo,
      });
      const result = res.data;

      // Update trips in state
      setTrips((prev) =>
        prev.map((t) =>
          t.id === completeModalTrip.id
            ? { ...t, status: 'COMPLETED', end_odometer: endOdo, distance_km: result.distance_km, reconciled: true }
            : t
        )
      );

      // Trigger cross-department reconciliation banner
      setReconciliationAlert({
        tripId: completeModalTrip.id,
        plate: completeModalTrip.vehicle_plate,
        distance: result.distance_km,
        rate: Number(completeModalTrip.agreed_rate || 0),
        amount: Number(completeModalTrip.agreed_rate || 0) * 1.16,
        invoiceNo: `INV-TRIP-${String(completeModalTrip.id).replace(/-/g, '').slice(0, 6).toUpperCase()}`,
        vehicleStatus: result.vehicle_status,
      });

      setCompleteModalTrip(null);

      showSuccess({
        title: 'Stage 7 Cross-Department Settlement Executed',
        message: `Delivery completed! AR Invoice and General Ledger journal posted automatically.`,
      });
      fetchData();
    } catch (err) {
      console.error('Completion reconciliation failed:', err);
      const msg = err.response?.data?.end_odometer || err.response?.data?.message || err.message || 'Failed to complete trip.';
      setActionError(msg);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Dynamic Fleet KPIs
  const kpis = useMemo(() => {
    let inTransitCount = 0;
    let scheduledCount = 0;
    let completedCount = 0;
    let totalRevenue = 0;

    trips.forEach((t) => {
      const rate = Number(t.agreed_rate || 0);
      totalRevenue += rate;
      if (t.status === 'IN_TRANSIT') inTransitCount += 1;
      else if (t.status === 'SCHEDULED') scheduledCount += 1;
      else if (t.status === 'COMPLETED') completedCount += 1;
    });

    return {
      totalCount: trips.length,
      inTransitCount,
      scheduledCount,
      completedCount,
      totalRevenue,
    };
  }, [trips]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    if (statusFilter === 'ALL') return trips;
    return trips.filter((t) => t.status === statusFilter);
  }, [trips, statusFilter]);

  // Export CSV
  const handleExportCSV = () => {
    if (!trips || trips.length === 0) {
      showError({ title: 'Export Notice', message: 'No manifest records available to export.' });
      return;
    }

    const headers = [
      'Trip ID',
      'Vehicle Registration',
      'Driver Name',
      'Driver Staff #',
      'Shipper / Customer',
      'Origin Route',
      'Destination Route',
      'Cargo Details',
      'Gross Weight (KG)',
      'Agreed Tariff (KES)',
      'Distance (KM)',
      'Status',
      'Reconciled',
    ];

    const rows = trips.map((t) => [
      `"${t.id}"`,
      `"${t.vehicle_plate || ''}"`,
      `"${t.driver_name || ''}"`,
      `"${t.driver_staff_no || ''}"`,
      `"${(t.customer_name || '').replace(/"/g, '""')}"`,
      `"${t.origin}"`,
      `"${t.destination}"`,
      `"${(t.cargo_description || '').replace(/"/g, '""')}"`,
      Number(t.cargo_weight_kg || 0).toFixed(0),
      Number(t.agreed_rate || 0).toFixed(2),
      Number(t.distance_km || 0),
      `"${t.status}"`,
      t.reconciled ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Apex_Dispatch_Manifests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess({
      title: 'Spreadsheet Exported',
      message: `Downloaded CSV manifest for ${trips.length} highway transit dispatches.`,
    });
  };

  // DataTable Columns
  const columns = [
    {
      header: 'Manifest & Asset',
      accessor: 'id',
      cell: (r) => (
        <div>
          <span className="font-mono font-bold text-indigo-700 block text-xs truncate max-w-[120px]">
            {String(r.id).slice(0, 8)}...
          </span>
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
            <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-mono font-black">{r.vehicle_plate || 'Unassigned'}</span>
          </span>
        </div>
      ),
    },
    {
      header: 'Assigned Driver',
      accessor: 'driver_name',
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{r.driver_name || 'Assigned Driver'}</span>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
            Staff No: {r.driver_staff_no || 'EMP-FLEET'}
          </span>
        </div>
      ),
    },
    {
      header: 'Corridor Transit Route',
      accessor: 'origin',
      cell: (r) => (
        <div className="space-y-0.5">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-slate-700 truncate max-w-[110px]">{r.origin}</span>
            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-bold text-indigo-700 truncate max-w-[110px]">{r.destination}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[220px]">
            Shipper: {r.customer_name || 'Commercial Freight Client'}
          </span>
        </div>
      ),
    },
    {
      header: 'Cargo Manifest',
      accessor: 'cargo_description',
      cell: (r) => (
        <div>
          <span className="text-xs text-slate-800 block truncate max-w-xs font-medium">
            {r.cargo_description}
          </span>
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
            <PackageCheck className="w-3 h-3 text-emerald-600" />
            {Number(r.cargo_weight_kg || 0).toLocaleString()} KG Gross
          </span>
        </div>
      ),
    },
    {
      header: 'Agreed Tariff',
      accessor: 'agreed_rate',
      align: 'right',
      cell: (r) => (
        <div className="text-right">
          <span className="font-mono font-bold text-slate-900 text-xs block">
            KES {Number(r.agreed_rate || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </span>
          {r.distance_km > 0 && (
            <span className="text-[10px] text-slate-400 font-mono block">
              {r.distance_km} KM Logged
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Manifest Status',
      accessor: 'status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Operational Actions',
      sortable: false,
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end space-x-1.5">
          {r.status === 'SCHEDULED' && (
            <button
              type="button"
              onClick={() => openDispatchDialog(r)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-2xs transition"
              title="Dispatch Truck Onto Transit Corridor"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Dispatch</span>
            </button>
          )}

          {r.status === 'IN_TRANSIT' && (
            <button
              type="button"
              onClick={() => openCompleteDialog(r)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition"
              title="Complete Delivery & Auto-Reconcile"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Complete & Settle</span>
            </button>
          )}

          {r.status === 'COMPLETED' && (
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Reconciled
            </span>
          )}

          <button
            type="button"
            onClick={() => setSelectedTrip(r)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Inspect Trip Details"
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
          <Breadcrumbs items={['Fleet Operations Workspace', 'Transit Dispatch Board']} />
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Live Transit & Dispatch Operations
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
            Real-time highway manifests, driver allocation, telematics tracking, and automated Stage 7 post-delivery settlement
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
            title="Reload Trips from PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
            title="Export Manifests to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Schedule Dispatch */}
          <button
            type="button"
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Dispatch</span>
          </button>
        </div>
      </div>

      {/* Dynamic Fleet KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: In-Transit Trucks */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              In Transit On Highway
            </span>
            <span className="text-xl font-black text-sky-700 mt-1 block">
              {kpis.inTransitCount} Trucks
            </span>
            <span className="text-[10px] font-semibold text-sky-600 flex items-center mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse mr-1" />
              Active Corridor Haulage
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Scheduled Dispatches */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Scheduled Pending Departure
            </span>
            <span className="text-xl font-black text-amber-700 mt-1 block">
              {kpis.scheduledCount} Manifests
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              Ready at Terminal Gate
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Delivered Freight */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Delivered & Reconciled
            </span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">
              {kpis.completedCount} Deliveries
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center mt-0.5">
              <CheckCircle className="w-3 h-3 mr-0.5" /> Stage 7 Auto-Settled
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Gross Haulage Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Gross Freight Revenue
            </span>
            <span className="text-lg font-black text-indigo-900 font-mono mt-1 block">
              KES {kpis.totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              Across {kpis.totalCount} Corridor Runs
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stage 7 Cross-Department Reconciliation Alert */}
      {reconciliationAlert && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-start justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-700">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-emerald-950">
                  Stage 7 Automated Cross-Department Settlement Succeeded!
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  PostgreSQL Committed
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-medium">
                Trip for truck <span className="font-mono font-bold text-slate-900">{reconciliationAlert.plate}</span> completed successfully ({reconciliationAlert.distance} KM logged).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Finance (AR & Revenue)
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    Tax Invoice #{reconciliationAlert.invoiceNo}
                  </span>
                  <span className="font-mono font-semibold text-emerald-600 text-[11px] block mt-0.5">
                    KES {reconciliationAlert.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })} (16% VAT)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    General Ledger Entry
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    Double-Entry Journal
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    DR AR (1200) • CR Rev (4100) + VAT (2200)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Fleet Telematics Asset
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    Truck {reconciliationAlert.plate}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                    Status: {reconciliationAlert.vehicleStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReconciliationAlert(null)}
            className="p-1 text-emerald-600 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Dispatches', count: trips.length },
          { key: 'IN_TRANSIT', label: 'In Transit / On Highway', count: trips.filter((t) => t.status === 'IN_TRANSIT').length },
          { key: 'SCHEDULED', label: 'Scheduled Departure', count: trips.filter((t) => t.status === 'SCHEDULED').length },
          { key: 'COMPLETED', label: 'Completed & Reconciled', count: trips.filter((t) => t.status === 'COMPLETED').length },
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

      {/* Manifests DataTable */}
      <DataTable
        columns={columns}
        data={filteredTrips}
        searchPlaceholder="Filter dispatches by truck plate (e.g. KDG 412M), driver, route, status..."
        pageSize={6}
        isLoading={loading}
      />

      {/* Modal: Schedule New Manifest */}
      <TruckAssignmentModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSchedule={handleScheduleTrip}
        vehicles={vehicles}
        drivers={drivers}
      />

      {/* Dialog: Dispatch Truck with Opening Odometer */}
      {dispatchModalTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600">
                  <Play className="w-5 h-5 fill-sky-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Confirm Highway Dispatch</h3>
                  <p className="text-xs text-slate-500">
                    Verify opening odometer reading before truck departure
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalTrip(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="mt-4 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Assigned Truck Asset:</span>
                  <span className="font-mono font-bold text-slate-900">{dispatchModalTrip.vehicle_plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Transit Route:</span>
                  <span className="font-bold text-indigo-700">{dispatchModalTrip.origin} → {dispatchModalTrip.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Driver:</span>
                  <span className="font-bold text-slate-800">{dispatchModalTrip.driver_name}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Opening Odometer Reading (KM) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    required
                    value={startOdoInput}
                    onChange={(e) => setStartOdoInput(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 sm:text-sm font-mono font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Recorded from vehicle dashboard at terminal departure gate.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchModalTrip(null)}
                  disabled={actionSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-40 rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{actionSubmitting ? 'Dispatching...' : 'Confirm Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Complete Delivery with Closing Odometer & Reconcile */}
      {completeModalTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Complete Delivery & Settle</h3>
                  <p className="text-xs text-slate-500">
                    Triggers Stage 7 multi-ledger cross-department reconciliation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompleteModalTrip(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmComplete} className="mt-4 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Assigned Truck Asset:</span>
                  <span className="font-mono font-bold text-slate-900">{completeModalTrip.vehicle_plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Opening Departure Odometer:</span>
                  <span className="font-mono font-bold text-slate-800">{completeModalTrip.start_odometer} KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Freight Tariff Settlement:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    KES {Number(completeModalTrip.agreed_rate || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Closing Odometer Reading (KM) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    required
                    value={endOdoInput}
                    onChange={(e) => setEndOdoInput(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 sm:text-sm font-mono font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Calculates total route kilometers and verifies maintenance service intervals.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteModalTrip(null)}
                  disabled={actionSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{actionSubmitting ? 'Settling...' : 'Complete & Settle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Manifest Details */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 font-mono font-black text-xs">
                  {selectedTrip.vehicle_plate}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Transit Manifest Details</h3>
                  <span className="text-xs text-slate-500">Corridor Freight Waybill Inspection</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Shipper / Customer:</span>
                  <span className="font-bold text-slate-900">{selectedTrip.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Transit Route:</span>
                  <span className="font-bold text-indigo-700">{selectedTrip.origin} → {selectedTrip.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Assigned Driver:</span>
                  <span className="font-bold text-slate-800">{selectedTrip.driver_name} ({selectedTrip.driver_staff_no})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Cargo Manifest:</span>
                  <span className="font-semibold text-slate-800">{selectedTrip.cargo_description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Gross Weight:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {Number(selectedTrip.cargo_weight_kg || 0).toLocaleString()} KG
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Agreed Freight Tariff:</span>
                  <span className="font-mono font-bold text-slate-900">
                    KES {Number(selectedTrip.agreed_rate || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Opening Odometer:</span>
                  <span className="font-mono font-semibold text-slate-700">{selectedTrip.start_odometer || 0} KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Closing Odometer:</span>
                  <span className="font-mono font-semibold text-slate-700">{selectedTrip.end_odometer ? `${selectedTrip.end_odometer} KM` : 'En Route'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total Distance:</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedTrip.distance_km || 0} KM</span>
                </div>
              </div>

              {selectedTrip.fuel_logs && selectedTrip.fuel_logs.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1.5">
                  <span className="font-bold uppercase text-[10px] text-amber-800 tracking-wider flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5" /> En-route Fuel Logs ({selectedTrip.fuel_logs.length})
                  </span>
                  {selectedTrip.fuel_logs.map((fl, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                      <span>{fl.station_name} (#{fl.receipt_number})</span>
                      <span className="font-mono font-bold">{fl.liters_filled}L • KES {Number(fl.total_cost).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTrip(null)}
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
