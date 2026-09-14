import React from 'react';
import { 
  CloudSun, 
  Wind, 
  Waves, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  Clock,
  Radio
} from 'lucide-react';
import { WeatherOverviewResponse } from '../../types';

interface WeatherOverviewCardsProps {
  overview: WeatherOverviewResponse | null;
  loading: boolean;
  syncing: boolean;
  onSync: () => void;
  onRunCheck: () => void;
}

export const WeatherOverviewCards: React.FC<WeatherOverviewCardsProps> = ({
  overview,
  loading,
  syncing,
  onSync,
  onRunCheck,
}) => {
  const stationsCount = overview?.stations?.length || 0;
  const vesselsCount = overview?.vessels?.length || 0;
  const activeEvents = overview?.active_events || [];
  const activeAlerts = overview?.active_alerts || [];

  const criticalEvents = activeEvents.filter((e) => e.severity === 'CRITICAL');
  const warningEvents = activeEvents.filter((e) => e.severity === 'WARNING');
  const unacknowledgedAlerts = activeAlerts.filter((a) => a.status !== 'ACKNOWLEDGED');

  const systemStatus = overview?.system_status;
  const lastSyncStr = systemStatus?.last_sync 
    ? new Date(systemStatus.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div className="space-y-4">
      {/* Top Status & Live Action Bar */}
      <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-blue-950">
                Polar Weather & Environmental Monitoring Center
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                OPEN-METEO LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Deterministic High-Latitude Meteorological Ingestion • Marine Swell Radar • Automated SOP Alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Synced: <strong>{lastSyncStr}</strong></span>
            {systemStatus?.is_stale && (
              <span className="text-amber-600 font-semibold ml-1">(Stale)</span>
            )}
          </div>

          <button
            onClick={onSync}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition disabled:opacity-50"
            title="Fetch live observations and forecasts from Open-Meteo API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Live Weather'}</span>
          </button>

          <button
            onClick={onRunCheck}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition disabled:opacity-50"
            title="Execute deterministic Polar Safety Rule Engine against current telemetry"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Evaluate Safety Rules</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Stations */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stations Monitored</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <CloudSun className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stationsCount}</span>
            <span className="text-xs text-slate-500">Active Polar Bases</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <span className="text-blue-700">Bharati</span> • <span>Maitri</span> • <span>Himadri (Arctic)</span>
          </div>
        </div>

        {/* Card 2: Marine Vessels */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vessels in Transit</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Waves className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{vesselsCount}</span>
            <span className="text-xs text-slate-500">Roaring Forties</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <span className="text-indigo-700 font-semibold">MV Vasiliy Golovnin</span> + 1 Carrier
          </div>
        </div>

        {/* Card 3: Severe Weather Events */}
        <div className={`border rounded-xl p-4 shadow-2xs transition ${
          criticalEvents.length > 0 
            ? 'bg-rose-50/70 border-rose-200' 
            : warningEvents.length > 0 
            ? 'bg-amber-50/70 border-amber-200' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Weather Events</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              criticalEvents.length > 0 
                ? 'bg-rose-100 text-rose-700' 
                : warningEvents.length > 0 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-emerald-50 text-emerald-700'
            }`}>
              {criticalEvents.length > 0 ? (
                <ShieldAlert className="w-4 h-4" />
              ) : warningEvents.length > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${
              criticalEvents.length > 0 
                ? 'text-rose-900' 
                : warningEvents.length > 0 
                ? 'text-amber-900' 
                : 'text-slate-900'
            }`}>
              {activeEvents.length}
            </span>
            <span className="text-xs text-slate-500">
              {criticalEvents.length} Critical • {warningEvents.length} Warning
            </span>
          </div>
          <div className="mt-2 text-[11px] font-semibold">
            {criticalEvents.length > 0 ? (
              <span className="text-rose-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                Station / Vessel Lockdown SOP active
              </span>
            ) : warningEvents.length > 0 ? (
              <span className="text-amber-700">Tethered movement directive active</span>
            ) : (
              <span className="text-emerald-700">All environments within normal thresholds</span>
            )}
          </div>
        </div>

        {/* Card 4: Dispatched Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispatched Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{activeAlerts.length}</span>
            <span className="text-xs text-slate-500">
              {unacknowledgedAlerts.length} Pending Ack
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 font-medium">
            Automated Iridium SMS & Terminal Push
          </div>
        </div>
      </div>
    </div>
  );
};
