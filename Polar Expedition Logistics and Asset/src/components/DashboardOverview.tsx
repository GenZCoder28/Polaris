import React from 'react';
import { 
  Expedition, 
  Container, 
  InventoryItem, 
  Personnel, 
  EmergencyIncident, 
  Station,
  Vessel 
} from '../types';
import { 
  Compass, 
  Boxes, 
  Package, 
  Users, 
  AlertTriangle, 
  TrendingDown, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Sparkles,
  Ship,
  Fuel,
  Activity,
  CloudSun,
  Waves,
  Wind,
  BarChart3,
  Radio
} from 'lucide-react';

interface DashboardOverviewProps {
  expeditions: Expedition[];
  containers: Container[];
  inventory: InventoryItem[];
  personnel: Personnel[];
  emergencies: EmergencyIncident[];
  stations: Station[];
  vessels: Vessel[];
  onNavigateTab: (tab: string) => void;
  onOpenEmergencyDetail: (emergencyId: string) => void;
  onQuickSimulateAction: (actionKey: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  expeditions,
  containers,
  inventory,
  personnel,
  emergencies,
  stations,
  vessels,
  onNavigateTab,
  onOpenEmergencyDetail,
  onQuickSimulateAction,
}) => {
  // Calculations
  const activeEmergencies = emergencies.filter((e) => e.status === 'ACTIVE');
  const containersInTransit = containers.filter((c) => c.status !== 'DELIVERED').length;
  const containersDelivered = containers.filter((c) => c.status === 'DELIVERED').length;

  // Inventory calculations
  // Find critical items (days remaining < 30) or warning (30-60)
  const inventoryHealth = (inventory || []).map((item) => {
    const stock = Number(item?.currentStock ?? 0);
    const burn = Number(item?.dailyConsumptionRate ?? 0);
    const daysRemaining = burn > 0 
      ? Math.floor(stock / burn) 
      : 999;
    return {
      ...item,
      currentStock: stock,
      dailyConsumptionRate: burn,
      daysRemaining,
      status: daysRemaining < 30 ? 'CRITICAL' : daysRemaining <= 60 ? 'WARNING' : 'SAFE',
    };
  });

  const criticalInventory = inventoryHealth.filter((i) => i.status === 'CRITICAL');
  const warningInventory = inventoryHealth.filter((i) => i.status === 'WARNING');

  // Personnel count by station
  const bharatiCount = personnel.filter((p) => p.assignedStationId === 'bharati').length;
  const maitriCount = personnel.filter((p) => p.assignedStationId === 'maitri').length;
  const shipCount = personnel.filter((p) => {
    const loc = (p.currentLocation || '').toLowerCase();
    return loc.includes('ship') || loc.includes('golovnin') || loc.includes('vessel');
  }).length;

  return (
    <div className="space-y-6">
      {/* Active Emergency Code Red Banner (if active) */}
      {activeEmergencies.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-4 shadow-md animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Flame className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase bg-rose-600 text-white px-2 py-0.5 rounded">
                    🚨 ACTIVE CODE RED INCIDENT
                  </span>
                  <span className="text-xs text-rose-700 font-mono font-semibold">
                    {activeEmergencies[0].reportedTime}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-rose-950 mt-0.5">
                  {activeEmergencies[0].title} — Bharati Station
                </h3>
                <p className="text-xs text-rose-800 max-w-2xl line-clamp-1 mt-0.5">
                  {activeEmergencies[0].description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenEmergencyDetail(activeEmergencies[0].id)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow flex items-center gap-1.5"
              >
                <span>Command Incident Response</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Expeditions */}
        <div 
          onClick={() => onNavigateTab('expeditions')}
          className="bg-white hover:border-blue-300 border border-blue-100 rounded-xl p-4 cursor-pointer transition shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Expeditions</span>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 group-hover:scale-110 transition">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-950 font-mono">{expeditions.length}</span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              2 Active • 1 Planning
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">ISEA-44 (Bharati) • ISEA-45 (Maitri)</p>
        </div>

        {/* Cargo Containers */}
        <div 
          onClick={() => onNavigateTab('cargo')}
          className="bg-white hover:border-blue-300 border border-blue-100 rounded-xl p-4 cursor-pointer transition shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cargo & Containers</span>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 group-hover:scale-110 transition">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-950 font-mono">{containers.length}</span>
            <span className="text-xs text-blue-700 font-semibold">
              {containersInTransit} in transit • {containersDelivered} delivered
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Priority stowage order optimized</p>
        </div>

        {/* Inventory Stock & Alerts */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="bg-white hover:border-blue-300 border border-blue-100 rounded-xl p-4 cursor-pointer transition shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Depletion</span>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 group-hover:scale-110 transition">
              <Fuel className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-950 font-mono">{inventory.length}</span>
            {criticalInventory.length > 0 ? (
              <span className="text-xs text-rose-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {criticalInventory.length} Critical Resupply Deficit
              </span>
            ) : (
              <span className="text-xs text-emerald-700 font-semibold">All Stocks Nominal</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Fuel: 36 days left (Next ship in 50d)
          </p>
        </div>

        {/* Polar Personnel */}
        <div 
          onClick={() => onNavigateTab('personnel')}
          className="bg-white hover:border-blue-300 border border-blue-100 rounded-xl p-4 cursor-pointer transition shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Antarctic Personnel</span>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-950 font-mono">94</span>
            <span className="text-xs text-blue-700 font-semibold">
              94 Deployed Total
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Bharati (42) • Maitri (38) • Ship (14)
          </p>
        </div>
      </div>

      {/* OpenStreetMap GIS Interactive Corridor Preview Bar */}
      <div 
        onClick={() => onNavigateTab('map')}
        className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-900 rounded-xl p-4 text-white shadow-md cursor-pointer hover:shadow-lg transition group flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-700/50"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-cyan-300 group-hover:scale-105 transition">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wide text-white uppercase">
                OpenStreetMap Antarctic Marine GIS & Station Tracker
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
                Live Geotags Active
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              Live OpenStreetMap tiles with tagged locations for Bharati, Maitri, Cape Town Depot, Mormugao Port, and MV Vasiliy Golovnin in Southern Ocean.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <span className="text-xs font-semibold text-cyan-200 group-hover:text-white transition flex items-center gap-1">
            <span>Open Interactive OSM Map</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>

      {/* Polar Weather & Storm Radar Status Strip */}
      <div 
        onClick={() => onNavigateTab('weather')}
        className="bg-white border border-blue-200 hover:border-blue-400 rounded-xl p-4 shadow-xs cursor-pointer transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold text-blue-950 uppercase tracking-wider">
                Polar Weather & Storm Radar (Open-Meteo Deterministic Telemetry)
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap font-medium">
              <span>Bharati: <strong>-14°C</strong> • Wind 48 km/h</span>
              <span className="text-slate-300">•</span>
              <span>Maitri: <strong>-18°C</strong> • Gusts 78 km/h</span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-700">MV Golovnin: Swell <strong>4.8m</strong> (Rough)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center text-xs font-semibold text-blue-600 group-hover:text-blue-800 transition">
          <span>Open Radar & Safety Rules</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Operations Quick Launch: Reporting & Analytics + Satellite Communications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reporting & Analytics Hub Card */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition group border border-blue-800 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/40 border border-blue-400/30 flex items-center justify-center text-blue-300 group-hover:scale-110 transition shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Reporting & Analytics Command</h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/30 text-blue-200">
                  Audit Ready
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 mt-0.5">
                Executive KPIs, multi-domain dossiers, stockout horizons, and Antarctic Treaty export bundles
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 group-hover:text-white transition shrink-0" />
        </div>

        {/* Satellite Comms & Alert Dispatcher Card */}
        <div
          onClick={() => onNavigateTab('communication')}
          className="bg-white border border-blue-200 hover:border-blue-400 rounded-xl p-4 shadow-xs hover:shadow-md cursor-pointer transition group flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Satellite Comms & Alerts</h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Iridium Online
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Station dispatch broadcasts, SMS/satellite failover, notification history, and dead-letter logs
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition shrink-0" />
        </div>
      </div>

      {/* Main Grid: Left Column (Expeditions + Cargo) & Right Column (Inventory Alerts + Personnel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 cols: Expeditions & Cargo Transit Pipeline */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Expeditions Module Card */}
          <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Active Expeditions & Missions</span>
              </h3>
              <button
                onClick={() => onNavigateTab('expeditions')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>Mission Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {expeditions.map((exp) => {
                const targetStation = stations.find((s) => s.id === exp.destinationStationId);
                return (
                  <div
                    key={exp.id}
                    onClick={() => onNavigateTab('expeditions')}
                    className="bg-blue-50/40 hover:bg-blue-50/80 border border-blue-100 rounded-lg p-3 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-white border border-blue-200 px-1.5 py-0.5 rounded shadow-2xs">
                          {exp.code}
                        </span>
                        <h4 className="text-sm font-bold text-blue-950">{exp.name}</h4>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                        <span>Target: <strong className="text-slate-900">{targetStation?.name}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>Crew: <strong className="text-slate-900">{exp.personnelCount} members</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>Cargo: <strong className="text-slate-900">{(exp.allocatedWeightKg / 1000).toFixed(1)}t</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold font-mono ${
                        exp.status === 'ACTIVE_EN_ROUTE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : exp.status === 'ON_STATION'
                          ? 'bg-blue-50 text-blue-800 border border-blue-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {exp.status === 'ACTIVE_EN_ROUTE' ? '🟢 ON TRACK' : exp.status === 'ON_STATION' ? '🔵 ON STATION' : '⚪ PLANNING'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cargo Tracking Snapshot */}
          <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  <span>Cargo & Container Journey Pipeline</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  Total Payload: 80.5 tonnes • Priority stowage sequencing active
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('cargo')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>Stowage & Manifest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {containers.slice(0, 4).map((cnt) => (
                <div
                  key={cnt.id}
                  onClick={() => onNavigateTab('cargo')}
                  className="bg-blue-50/40 hover:bg-blue-50/80 border border-blue-100 rounded-lg p-2.5 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-blue-700">{cnt.code}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      cnt.stowagePriority === 1 ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      Priority #{cnt.stowagePriority}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-800 mt-1 font-semibold truncate">
                    {cnt.items[0]?.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1 border-t border-blue-100">
                    <span>{cnt.type}</span>
                    <span className="font-mono text-blue-700 font-semibold">{(cnt.currentWeightKg / 1000).toFixed(1)}t</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 cols: Inventory Depletion Engine & Station Personnel */}
        <div className="lg:col-span-5 space-y-5">
          {/* Inventory Depletion & Resupply Warning Engine */}
          <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-600" />
                  <span>Depletion & Resupply Alerts</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  Next Scheduled Resupply: <strong className="text-slate-800">50 Days</strong> (MV Vasiliy Golovnin)
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>View Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Critical Resupply Deficit Highlight */}
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs mb-3 space-y-1.5">
              <div className="flex items-center justify-between text-rose-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>CRITICAL FUEL SHORTAGE PREDICTED</span>
                </span>
                <span className="font-mono bg-rose-600 px-1.5 py-0.5 rounded text-white text-[10px]">
                  -14 DAYS DEFICIT
                </span>
              </div>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                Bharati Polar Diesel (18,000 L) will deplete in <strong>36 days</strong> at 500 L/day, but next ship arrives in <strong>50 days</strong>!
              </p>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-rose-700 font-semibold">Recommended Action:</span>
                <button
                  onClick={() => onQuickSimulateAction('apply_conservation')}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition shadow-xs"
                >
                  Apply 12% Fuel Conservation
                </button>
              </div>
            </div>

            {/* List of Critical & Warning Items */}
            <div className="space-y-2">
              {inventoryHealth
                .filter((i) => i.stationId === 'bharati')
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigateTab('inventory')}
                    className="bg-blue-50/40 hover:bg-blue-50/80 border border-blue-100 rounded-lg p-2.5 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-blue-950">{item.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {(item.currentStock ?? 0).toLocaleString()} {item.unit || ''} • Burn: {item.dailyConsumptionRate ?? 0} {item.unit || ''}/day
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          item.status === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : item.status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {item.daysRemaining}d left
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono font-semibold">
                        {item.status === 'CRITICAL' ? '🔴 CRITICAL' : item.status === 'WARNING' ? '🟡 WARNING' : '🟢 SAFE'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Personnel Deployment Snapshot */}
          <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Station Personnel Distribution</span>
              </h3>
              <button
                onClick={() => onNavigateTab('personnel')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>Roster & Rotations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-blue-50/40 border border-blue-100">
                <span className="font-semibold text-slate-800">Bharati Station (East Antarctica)</span>
                <span className="font-mono text-blue-700 font-bold">42 Scientists & Crew</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-blue-50/40 border border-blue-100">
                <span className="font-semibold text-slate-800">Maitri Station (Queen Maud Land)</span>
                <span className="font-mono text-blue-700 font-bold">38 Scientists & Crew</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-blue-50/40 border border-blue-100">
                <span className="font-semibold text-slate-800">MV Vasiliy Golovnin (En Route Polar Vessel)</span>
                <span className="font-mono text-blue-700 font-bold">14 Logistics & Crew</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
