import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CloudLightning, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Search, 
  Activity, 
  Wind, 
  ThermometerSnowflake,
  Award
} from 'lucide-react';
import { EmergencyReportItem, ResponseTeamScorecard, WeatherReportItem } from '../../types.ts';

interface WeatherEmergencyAnalyticsViewProps {
  emergencies: EmergencyReportItem[];
  responseTeams: ResponseTeamScorecard[];
  weather: WeatherReportItem[];
  meanAckMinutes: number;
  meanResponseMinutes: number;
  meanResolutionMinutes: number;
  onExport: (type: string) => void;
  loading: boolean;
}

export const WeatherEmergencyAnalyticsView: React.FC<WeatherEmergencyAnalyticsViewProps> = ({
  emergencies,
  responseTeams,
  weather,
  meanAckMinutes,
  meanResponseMinutes,
  meanResolutionMinutes,
  onExport,
  loading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'emergencies' | 'scorecards' | 'weather'>('emergencies');
  const [search, setSearch] = useState('');

  const filteredEmergencies = emergencies.filter((e) => {
    const q = (search || '').toLowerCase();
    const title = (e.title || '').toLowerCase();
    const station = (e.station || '').toLowerCase();
    const type = (e.type || '').toLowerCase();
    return !q || title.includes(q) || station.includes(q) || type.includes(q);
  });

  const filteredWeather = weather.filter((w) => {
    const q = (search || '').toLowerCase();
    const station = (w.station || '').toLowerCase();
    const cond = (w.condition || '').toLowerCase();
    return !q || station.includes(q) || cond.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Response Timings High-Impact Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mean Acknowledgement Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {meanAckMinutes} <span className="text-sm font-normal text-slate-500">minutes</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            Target benchmark: &lt; 5 minutes
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mean Team Dispatch Time</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {meanResponseMinutes} <span className="text-sm font-normal text-slate-500">minutes</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            Target benchmark: &lt; 20 minutes
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mean Incident Resolution</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {meanResolutionMinutes} <span className="text-sm font-normal text-slate-500">minutes</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
            Standard polar triage resolution window
          </span>
        </div>
      </div>

      {/* Subtab Switcher & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('emergencies')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeSubTab === 'emergencies'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Emergency Incidents ({emergencies.length})
          </button>
          <button
            onClick={() => setActiveSubTab('scorecards')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeSubTab === 'scorecards'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Response Team Scorecards ({responseTeams.length})
          </button>
          <button
            onClick={() => setActiveSubTab('weather')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeSubTab === 'weather'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Severe Weather Advisories ({weather.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport(activeSubTab === 'weather' ? 'weather' : 'emergencies')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export View</span>
          </button>
        </div>
      </div>

      {/* VIEW: EMERGENCIES */}
      {activeSubTab === 'emergencies' && (
        <div className="space-y-3">
          {filteredEmergencies.map((em) => (
            <div
              key={em.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${em.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{em.title}</h4>
                    <span className="text-[11px] text-slate-500">
                      Station: <strong className="text-slate-800">{em.station}</strong> • Type: {em.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    em.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {em.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {em.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700">{em.description}</p>

              {/* Timings row */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Reported At</span>
                  <span className="font-mono text-slate-700 font-medium">
                    {new Date(em.reportedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Ack Latency</span>
                  <span className="font-mono font-bold text-slate-800">{em.acknowledgementTimeMinutes} mins</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Dispatch Response</span>
                  <span className="font-mono font-bold text-slate-800">{em.responseTimeMinutes} mins</span>
                </div>
              </div>

              {/* Directives */}
              {em.actionsTaken && em.actionsTaken.length > 0 && (
                <div className="text-[11px] text-slate-600 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 space-y-1">
                  <span className="font-bold text-blue-900 block">Directives & Response Actions:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                    {em.actionsTaken.map((act, idx) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VIEW: RESPONSE TEAM SCORECARDS */}
      {activeSubTab === 'scorecards' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {responseTeams.map((team) => (
            <div
              key={team.station}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-slate-900 text-sm">{team.teamName}</h4>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {team.readinessScore}% Ready
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-600">
                  <span>Assigned Station:</span>
                  <span className="font-bold text-slate-800">{team.station}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-600">
                  <span>Team Leader:</span>
                  <span className="font-semibold text-slate-800">{team.leaderName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-600">
                  <span>Duty Personnel:</span>
                  <span className="font-semibold text-slate-800">{team.assignedPersonnelCount} Specialists</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-600">
                  <span>Incidents Handled:</span>
                  <span className="font-bold text-slate-900 font-mono">{team.incidentsHandledCount}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-600">
                  <span>Avg Response Speed:</span>
                  <span className="font-bold text-blue-700 font-mono">{team.avgResponseSpeedMinutes} mins</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Unacknowledged Alerts:</span>
                  <span className={`font-bold font-mono ${team.unacknowledgedAlertsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {team.unacknowledgedAlertsCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: WEATHER */}
      {activeSubTab === 'weather' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWeather.map((w) => (
            <div
              key={w.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-sky-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{w.station}</h4>
                    <span className="text-[11px] text-slate-500">Condition: {w.condition}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  w.safetyAlertActive ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {w.safetyAlertActive ? 'HAZARD ALERT' : 'NOMINAL'}
                </span>
              </div>

              {/* Weather Telemetry Matrix */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Temperature</span>
                  <span className="font-bold font-mono text-slate-800">{w.temperatureCelsius}°C</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Wind Velocity</span>
                  <span className="font-bold font-mono text-slate-800">{w.windSpeedKnots} kt ({w.windDirection})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Visibility</span>
                  <span className="font-bold font-mono text-slate-800">{w.visibilityKm} km</span>
                </div>
              </div>

              {/* Operational Advisory */}
              {w.operationalDirective && (
                <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 space-y-0.5">
                  <span className="font-bold block text-[11px] uppercase tracking-wider">Operational Directive</span>
                  <p>{w.operationalDirective}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
