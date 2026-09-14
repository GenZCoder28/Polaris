import React, { useState } from 'react';
import { Station, Personnel, InventoryItem } from '../types';
import { 
  Building2, 
  MapPin, 
  Users, 
  ArrowLeft, 
  Thermometer, 
  Wind, 
  Eye, 
  Gauge, 
  Compass, 
  Package, 
  Activity,
  ArrowRight,
  ShieldAlert,
  Fuel
} from 'lucide-react';

interface StationOverviewProps {
  stations: Station[];
  personnel: Personnel[];
  inventory?: InventoryItem[];
  onReturn?: () => void;
}

export const StationOverview: React.FC<StationOverviewProps> = ({
  stations,
  personnel,
  inventory = [],
  onReturn
}) => {
  // Only the stations actually present in Antarctica (Bharati & Maitri)
  const antarcticStations = stations.filter(
    s => s.id === 'bharati' || s.id === 'maitri'
  );

  // Selected station ID: null means viewing the station list
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const selectedStation = antarcticStations.find(s => s.id === selectedStationId);

  // Calculations for Antarctic bases
  const totalCapacity = antarcticStations.reduce((acc, s) => acc + s.personnelCapacity, 0);
  const totalOccupied = antarcticStations.reduce((acc, s) => acc + s.currentPersonnelCount, 0);
  const totalRemaining = Math.max(0, totalCapacity - totalOccupied);

  // If a station is selected, render ONLY its detailed view with a Return button
  if (selectedStation) {
    const stationPersonnel = personnel.filter(p => p.assignedStationId === selectedStation.id);
    const stationInventory = inventory.filter(item => {
      if (item.stationId && selectedStation.id && item.stationId === selectedStation.id) return true;
      const loc = (item.location || '').toLowerCase();
      const stId = (selectedStation.id || '').toLowerCase();
      const stName = (selectedStation.name || '').toLowerCase().split(' ')[0] || '';
      return (stId && loc.includes(stId)) || (stName && loc.includes(stName));
    });
    const currentCapacity = selectedStation.personnelCapacity;
    const currentOccupied = selectedStation.currentPersonnelCount;
    const currentRemaining = Math.max(0, currentCapacity - currentOccupied);
    const occupancyPercent = currentCapacity > 0 ? Math.round((currentOccupied / currentCapacity) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Detail Top Navigation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedStationId(null)}
              id="btn-return-to-stations"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Stations</span>
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>{selectedStation.name} Details</span>
              </h2>
              <span className="text-xs text-slate-500">
                Antarctic station profile, current crew capacity, and operational telemetry
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {selectedStation.status}
            </span>
          </div>
        </div>

        {/* Station Detailed Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Station Details Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{selectedStation.name}</h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {selectedStation.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Est. {selectedStation.establishedYear}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Station Commander: <strong className="text-slate-900">{selectedStation.commander}</strong> • {selectedStation.country}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1 font-mono">
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    Lat: {selectedStation.coordinates.lat.toFixed(4)}°, Lng: {selectedStation.coordinates.lng.toFixed(4)}°
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedStation.region}
                  </span>
                </div>
              </div>

              {/* Station Capacity Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-6">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Capacity</div>
                  <div className="text-2xl font-bold text-slate-900 font-mono">{currentCapacity}</div>
                  <div className="text-[11px] text-slate-400">Total berths</div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div>
                  <div className="text-xs text-slate-500 font-medium">Stationed Crew</div>
                  <div className="text-2xl font-bold text-blue-600 font-mono">{currentOccupied}</div>
                  <div className="text-[11px] text-slate-400">{occupancyPercent}% full</div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div>
                  <div className="text-xs font-semibold text-emerald-700">Remaining Free</div>
                  <div className="text-2xl font-bold text-emerald-600 font-mono">{currentRemaining}</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Vacant bunks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Telemetry */}
          {selectedStation.weather && (
            <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100 bg-white">
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                  <span>Temperature</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {selectedStation.weather.temperatureC}°C
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Wind className="w-3.5 h-3.5 text-blue-500" />
                  <span>Wind Speed</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {selectedStation.weather.windSpeedKnots} kts
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  <span>Visibility</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {selectedStation.weather.visibilityKm} km
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-500" />
                  <span>Barometer</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {selectedStation.weather.pressureHpa} hPa
                </div>
              </div>
              <div className="p-4 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <span>Atmosphere</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 line-clamp-2">
                  {selectedStation.weather.condition}
                </div>
              </div>
            </div>
          )}

          {/* Stationed Personnel & Details */}
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Stationed Personnel Roster ({stationPersonnel.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  {currentRemaining} vacant bunks available
                </span>
              </div>

              {stationPersonnel.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                  No personnel assigned to this station currently.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stationPersonnel.map((p) => (
                    <div 
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{p.name}</div>
                          <div className="text-xs text-blue-600 font-medium">{p.role}</div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          {p.medicalClearance}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                        <span>ID: {p.id}</span>
                        <span>Blood: {p.bloodGroup || 'O+'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Return Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedStationId(null)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Stations</span>
              </button>
              <div className="text-xs text-slate-500">
                Viewing: {selectedStation.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Station List View (only Antarctic stations: Bharati & Maitri)
  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Antarctic Research Stations</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              India&apos;s active polar research bases in Antarctica
            </p>
          </div>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-2 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-500">Total Antarctic Bunks Free:</span>
            <span className="font-bold font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
              {totalRemaining} Available
            </span>
          </div>
        </div>
      </div>

      {/* Station Selector Cards (Only Bharati & Maitri) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {antarcticStations.map((station) => {
          const remaining = Math.max(0, station.personnelCapacity - station.currentPersonnelCount);
          const percent = Math.round((station.currentPersonnelCount / station.personnelCapacity) * 100);

          return (
            <div
              key={station.id}
              onClick={() => setSelectedStationId(station.id)}
              className="p-5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/30 transition-all cursor-pointer shadow-xs hover:shadow-md group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">
                        {station.name}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {station.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {station.region}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  <span>Commander: </span>
                  <strong className="text-slate-800">{station.commander}</strong>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span>Est. {station.establishedYear}</span>
                </div>

                {/* Capacity breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Remaining Bunks:</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      {remaining} Bunks Free
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Occupancy:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {station.currentPersonnelCount} / {station.personnelCapacity} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Click to view details button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-800">
                <span>View Station Details & Crew Roster</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
