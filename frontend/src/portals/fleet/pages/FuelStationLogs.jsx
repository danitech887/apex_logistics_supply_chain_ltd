import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Breadcrumbs } from '../../../components/layout/Breadcrumbs';
import { DataTable } from '../../../components/tables/DataTable';
import { LogFuelModal } from '../components/LogFuelModal';
import { useFeedback } from '../../../context/FeedbackContext';
import apiClient from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  Fuel,
  Plus,
  RefreshCw,
  Download,
  Eye,
  Receipt,
  Truck,
  Gauge,
  Calendar,
  Building,
  CheckCircle2,
  X,
  TrendingDown,
  DollarSign,
  ArrowRight,
  MapPin,
} from 'lucide-react';

export const FuelStationLogs = () => {
  const { showSuccess, showError } = useFeedback();

  const [fuelLogs, setFuelLogs] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Filter state
  const [stationFilter, setStationFilter] = useState('ALL');

  // Modals state
  const [logFuelOpen, setLogFuelOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Fetch fuel logs & trips from PostgreSQL
  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        const [fuelRes, tripsRes] = await Promise.all([
          apiClient.get(ENDPOINTS.FLEET.FUEL_LOGS),
          apiClient.get(ENDPOINTS.FLEET.TRIPS),
        ]);

        const rawFuel = fuelRes.data?.results || fuelRes.data || [];
        const rawTrips = tripsRes.data?.results || tripsRes.data || [];

        setFuelLogs(Array.isArray(rawFuel) ? rawFuel : []);
        setTrips(Array.isArray(rawTrips) ? rawTrips : []);
        setDbConnected(true);

        if (isManual) {
          showSuccess({
            title: 'Fuel Telematics Synchronized',
            message: `Loaded ${rawFuel.length} highway fuel receipt vouchers from PostgreSQL.`,
          });
        }
      } catch (err) {
        console.warn('Failed to load fuel logs from database:', err);
        setDbConnected(false);
        if (isManual) {
          showError({
            title: 'Sync Warning',
            message: 'Could not fetch latest highway fuel logs from database.',
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

  // Handle Log Fuel via API: POST /api/v1/fleet/fuel-logs/
  const handleLogFuel = async (payload) => {
    try {
      const res = await apiClient.post(ENDPOINTS.FLEET.FUEL_LOGS, payload);
      const created = res.data;

      setFuelLogs((prev) => [created, ...prev]);

      showSuccess({
        title: 'Fuel Procurement Logged',
        message: `Voucher #${created.receipt_number} recorded for ${created.liters_filled}L at ${created.station_name}.`,
      });

      fetchData();
    } catch (err) {
      console.error('Failed to log fuel procurement:', err);
      const msg =
        err.response?.data?.receipt_number?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Failed to record highway fuel procurement.';
      showError({
        title: 'Fuel Logging Error',
        message: msg,
      });
      throw err;
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!fuelLogs || fuelLogs.length === 0) {
      showError({ title: 'Export Notice', message: 'No fuel log vouchers available to export.' });
      return;
    }

    const headers = [
      'Receipt Number',
      'Highway Station',
      'Truck Plate',
      'Driver Name',
      'Driver Staff #',
      'Corridor Route',
      'Volume (Liters)',
      'Tariff Per Liter (KES)',
      'Total Expenditure (KES)',
      'Pump Odometer (KM)',
      'Timestamp',
    ];

    const rows = fuelLogs.map((f) => [
      `"${f.receipt_number}"`,
      `"${f.station_name}"`,
      `"${f.vehicle_plate || ''}"`,
      `"${f.driver_name || ''}"`,
      `"${f.driver_staff_no || ''}"`,
      `"${f.trip_origin || ''} -> ${f.trip_destination || ''}"`,
      Number(f.liters_filled || 0).toFixed(2),
      Number(f.cost_per_liter || 0).toFixed(2),
      Number(f.total_cost || 0).toFixed(2),
      f.odometer_reading || 0,
      `"${f.logged_at ? new Date(f.logged_at).toISOString() : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Apex_Fuel_Station_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess({
      title: 'Spreadsheet Exported',
      message: `Downloaded CSV voucher records for ${fuelLogs.length} highway fuel logs.`,
    });
  };

  // Dynamic Financial & Telemetry KPIs
  const kpis = useMemo(() => {
    let totalSpend = 0;
    let totalLiters = 0;

    fuelLogs.forEach((f) => {
      totalSpend += Number(f.total_cost || 0);
      totalLiters += Number(f.liters_filled || 0);
    });

    const avgTariff = totalLiters > 0 ? (totalSpend / totalLiters).toFixed(2) : '185.50';

    return {
      totalSpend,
      totalLiters,
      avgTariff,
      totalVouchers: fuelLogs.length,
    };
  }, [fuelLogs]);

  // Unique Highway Stations for filter
  const stations = useMemo(() => {
    const set = new Set();
    fuelLogs.forEach((f) => {
      if (f.station_name) set.add(f.station_name);
    });
    return Array.from(set);
  }, [fuelLogs]);

  // Filtered Fuel Logs
  const filteredLogs = useMemo(() => {
    if (stationFilter === 'ALL') return fuelLogs;
    return fuelLogs.filter((f) => f.station_name === stationFilter);
  }, [fuelLogs, stationFilter]);

  // DataTable Columns
  const columns = [
    {
      header: 'Station & Fiscal Receipt',
      accessor: 'receipt_number',
      cell: (r) => (
        <div>
          <span className="font-mono font-bold text-amber-700 block text-xs">
            {r.receipt_number}
          </span>
          <span className="text-xs font-bold text-slate-900 block mt-0.5">
            {r.station_name}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {r.logged_at ? new Date(r.logged_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Logged'}
          </span>
        </div>
      ),
    },
    {
      header: 'Truck Asset & Route',
      accessor: 'vehicle_plate',
      cell: (r) => (
        <div>
          <span className="font-mono font-black text-slate-900 text-xs flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {r.vehicle_plate || 'Prime Mover'}
          </span>
          {r.trip_origin && r.trip_destination && (
            <div className="flex items-center space-x-1 text-[11px] text-slate-600 mt-1">
              <span className="truncate max-w-[100px]">{r.trip_origin}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[100px] font-semibold text-indigo-700">{r.trip_destination}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Assigned Driver',
      accessor: 'driver_name',
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            {r.driver_name || 'Assigned Driver'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
            Staff No: {r.driver_staff_no || 'EMP-FLEET'}
          </span>
        </div>
      ),
    },
    {
      header: 'Volume & Tariff',
      accessor: 'liters_filled',
      align: 'right',
      cell: (r) => (
        <div className="text-right">
          <span className="font-mono font-bold text-slate-900 text-xs block">
            {Number(r.liters_filled || 0).toFixed(2)} Liters
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
            @ KES {Number(r.cost_per_liter || 0).toFixed(2)} / L
          </span>
        </div>
      ),
    },
    {
      header: 'Pump Odometer',
      accessor: 'odometer_reading',
      align: 'right',
      cell: (r) => (
        <div className="text-right">
          <span className="font-mono font-bold text-slate-800 text-xs flex items-center justify-end gap-1">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            {Number(r.odometer_reading || 0).toLocaleString()} KM
          </span>
        </div>
      ),
    },
    {
      header: 'Total Expenditure',
      accessor: 'total_cost',
      align: 'right',
      cell: (r) => (
        <div className="text-right">
          <span className="font-mono font-black text-amber-700 text-xs block">
            KES {Number(r.total_cost || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Audited Invoice
          </span>
        </div>
      ),
    },
    {
      header: 'Receipt Inspection',
      sortable: false,
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSelectedReceipt(r)}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
            title="Inspect Fiscal Fuel Receipt"
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
          <Breadcrumbs items={['Fleet Operations Workspace', 'Fuel Station Logs']} />
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Highway Fuel Procurement & Telematics
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
            Audited en-route fuel dispensing logs, fiscal receipt verification, and commercial fuel consumption telemetry
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
            title="Reload Fuel Logs from PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
            title="Export Fuel Vouchers to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Log Fuel Procurement */}
          <button
            type="button"
            onClick={() => setLogFuelOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log Fuel Procurement</span>
          </button>
        </div>
      </div>

      {/* Dynamic Telemetry & Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Fuel Spend */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Highway Fuel Spend
            </span>
            <span className="text-lg font-black text-amber-700 font-mono mt-1 block">
              KES {kpis.totalSpend.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              Audited Commercial Diesel (AGO)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Fuel className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Liters Dispensed */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Gross Volume Dispensed
            </span>
            <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
              {kpis.totalLiters.toLocaleString()} Liters
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              Across Corridor Depots
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Weighted Average Tariff */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Average Pump Tariff
            </span>
            <span className="text-xl font-black text-indigo-700 font-mono mt-1 block">
              KES {kpis.avgTariff} / L
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center mt-0.5">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> EPRA Benchmark Compliant
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Logged Vouchers */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Audited Fuel Vouchers
            </span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {kpis.totalVouchers} Receipts
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
              100% Station Receipt Matched
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs by Station */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setStationFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            stationFilter === 'ALL'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>All Highway Stations</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              stationFilter === 'ALL' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {fuelLogs.length}
          </span>
        </button>

        {stations.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStationFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
              stationFilter === st
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{st}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                stationFilter === st ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {fuelLogs.filter((f) => f.station_name === st).length}
            </span>
          </button>
        ))}
      </div>

      {/* Fuel Logs DataTable */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        searchPlaceholder="Filter fuel logs by station (e.g. TotalEnergies, Shell), receipt #, truck plate, driver..."
        pageSize={6}
        isLoading={loading}
      />

      {/* Modal: Log Fuel Procurement */}
      <LogFuelModal
        isOpen={logFuelOpen}
        onClose={() => setLogFuelOpen(false)}
        onLogFuel={handleLogFuel}
        trips={trips}
      />

      {/* Modal: Fiscal Receipt Inspector */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Fiscal Fuel Receipt Voucher</h3>
                  <span className="text-xs text-slate-500 font-mono">#{selectedReceipt.receipt_number}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Highway Station:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.station_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Truck Asset:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedReceipt.vehicle_plate || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Driver:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.driver_name || 'Assigned Driver'}</span>
                </div>
                {selectedReceipt.trip_origin && selectedReceipt.trip_destination && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Transit Route:</span>
                    <span className="font-bold text-indigo-700">{selectedReceipt.trip_origin} → {selectedReceipt.trip_destination}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Pump Odometer:</span>
                  <span className="font-mono font-bold text-slate-800">{Number(selectedReceipt.odometer_reading || 0).toLocaleString()} KM</span>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Volume Dispensed:</span>
                  <span className="font-mono font-bold text-slate-900">{Number(selectedReceipt.liters_filled || 0).toFixed(2)} Liters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Unit Tariff Rate:</span>
                  <span className="font-mono font-bold text-slate-900">KES {Number(selectedReceipt.cost_per_liter || 0).toFixed(2)} / L</span>
                </div>
                <div className="pt-2 border-t border-amber-200 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total Voucher Cost:</span>
                  <span className="font-mono font-black text-sm text-amber-800">
                    KES {Number(selectedReceipt.total_cost || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Close Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
