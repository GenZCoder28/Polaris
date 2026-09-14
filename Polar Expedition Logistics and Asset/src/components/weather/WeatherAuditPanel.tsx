import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Clock, 
  Database, 
  User, 
  Filter, 
  RefreshCw, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { WeatherAuditLog, WeatherObservation } from '../../types';
import { fetchWeatherAuditLogsApi, fetchWeatherHistoryApi } from '../../lib/weatherApi';

export const WeatherAuditPanel: React.FC = () => {
  const [logs, setLogs] = useState<WeatherAuditLog[]>([]);
  const [observations, setObservations] = useState<WeatherObservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'audit' | 'history'>('audit');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const [auditLogs, history] = await Promise.all([
        fetchWeatherAuditLogsApi().catch(() => []),
        fetchWeatherHistoryApi().catch(() => ({ observations: [], events: [], totalObservations: 0, totalEvents: 0 })),
      ]);
      setLogs(auditLogs);
      setObservations(history.observations || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterAction === 'ALL') return true;
    return l.action.includes(filterAction);
  });

  const exportAuditLogsCsv = () => {
    const headers = ['ID', 'Timestamp', 'Action', 'User', 'Details'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.action}"`,
      `"${l.user_email || 'System'}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `polar_weather_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs & Actions Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Audit Trail ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Telemetry Archive ({observations.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'audit' && (
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold"
            >
              <option value="ALL">All Actions</option>
              <option value="WEATHER_EVENT">Weather Events</option>
              <option value="ALERT">Alerts & Ack</option>
              <option value="RULE">Safety Rules</option>
              <option value="SYNC">API Syncs</option>
            </select>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={exportAuditLogsCsv}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No audit logs recorded yet.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100">
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {log.user_email || 'system'}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed max-w-3xl">
                      {log.details}
                    </p>
                  </div>

                  <div className="shrink-0 text-right font-mono text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: HISTORICAL OBSERVATIONS */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="p-3">Target</th>
                <th className="p-3">Observed At (UTC)</th>
                <th className="p-3">Temp / Chill</th>
                <th className="p-3">Wind / Gust</th>
                <th className="p-3">Visibility</th>
                <th className="p-3">Wave Height</th>
                <th className="p-3">Pressure</th>
                <th className="p-3">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {observations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    No historical telemetry records yet.
                  </td>
                </tr>
              ) : (
                observations.slice(0, 50).map((obs) => (
                  <tr key={obs.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-900">
                      {obs.station_id ? obs.station_id.toUpperCase() : obs.vessel_id}
                    </td>
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(obs.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-bold text-blue-900">
                      {obs.temperature}°C <span className="text-slate-400 font-normal">({obs.apparent_temperature ?? obs.temperature}°C)</span>
                    </td>
                    <td className="p-3 font-mono">
                      {obs.wind_speed} km/h <span className="text-slate-400 font-normal">({obs.wind_gust}g)</span>
                    </td>
                    <td className="p-3 font-mono">
                      {obs.visibility}m
                    </td>
                    <td className="p-3 font-mono">
                      {obs.wave_height ? `${obs.wave_height}m` : '—'}
                    </td>
                    <td className="p-3 font-mono">
                      {obs.pressure} hPa
                    </td>
                    <td className="p-3 text-slate-700">
                      {obs.weather_condition}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
