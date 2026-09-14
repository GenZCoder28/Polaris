import React from 'react';
import { 
  ShieldAlert, 
  Clock, 
  Activity, 
  Radio, 
  TrendingUp, 
  CheckCircle2, 
  Flame, 
  HeartPulse, 
  Layers 
} from 'lucide-react';
import { EmergencyStats } from '../../types.ts';

interface EmergencyAnalyticsViewProps {
  stats: EmergencyStats | null;
}

export const EmergencyAnalyticsView: React.FC<EmergencyAnalyticsViewProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading emergency analytics & response SLAs...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs">
      {/* KPI Stats Top Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-[10px] block uppercase font-bold">Active Incidents</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{stats.active_count}</span>
            {stats.critical_count > 0 && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                {stats.critical_count} Critical
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Live across all polar stations</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-[10px] block uppercase font-bold">Avg Acknowledge Time</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-700">
              {stats.avg_time_to_acknowledge_min}m
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              SLA &lt; 2m Target
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">From alarm to operator ack</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-[10px] block uppercase font-bold">Avg Time to Response</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-purple-700">
              {stats.avg_time_to_response_min}m
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              SLA &lt; 5m Target
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">From dispatch to boots on ground</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-[10px] block uppercase font-bold">Comms Delivery Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700">
              {stats.notification_delivery_rate}%
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              Iridium + SMS
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Multi-channel polar dispatch</span>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Incident Distribution by Station */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Incidents by Station & Maritime Asset</span>
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.by_station || {}).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 uppercase">{key}</span>
                  <span className="font-mono font-bold text-slate-900">{val} incident(s)</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.min(100, (Number(val) / (stats.active_count + 5)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Distribution by Type */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-rose-600" />
            <span>Incidents by Classification</span>
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.by_type || {}).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{key.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-bold text-slate-900">{val} incident(s)</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 rounded-full"
                    style={{ width: `${Math.min(100, (Number(val) / (stats.active_count + 5)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Escalation Policy SLA Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-blue-950">
        <h4 className="font-bold text-xs flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-700" />
          <span>Configured Polar Escalation & Automated Safety Directives:</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <strong className="block text-slate-900">Level 1: Local Response</strong>
            <span className="text-slate-600 block mt-0.5">
              Instant notification to on-duty Station Response Team (Medical, Fire, or SAR).
            </span>
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <strong className="block text-slate-900">Level 2: Station Commander (&gt;2 min)</strong>
            <span className="text-slate-600 block mt-0.5">
              Escalates if unacknowledged within 2 minutes. Radio siren alert to Commander.
            </span>
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <strong className="block text-slate-900">Level 3: NCPOR Central HQ (&gt;5 min)</strong>
            <span className="text-slate-600 block mt-0.5">
              Satellite Iridium uplink to Goa Central Operations Director for evacuation dispatch.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
