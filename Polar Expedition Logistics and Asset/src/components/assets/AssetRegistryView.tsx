import React, { useState } from 'react';
import { 
  AssetMasterRecord, 
  ControlledAssetStatus, 
  ControlledAssetCondition,
  AssetCategory 
} from '../../types.ts';
import { 
  Cpu, 
  Search, 
  Filter, 
  Plus, 
  UserCheck, 
  Truck, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Layers, 
  ShieldAlert, 
  ExternalLink,
  Table,
  Grid,
  History
} from 'lucide-react';

interface AssetRegistryViewProps {
  assets: AssetMasterRecord[];
  onOpenRegister: () => void;
  onSelectAssetHistory: (assetId: string) => void;
  onTriggerAssign: (asset: AssetMasterRecord) => void;
  onTriggerTransfer: (asset: AssetMasterRecord) => void;
  onTriggerMaintenance: (asset: AssetMasterRecord) => void;
  onTriggerIncident: (asset: AssetMasterRecord) => void;
}

const CATEGORIES = [
  'ALL',
  'Generators',
  'Snow vehicles',
  'Scientific instruments',
  'Radios',
  'GPS devices',
  'Computers',
  'Power equipment',
  'Safety equipment',
  'Field equipment',
  'Specialized expedition equipment'
];

