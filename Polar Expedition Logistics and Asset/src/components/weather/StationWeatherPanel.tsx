import React, { useState } from 'react';
import { 
  Thermometer, 
  Wind, 
  Eye, 
  Gauge, 
  CloudSnow, 
  Compass, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  Users, 
  Navigation,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { StationWeatherConfig, WeatherObservation, WeatherForecast, WeatherEvent, Personnel } from '../../types';

interface StationWeatherPanelProps {
  stations: Array<{
    station_id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius_km: number;
    current: WeatherObservation;
    forecast: WeatherForecast;
    severity: string;
    active_events: WeatherEvent[];
  }>;
  personnelList: Personnel[];
  onUpdateRadius: (stationId: string, radiusKm: number) => Promise<void>;
}

export const StationWeatherPanel: React.FC<StationWeatherPanelProps> = ({
  stations,
  personnelList,
  onUpdateRadius,
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(
    stations[0]?.station_id || 'bharati'
  );
  const [radiusInput, setRadiusInput] = useState<number>(
    stations.find((s) => s.station_id === selectedStationId)?.radius_km || 25
  );
  const [savingRadius, setSavingRadius] = useState<boolean>(false);

  const currentStation = stations.find((s) => s.station_id === selectedStationId) || stations[0];
  if (!currentStation) return null;

  const obs = currentStation.current;
  const forecast = currentStation.forecast;
  const activeEvents = currentStation.active_events;

  // Prepare chart data from hourly forecast
  const chartData = (forecast?.hourly || []).slice(0, 24).map((h) => {
    const timeStr = new Date(h.forecast_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      time: timeStr,
      temp: h.temperature,
      windChill: h.apparent_temperature ?? h.temperature - 10,
      windSpeed: h.wind_speed,
      windGust: h.wind_gust,
      visibility: Math.round(h.visibility / 100) / 10, // in km
    };
  });

  const handleStationChange = (id: string) => {
    setSelectedStationId(id);
    const target = stations.find((s) => s.station_id === id);
    if (target) {
      setRadiusInput(target.radius_km);
    }
  };

  const handleSaveRadius = async () => {
    try {
      setSavingRadius(true);
      await onUpdateRadius(selectedStationId, radiusInput);
    } finally {
      setSavingRadius(false);
    }
  };

  const stationPersonnel = personnelList.filter(
    (p) => p.assignedStationId === selectedStationId
  );

  return (
    <div className="space-y-6">
      {/* Station Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {stations.map((s) => {
          const isSelected = s.station_id === selectedStationId;
          const isCrit = s.severity === 'CRITICAL';
          const isWarn = s.severity === 'WARNING';

          return (
            <button
              key={s.station_id}
              onClick={() => handleStationChange(s.station_id)}
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
                <div className="text-xs font-bold leading-tight">{s.name}</div>
                <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {s.current.temperature}°C • Wind {s.current.wind_speed} km/h • R: {s.radius_km}km
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Station Telemetry & Conditions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Station Card */}
        <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-blue-950">{currentStation.name}</h3>
                {currentStation.severity === 'CRITICAL' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                    CRITICAL
                  </span>
                ) : currentStation.severity === 'WARNING' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    WARNING
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    NORMAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Lat: {currentStation.latitude}° | Lng: {currentStation.longitude}°
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">Telemetry Source</span>
              <div className="text-[11px] font-semibold text-blue-700 truncate max-w-[140px]">
                {obs.source.split(' ')[0]}
              </div>
            </div>
          </div>

          {/* Primary Condition Block */}
          <div className="bg-slate-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Ambient Surface Temp</span>
              <div className="text-3xl font-black text-blue-950 flex items-baseline gap-1">
                <span>{obs.temperature}</span>
                <span className="text-base font-bold text-slate-500">°C</span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5 font-medium">
                Wind Chill: <strong className="text-blue-700">{obs.apparent_temperature ?? obs.temperature - 12}°C</strong>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex p-2.5 rounded-xl bg-blue-100/70 text-blue-700 mb-1">
                <CloudSnow className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-800">{obs.weather_condition}</div>
              <div className="text-[10px] text-slate-500 font-mono">WMO Code: {obs.weather_code ?? '73'}</div>
            </div>
          </div>

          {/* Detailed Metric Gauges */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Wind */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-blue-600" />
                  Wind Telemetry
                </span>
                <span className="font-mono text-[10px]">{obs.wind_direction}°</span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {obs.wind_speed} <span className="text-xs font-normal text-slate-500">km/h</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                Gusts: <strong className="text-amber-700">{obs.wind_gust} km/h</strong>
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  Visibility
                </span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {obs.visibility >= 1000 ? `${(obs.visibility / 1000).toFixed(1)} km` : `${obs.visibility} m`}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                {obs.visibility < 500 ? (
                  <span className="text-rose-600 font-semibold">Whiteout Danger</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">Clear Polar Sight</span>
                )}
              </div>
            </div>

            {/* Surface Pressure */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-600" />
                  Barometer
                </span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {obs.pressure} <span className="text-xs font-normal text-slate-500">hPa</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {obs.pressure < 980 ? 'Deep Polar Low' : 'Stable Antarctic High'}
              </div>
            </div>

            {/* Snow & Precip */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <CloudSnow className="w-3.5 h-3.5 text-blue-600" />
                  Snowfall
                </span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {obs.snow} <span className="text-xs font-normal text-slate-500">cm/h</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Drift Index: {obs.wind_speed > 40 ? 'High Drift' : 'Low Drift'}
              </div>
            </div>
          </div>

          {/* Configurable Operational Monitoring Radius */}
          <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Station Monitoring Radius</span>
              </div>
              <span className="text-xs font-mono font-extrabold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded">
                {radiusInput} km
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Defines the geographic safety boundary around {currentStation.name} for expedition personnel alerts & outdoor traverse permissions.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={radiusInput}
                onChange={(e) => setRadiusInput(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <button
                onClick={handleSaveRadius}
                disabled={savingRadius || radiusInput === currentStation.radius_km}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-40 shrink-0"
              >
                {savingRadius ? 'Saving...' : 'Set Radius'}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span>Presets:</span>
              {[15, 25, 50, 75].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setRadiusInput(preset)}
                  className={`px-1.5 py-0.5 rounded border transition ${
                    radiusInput === preset ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {preset}km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: 24-Hour Polar Meteogram & Active Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Meteogram Chart Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  24-Hour Polar Meteogram & Storm Forecast
                </h4>
                <p className="text-xs text-slate-500">
                  Temperature, Wind Chill & Wind Gust Trends for {currentStation.name}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Temp (°C)
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ml-2" /> Gusts (km/h)
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} unit="°" />
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
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temp"
                    name="Temperature (°C)"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="windChill"
                    name="Wind Chill (°C)"
                    stroke="#0284c7"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="windGust"
                    name="Wind Gust (km/h)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Station Safety Directives & Assigned Personnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Weather Safety Directives */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  Active Station Directives
                </h5>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                  {activeEvents.length} Active
                </span>
              </div>

              {activeEvents.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Conditions nominal. Outdoor research and traverse operations authorized.</span>
                </div>
              ) : (
                activeEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      ev.severity === 'CRITICAL'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{ev.event_type.replace(/_/g, ' ')} ({ev.severity})</span>
                      <span className="text-[10px] font-mono">{ev.status}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">{ev.description}</p>
                    <div className="pt-1 border-t border-rose-200/60 font-mono text-[11px] font-semibold">
                      Directive: {ev.operational_instruction}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Station Personnel Readiness */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  Station Personnel Muster ({stationPersonnel.length})
                </h5>
                <span className="text-[10px] text-slate-500 font-mono">Radius: {currentStation.radius_km}km</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                {stationPersonnel.length === 0 ? (
                  <div className="py-3 text-xs text-slate-500 text-center">
                    No active personnel assigned to this base.
                  </div>
                ) : (
                  stationPersonnel.map((p) => (
                    <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.role} • {p.currentLocation}</div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        p.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
