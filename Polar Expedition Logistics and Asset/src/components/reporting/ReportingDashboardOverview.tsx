import React from 'react';
import { 
  Compass, 
  Users, 
  Boxes, 
  Truck, 
  Package, 
  Wrench, 
  ShieldAlert, 
  CloudLightning, 
  Radio, 
  ArrowUpRight, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { DashboardKpis, ExpeditionReportItem } from '../../types.ts';

interface ReportingDashboardOverviewProps {
  kpis: DashboardKpis | null;
  expeditions: ExpeditionReportItem[];
  onSelectExpedition: (expeditionId: string) => void;
  onNavigateTab: (tabKey: string) => void;
  loading: boolean;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const ReportingDashboardOverview: React.FC<ReportingDashboardOverviewProps> = ({
  kpis,
  expeditions,
  onSelectExpedition,
  onNavigateTab,
  loading,
}) => {
  if (loading || !kpis) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Aggregating real-time polar command datasets...</span>
      </div>
    );
  }

  // Chart data 1: Expeditions Status
  const rawExpStatus = (kpis as any).expeditionsByStatus;
  const rawExpBreakdown = (kpis as any).expeditionStatusBreakdown;
  const expeditionChartData = Array.isArray(rawExpStatus) && rawExpStatus.length > 0
    ? rawExpStatus.map((e: any) => ({ name: e.status, count: e.count }))
    : Object.entries(rawExpBreakdown || {}).map(([status, count]) => ({
        name: status,
        count: Number(count),
      }));

  if (expeditionChartData.length === 0) {
    expeditionChartData.push(
      { name: 'Active', count: kpis.activeExpeditions ?? 0 },
      { name: 'Planned', count: kpis.plannedExpeditions ?? 0 },
      { name: 'Completed', count: kpis.completedExpeditions ?? 0 }
    );
  }

  // Chart data 2: Personnel by Station
  const rawPersonnelDist = (kpis as any).personnelDistribution;
  const rawPersonnelStation = (kpis as any).personnelByStation;
  const personnelStationData = Array.isArray(rawPersonnelDist) && rawPersonnelDist.length > 0
    ? rawPersonnelDist.map((p: any) => ({
        name: (p.station || '').replace(' Station', '').toUpperCase(),
        personnel: p.deployed ?? 0,
      }))
    : Object.entries(rawPersonnelStation || {}).map(([station, count]) => ({
        name: station.toUpperCase(),
        personnel: Number(count),
      }));

  // Chart data 3: Cargo by Status
  const rawCargoChart = (kpis as any).cargoByStatusChart;
  const rawCargoBreakdown = (kpis as any).cargoByStatus;
  const cargoStatusData = Array.isArray(rawCargoChart) && rawCargoChart.length > 0
    ? rawCargoChart.map((c: any) => ({ name: c.name, value: c.value }))
    : Object.entries(rawCargoBreakdown || {}).map(([status, count]) => ({
        name: status.replace(/_/g, ' '),
        value: Number(count),
      }));

  if (cargoStatusData.length === 0) {
    cargoStatusData.push(
      { name: 'In Transit', value: kpis.cargoInTransit ?? (kpis as any).cargoInTransitCount ?? 0 },
      { name: 'Delivered', value: kpis.deliveredCargo ?? 0 },
      { name: 'Exceptions', value: kpis.cargoExceptions ?? 0 }
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI METRIC CARDS GRID (10 High-Impact Polar Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* 1. Expeditions */}
        <div 
          onClick={() => onNavigateTab('expeditions')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Expeditions</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.activeExpeditions}</span>
            <span className="text-xs text-slate-500">/ {kpis.totalExpeditions} Total</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Planned: {kpis.plannedExpeditions}</span>
            <span className="text-blue-600 font-semibold flex items-center">
              View <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 2. Personnel */}
        <div 
          onClick={() => onNavigateTab('personnel')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Personnel Deployed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.currentlyDeployedPersonnel ?? (kpis as any).deployedPersonnel ?? 0}</span>
            <span className="text-xs text-slate-500">/ {kpis.totalPersonnel ?? 0} Members</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>In Transit: {kpis.inTransitPersonnel ?? 0}</span>
            <span className="text-emerald-600 font-semibold flex items-center">
              Roster <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 3. Cargo Freight */}
        <div 
          onClick={() => onNavigateTab('cargo')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cargo In Transit</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{(Number(kpis.totalCargoWeightKg || 0) / 1000).toFixed(0)}</span>
            <span className="text-xs text-slate-500">MT Mass</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{kpis.cargoInTransit ?? (kpis as any).cargoInTransitCount ?? 0} consignments</span>
            <span className="text-amber-600 font-semibold flex items-center">
              Stowage <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 4. Container Utilization */}
        <div 
          onClick={() => onNavigateTab('cargo')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Container Packing</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.avgContainerUtilizationPct ?? (kpis as any).containerUtilizationPercent ?? 0}%</span>
            <span className="text-xs text-slate-500">Avg Utilization</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{kpis.totalContainers ?? 0} ISO units</span>
            <span className="text-purple-600 font-semibold flex items-center">
              Priority Stowage <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 5. Shipments & Delay */}
        <div 
          onClick={() => onNavigateTab('shipments')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Multi-Modal Transit</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.activeShipments ?? (kpis as any).activeShipmentsCount ?? 0}</span>
            <span className="text-xs text-slate-500">Active Legs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span className={(kpis.avgDelayDays ?? (kpis as any).avgShipmentDelayDays ?? 0) > 2 ? 'text-red-600 font-bold' : 'text-slate-600'}>
              Avg Delay: +{kpis.avgDelayDays ?? (kpis as any).avgShipmentDelayDays ?? 0}d
            </span>
            <span className="text-cyan-600 font-semibold flex items-center">
              Routes <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 6. Inventory Shortages */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stock Shortages</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600">{kpis.criticalStockItems ?? (kpis as any).criticalStockItemsCount ?? 0}</span>
            <span className="text-xs text-slate-500">Critical / {kpis.lowStockItems ?? (kpis as any).lowStockItemsCount ?? 0} Low</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Predicted: {kpis.predictedShortagesCount ?? 0} items</span>
            <span className="text-red-600 font-semibold flex items-center">
              Depletion <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 7. Asset Fleet Health */}
        <div 
          onClick={() => onNavigateTab('assets')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fleet Health Score</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{(kpis.avgAssetHealthScore ?? (kpis as any).fleetHealthScore ?? 92).toFixed(0)}%</span>
            <span className="text-xs text-emerald-600 font-bold">Nominal</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Needs Maint: {kpis.assetsUnderMaintenance ?? (kpis as any).maintenancePendingAssetsCount ?? 0}</span>
            <span className="text-emerald-600 font-semibold flex items-center">
              Assets <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 8. Emergencies & Response */}
        <div 
          onClick={() => onNavigateTab('emergencies')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Emergencies</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${(kpis.activeEmergencies ?? (kpis as any).activeEmergenciesCount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {kpis.activeEmergencies ?? (kpis as any).activeEmergenciesCount ?? 0}
            </span>
            <span className="text-xs text-slate-500">Active / {kpis.criticalEmergencies ?? (kpis as any).criticalIncidentsCount ?? 0} High</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Mean Ack: {kpis.avgAckTimeMinutes ?? (kpis as any).meanAcknowledgementTimeMinutes ?? 0}m</span>
            <span className="text-rose-600 font-semibold flex items-center">
              Safety <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 9. Weather Warnings */}
        <div 
          onClick={() => onNavigateTab('weather')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Severe Weather</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <CloudLightning className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.criticalWeatherEvents ?? (kpis as any).activeWeatherAlertsCount ?? 0}</span>
            <span className="text-xs text-slate-500">Alerts Active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Blizzards / Gale Forces</span>
            <span className="text-sky-600 font-semibold flex items-center">
              Radar <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 10. Satellite Comms Telemetry */}
        <div 
          onClick={() => onNavigateTab('communications')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Satellite Comms</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.deliverySuccessRatePct ?? (kpis as any).notificationDeliverySuccessRate ?? 98}%</span>
            <span className="text-xs text-indigo-600 font-bold">Delivered</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Iridium link nominal</span>
            <span className="text-indigo-600 font-semibold flex items-center">
              Telemetry <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* RECHARTS VISUALIZATIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Personnel Station Capacity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Personnel by Station</h3>
              <p className="text-xs text-slate-500">Live on-station distribution</p>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personnelStationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} 
                />
                <Bar dataKey="personnel" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cargo Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cargo Journey Breakdown</h3>
              <p className="text-xs text-slate-500">Freight manifest progression</p>
            </div>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cargoStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {cargoStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} 
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Expedition Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Expedition Phases</h3>
              <p className="text-xs text-slate-500">Active vs Planned vs Completed</p>
            </div>
            <Compass className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expeditionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} 
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FAST DRILLDOWN: ACTIVE EXPEDITIONS DOSSIERS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Current Polar Missions Operational Dossiers</h3>
            <p className="text-xs text-slate-500">Select any active or planned mission to generate the cross-module report</p>
          </div>
          <button
            onClick={() => onNavigateTab('expeditions')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View Full Registry</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(expeditions || []).slice(0, 3).map((exp) => (
            <div
              key={exp.id}
              onClick={() => onSelectExpedition(exp.id)}
              className="border border-slate-200 hover:border-blue-500 rounded-xl p-4 bg-slate-50 hover:bg-white transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {exp.expedition_code}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1 group-hover:text-blue-600 transition-colors">
                    {exp.expedition_name}
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {exp.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 my-2 border-y border-slate-200/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Personnel</span>
                  <span className="font-bold text-slate-800">{exp.personnelCount ?? 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Containers</span>
                  <span className="font-bold text-slate-800">{exp.containersCount ?? 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Cargo Mass</span>
                  <span className="font-bold text-slate-800 font-mono">{(Number(exp.totalCargoWeightKg || 0) / 1000).toFixed(0)} MT</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>{exp.season_year} Season</span>
                <span className="font-semibold text-blue-600 group-hover:underline flex items-center gap-1">
                  Open Dossier <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
