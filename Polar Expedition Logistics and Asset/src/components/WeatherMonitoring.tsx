import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Waves, 
  ShieldAlert, 
  Sliders, 
  ClipboardList, 
  RefreshCw,
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  WeatherOverviewResponse, 
  WeatherRule, 
  WeatherEvent, 
  WeatherAlert, 
  Personnel, 
  UserRole 
} from '../types';
import { 
  fetchWeatherOverviewApi, 
  syncWeatherNowApi, 
  fetchWeatherRulesApi, 
  updateWeatherRuleApi, 
  createWeatherRuleApi, 
  deleteWeatherRuleApi, 
  updateStationRadiusApi, 
  updateWeatherEventStatusApi, 
  acknowledgeWeatherAlertApi, 
  escalateWeatherAlertApi,
  runWeatherRuleCheckApi
} from '../lib/weatherApi';
import { WeatherOverviewCards } from './weather/WeatherOverviewCards';
import { StationWeatherPanel } from './weather/StationWeatherPanel';
import { MarineWeatherPanel } from './weather/MarineWeatherPanel';
import { WeatherRulesPanel } from './weather/WeatherRulesPanel';
import { WeatherEventsAlertsPanel } from './weather/WeatherEventsAlertsPanel';
import { WeatherAuditPanel } from './weather/WeatherAuditPanel';

interface WeatherMonitoringProps {
  personnelList: Personnel[];
  currentRole: UserRole;
}

export const WeatherMonitoring: React.FC<WeatherMonitoringProps> = ({
  personnelList,
  currentRole,
}) => {
  const [overview, setOverview] = useState<WeatherOverviewResponse | null>(null);
  const [rules, setRules] = useState<WeatherRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'stations' | 'marine' | 'rules' | 'events' | 'audit'>('stations');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [ov, rls] = await Promise.all([
        fetchWeatherOverviewApi(),
        fetchWeatherRulesApi(),
      ]);
      setOverview(ov);
      setRules(rls);
    } catch (err: any) {
      console.error('Failed to load weather data:', err);
      setStatusMessage(`Notice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // Periodic reload every 30s for real-time telemetry updates
    const interval = setInterval(() => {
      fetchWeatherOverviewApi().then(setOverview).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncWeather = async () => {
    try {
      setSyncing(true);
      setStatusMessage('Querying Open-Meteo Polar Land & Oceanic Swell API...');
      const res = await syncWeatherNowApi();
      setOverview(res.overview);
      setStatusMessage('Weather data successfully refreshed from Open-Meteo.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleRunCheck = async () => {
    try {
      setSyncing(true);
      setStatusMessage('Running deterministic Polar Safety Rule Engine...');
      await runWeatherRuleCheckApi();
      const updatedOverview = await fetchWeatherOverviewApi();
      setOverview(updatedOverview);
      setStatusMessage('Risk rules evaluated across all stations and vessels.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Rule evaluation failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const updated = await updateWeatherRuleApi(ruleId, { enabled });
      setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
    } catch (err: any) {
      alert(`Failed to update rule: ${err.message}`);
    }
  };

  const handleCreateRule = async (newRule: Omit<WeatherRule, 'id'>) => {
    try {
      const created = await createWeatherRuleApi(newRule);
      setRules((prev) => [...prev, created]);
    } catch (err: any) {
      alert(`Failed to create rule: ${err.message}`);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to remove this safety rule?')) return;
    try {
      await deleteWeatherRuleApi(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err: any) {
      alert(`Failed to delete rule: ${err.message}`);
    }
  };

  const handleUpdateRadius = async (stationId: string, radiusKm: number) => {
    try {
      await updateStationRadiusApi(stationId, radiusKm);
      const updatedOverview = await fetchWeatherOverviewApi();
      setOverview(updatedOverview);
      setStatusMessage(`Operational monitoring radius for ${stationId} updated to ${radiusKm} km.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to update station radius: ${err.message}`);
    }
  };

  const handleUpdateEventStatus = async (eventId: string, status: WeatherEvent['status'], resolvedBy?: string) => {
    try {
      await updateWeatherEventStatusApi(eventId, status, resolvedBy);
      const updatedOverview = await fetchWeatherOverviewApi();
      setOverview(updatedOverview);
    } catch (err: any) {
      alert(`Failed to update event: ${err.message}`);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string, acknowledgedBy: string) => {
    try {
      await acknowledgeWeatherAlertApi(alertId, acknowledgedBy);
      const updatedOverview = await fetchWeatherOverviewApi();
      setOverview(updatedOverview);
    } catch (err: any) {
      alert(`Failed to acknowledge alert: ${err.message}`);
    }
  };

  const handleEscalateAlert = async (alertId: string) => {
    try {
      await escalateWeatherAlertApi(alertId);
      const updatedOverview = await fetchWeatherOverviewApi();
      setOverview(updatedOverview);
    } catch (err: any) {
      alert(`Failed to escalate alert: ${err.message}`);
    }
  };

  const activeEventsCount = overview?.active_events?.length || 0;
  const activeAlertsCount = overview?.active_alerts?.filter((a) => a.status !== 'ACKNOWLEDGED').length || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Message */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-blue-500 hover:text-blue-800 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview KPI Cards */}
      <WeatherOverviewCards
        overview={overview}
        loading={loading}
        syncing={syncing}
        onSync={handleSyncWeather}
        onRunCheck={handleRunCheck}
      />

      {/* Main Module Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'stations'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <CloudSun className="w-4 h-4" />
          <span>Stations & Bases ({overview?.stations?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('marine')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'marine'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Waves className="w-4 h-4" />
          <span>Vessels & Marine Swell ({overview?.vessels?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'rules'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Safety Rules Engine ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'events'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Hazards & Alerts</span>
          {(activeEventsCount > 0 || activeAlertsCount > 0) && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
              {activeEventsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Audit Trail & Archive</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'stations' && overview && (
        <StationWeatherPanel
          stations={overview.stations}
          personnelList={personnelList}
          onUpdateRadius={handleUpdateRadius}
        />
      )}

      {activeTab === 'marine' && overview && (
        <MarineWeatherPanel vessels={overview.vessels} />
      )}

      {activeTab === 'rules' && (
        <WeatherRulesPanel
          rules={rules}
          onToggleRule={handleToggleRule}
          onCreateRule={handleCreateRule}
          onDeleteRule={handleDeleteRule}
          onRunCheck={handleRunCheck}
        />
      )}

      {activeTab === 'events' && overview && (
        <WeatherEventsAlertsPanel
          events={overview.active_events}
          alerts={overview.active_alerts}
          onUpdateEventStatus={handleUpdateEventStatus}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onEscalateAlert={handleEscalateAlert}
        />
      )}

      {activeTab === 'audit' && (
        <WeatherAuditPanel />
      )}
    </div>
  );
};
