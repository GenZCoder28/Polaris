import React, { useState } from 'react';
import { 
  Waves, 
  Wind, 
  Compass, 
  Package, 
  ShieldAlert, 
  CheckCircle2, 
  Anchor, 
  AlertTriangle, 
  Navigation,
  ThermometerSnowflake,
  Ship
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { WeatherObservation, WeatherForecast, WeatherEvent } from '../../types';

interface MarineWeatherPanelProps {
  vessels: Array<{
    vessel_id: string;
    name: string;
    latitude: number;
    longitude: number;
    current: WeatherObservation;
    forecast: WeatherForecast;
    severity: string;
    active_events: WeatherEvent[];
    associated_containers: string[];
  }>;
}

export const MarineWeatherPanel: React.FC<MarineWeatherPanelProps> = ({ vessels }) => {
  const [selectedVesselId, setSelectedVesselId] = useState<string>(
    vessels[0]?.vessel_id || 'vessel_golovnin'
  );

  const currentVessel = vessels.find((v) => v.vessel_id === selectedVesselId) || vessels[0];
  if (!currentVessel) return null;

  const obs = currentVessel.current;
  const forecast = currentVessel.forecast;
  const activeEvents = currentVessel.active_events;

  // Chart data from marine hourly forecast
  const chartData = (forecast?.hourly || []).slice(0, 24).map((h) => {
    const timeStr = new Date(h.forecast_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      time: timeStr,
      waveHeight: h.wave_height ?? 4.5,
      windSpeed: h.wind_speed,
      windGust: h.wind_gust,
      period: h.wave_period ?? 8,
    };
  });

  // Calculate Freezing Spray / Structural Icing Risk
  const isFreezingSprayRisk = (obs.temperature < -1.5) && (obs.wind_speed > 40);

  return (
    <div className="space-y-6">
      {/* Vessel Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {vessels.map((v) => {
          const isSelected = v.vessel_id === selectedVesselId;
          const isCrit = v.severity === 'CRITICAL';
          const isWarn = v.severity === 'WARNING';

          return (
            <button
              key={v.vessel_id}
              onClick={() => setSelectedVesselId(v.vessel_id)}
              className={`px-4 py-2.5 rounded-xl border text-left transition flex items-center gap-3 shrink-0 ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${
                isCrit ? 'bg-rose-500 animate-ping' : isWarn ? 'bg-amber-400' : isSelected ? 'bg-white' : 'bg-emerald-500'
              }`} />
              <div>
                <div className="text-xs font-bold leading-tight">{v.name}</div>
                <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  Wave {obs.wave_height ?? 4.5}m • Wind {obs.wind_speed} km/h • {v.associated_containers?.length || 0} Containers
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Marine Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vessel Marine Telemetry Card */}
        <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-blue-950">{currentVessel.name}</h3>
                {currentVessel.severity === 'CRITICAL' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                    CRITICAL SWELL
                  </span>
                ) : currentVessel.severity === 'WARNING' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    SWELL WATCH
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    SEAS NORMAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Current Position: Lat {currentVessel.latitude}° | Lng {currentVessel.longitude}°
              </p>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Ship className="w-5 h-5" />
            </div>
          </div>

          {/* Primary Wave & Sea State Block */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-900 font-semibold">Significant Wave Height (Hs)</span>
              <div className="text-3xl font-black text-indigo-950 flex items-baseline gap-1">
                <span>{obs.wave_height ?? 4.8}</span>
                <span className="text-base font-bold text-indigo-700">m</span>
              </div>
              <div className="text-xs text-indigo-800 mt-0.5 font-medium">
                Swell Period: <strong>{obs.wave_period ?? 8.5} s</strong> | Dir: <strong>{obs.wave_direction ?? 240}°</strong>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex p-2.5 rounded-xl bg-indigo-200/80 text-indigo-900 mb-1">
                <Waves className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-indigo-950">{obs.sea_state || 'Rough (4.0-6.0m)'}</div>
              <div className="text-[10px] text-indigo-800 font-mono">Douglas Sea Scale Code 6</div>
            </div>
          </div>

          {/* Detailed Marine Gauges */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Wind */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-blue-600" />
                  Oceanic Wind
                </span>
                <span className="font-mono text-[10px]">{obs.wind_direction}°</span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {obs.wind_speed} <span className="text-xs font-normal text-slate-500">km/h</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                Gusts: <strong className="text-rose-700">{obs.wind_gust} km/h</strong>
              </div>
            </div>

            {/* Freezing Spray Risk */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-600" />
                  Icing / Spray Risk
                </span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {isFreezingSprayRisk ? (
                  <span className="text-rose-700 font-bold">MODERATE / HIGH</span>
                ) : (
                  <span className="text-emerald-700 font-bold">LOW</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Air: {obs.temperature}°C • Wind: {obs.wind_speed} km/h
              </div>
            </div>

            {/* Barometer */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold">Atmospheric Pressure</span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {obs.pressure} <span className="text-xs font-normal text-slate-500">hPa</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {obs.pressure < 985 ? 'Deep Southern Cyclone' : 'Moderate Low'}
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold">Nav Visibility</span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {(obs.visibility / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-500">km</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Radar & AIS Operational
              </div>
            </div>
          </div>

          {/* Associated Cargo & Stowage Impact */}
          <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>Associated Cargo Containers On Deck</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600">
                {currentVessel.associated_containers?.length || 0} units
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              High wave action (&gt;4.5m) requires mandatory inspection of container twist-locks and lashing wires on weather deck hold 1 & 2.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(currentVessel.associated_containers || []).map((cnt) => (
                <span
                  key={cnt}
                  className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono text-[11px] font-semibold text-slate-700 shadow-2xs"
                >
                  {cnt}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: 24-Hour Ocean Swell Chart & Active Directives */}
        <div className="lg:col-span-2 space-y-6">
          {/* Swell & Wave Height Forecast Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  24-Hour Southern Ocean Wave & Wind Swell Forecast
                </h4>
                <p className="text-xs text-slate-500">
                  Open-Meteo High-Resolution Marine Model for {currentVessel.name}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Wave Height (m)
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block ml-2" /> Wind (km/h)
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} unit="m" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} unit="k" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="waveHeight"
                    name="Significant Wave (m)"
                    stroke="#4f46e5"
                    fill="#e0e7ff"
                    strokeWidth={2.5}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="windGust"
                    name="Wind Gusts (km/h)"
                    stroke="#0284c7"
                    fill="#e0f2fe"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Maritime Directives & Navigation Safety Protocols */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                Active Maritime Heavy Weather Directives
              </h5>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                {activeEvents.length} Active Marine Events
              </span>
            </div>

            {activeEvents.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Swell conditions within safe transit tolerances. Standard Southern Ocean bridge watch active.
                </span>
              </div>
            ) : (
              activeEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                    ev.severity === 'CRITICAL'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Anchor className="w-3.5 h-3.5" />
                      {ev.event_type.replace(/_/g, ' ')} ({ev.severity})
                    </span>
                    <span className="text-[10px] font-mono">{ev.status}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{ev.description}</p>
                  <div className="pt-2 border-t border-rose-200/60 font-mono text-[11px] font-semibold bg-white/60 p-2 rounded">
                    Directive: {ev.operational_instruction}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