export const AssetRegistryView: React.FC<AssetRegistryViewProps> = ({
  assets,
  onOpenRegister,
  onSelectAssetHistory,
  onTriggerAssign,
  onTriggerTransfer,
  onTriggerMaintenance,
  onTriggerIncident
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  const filteredAssets = assets.filter((asset) => {
    if (stationFilter !== 'ALL' && asset.assigned_station !== stationFilter) return false;
    if (categoryFilter !== 'ALL' && asset.asset_category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && asset.status !== statusFilter) return false;
    if (conditionFilter !== 'ALL' && asset.condition !== conditionFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (asset.asset_id || '').toLowerCase().includes(q);
      const matchName = (asset.asset_name || '').toLowerCase().includes(q);
      const matchModel = (asset.model || '').toLowerCase().includes(q);
      const matchSerial = (asset.serial_number || '').toLowerCase().includes(q);
      const matchLoc = (asset.current_location || '').toLowerCase().includes(q);
      const matchTeam = (asset.assigned_team || '').toLowerCase().includes(q);
      return matchId || matchName || matchModel || matchSerial || matchLoc || matchTeam;
    }

    return true;
  });

  const availableCount = assets.filter(a => a.status === 'AVAILABLE').length;
  const inUseCount = assets.filter(a => a.status === 'ASSIGNED' || a.status === 'IN_USE').length;
  const maintenanceCount = assets.filter(a => a.status === 'UNDER_MAINTENANCE').length;
  const damagedCount = assets.filter(a => a.status === 'DAMAGED' || a.status === 'LOST').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Antarctic Expedition Equipment & Asset Master Registry
              </h3>
              <p className="text-xs text-slate-500">
                Managing reusable machinery, scientific arrays, and life-support assets across Bharati, Maitri, and Himadri stations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenRegister}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Asset</span>
          </button>
        </div>
      </div>

      {/* Metric Status Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Available & Ready</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">{availableCount}</span>
            <span className="text-xs text-slate-400 font-medium">/ {assets.length} total</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Ready for field deployment</span>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Assigned / In Use</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700 font-mono">{inUseCount}</span>
            <span className="text-xs text-slate-400 font-medium">on traverse & bases</span>
          </div>
          <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">Active custody assigned</span>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Under Maintenance</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-mono">{maintenanceCount}</span>
            <span className="text-xs text-slate-400 font-medium">in polar workshop</span>
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">Technicians active</span>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Damaged / Offline</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 font-mono">{damagedCount}</span>
            <span className="text-xs text-slate-400 font-medium">awaiting resolution</span>
          </div>
          <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">Incident investigation logged</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name, model, serial, or location..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Station Filter */}
          <div className="md:col-span-2">
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-700"
            >
              <option value="ALL">All Stations</option>
              <option value="bharati">Bharati Station</option>
              <option value="maitri">Maitri Station</option>
              <option value="himadri">Himadri Station</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_USE">IN_USE</option>
              <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="md:col-span-1 flex justify-end gap-1">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg border text-xs transition ${
                viewMode === 'GRID' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-300'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg border text-xs transition ${
                viewMode === 'TABLE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-300'
              }`}
              title="Dense Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Result Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing <strong>{filteredAssets.length}</strong> matching polar assets</span>
        {(searchQuery || stationFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStationFilter('ALL');
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
              setConditionFilter('ALL');
            }}
            className="text-blue-600 hover:underline font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Asset Cards Grid View */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const hoursRemaining = Math.max(0, asset.maintenance_threshold_hours - asset.operating_hours);
            const isDueSoon = hoursRemaining <= 200 && hoursRemaining > 0;
            const isOverdue = hoursRemaining === 0;

            const isAvailable = asset.status === 'AVAILABLE';
            const isAssigned = asset.status === 'ASSIGNED' || asset.status === 'IN_USE';
            const isMaint = asset.status === 'UNDER_MAINTENANCE';
            const isDamaged = asset.status === 'DAMAGED' || asset.status === 'LOST';

            return (
              <div
                key={asset.id || asset.asset_id}
                className="bg-white border border-blue-100 rounded-2xl p-5 hover:border-blue-300 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: ID + Status + Condition */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-sm">
                          {asset.asset_id}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 uppercase">
                          {asset.assigned_station}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                        {asset.asset_name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {asset.asset_category} • {asset.model}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        isAvailable ? 'bg-emerald-100 text-emerald-800' :
                        isAssigned ? 'bg-blue-100 text-blue-800' :
                        isMaint ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {asset.status}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        asset.condition === 'EXCELLENT' ? 'text-emerald-700 bg-emerald-50' :
                        asset.condition === 'GOOD' ? 'text-slate-700 bg-slate-100' :
                        asset.condition === 'FAIR' ? 'text-amber-700 bg-amber-50' :
                        'text-rose-700 bg-rose-50'
                      }`}>
                        {asset.condition}
                      </span>
                    </div>
                  </div>

                  {/* Operational Telemetry Indicators */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Operating Run-Hours:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {asset.operating_hours} / {asset.maintenance_threshold_hours} hrs
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverdue ? 'bg-rose-600' :
                          isDueSoon ? 'bg-amber-500' :
                          'bg-blue-600'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((asset.operating_hours / asset.maintenance_threshold_hours) * 100))}%`
                        }}
                      />
                    </div>

                    {/* Telemetry Warning Chips */}
                    <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                      <span className="text-slate-500">
                        Vibration: <strong className="text-slate-700">{asset.vibration_index} mm/s</strong>
                      </span>
                      {isOverdue ? (
                        <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          OVERDUE SERVICE
                        </span>
                      ) : isDueSoon ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Due in {hoursRemaining}h
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Nominal</span>
                      )}
                    </div>
                  </div>

                  {/* Location & Custodian Info */}
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-400">Loc:</span>
                      <span className="font-medium text-slate-800 truncate">{asset.current_location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-400">Team:</span>
                      <span className="font-medium text-slate-800 truncate">{asset.assigned_team || 'Station Reserve'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-400">Custodian:</span>
                      <span className="font-medium text-slate-800 truncate">{asset.assigned_personnel || 'None'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectAssetHistory(asset.asset_id)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Timeline & History</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onTriggerAssign(asset)}
                      title="Assign to Station / Team / Personnel"
                      className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg border border-slate-200 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onTriggerTransfer(asset)}
                      title="Transfer Location"
                      className="p-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 rounded-lg border border-slate-200 transition"
                    >
                      <Truck className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onTriggerMaintenance(asset)}
                      title="Log Maintenance"
                      className="p-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 rounded-lg border border-slate-200 transition"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onTriggerIncident(asset)}
                      title="Report Damage or Incident"
                      className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg border border-slate-200 transition"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dense Tabular View */}
      {viewMode === 'TABLE' && (
        <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Name & Model</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Station & Location</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-center">Condition</th>
                  <th className="py-2.5 px-2 text-center">Hours</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id || asset.asset_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {asset.asset_id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{asset.asset_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{asset.manufacturer} • {asset.model}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{asset.asset_category}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 uppercase font-mono text-[11px]">
                        {asset.assigned_station}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{asset.current_location}</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        asset.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                        asset.status === 'ASSIGNED' || asset.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                        asset.status === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-semibold font-mono text-[11px]">
                      {asset.condition}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">
                      {asset.operating_hours}h
                    </td>
                    <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectAssetHistory(asset.asset_id)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold"
                      >
                        History
                      </button>
                      <button
                        type="button"
                        onClick={() => onTriggerAssign(asset)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px]"
                      >
                        Assign
                      </button>
                      <button
                        type="button"
                        onClick={() => onTriggerTransfer(asset)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px]"
                      >
                        Transfer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
