import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  Download, 
  AlertTriangle, 
  PackageCheck, 
  Layers, 
  Ship, 
  Truck, 
  CheckCircle,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { ContainerReportItem, CargoReportItem } from '../../types.ts';

interface CargoContainerAnalyticsViewProps {
  containers: ContainerReportItem[];
  cargoItems: CargoReportItem[];
  onExport: (type: string) => void;
  loading: boolean;
}

export const CargoContainerAnalyticsView: React.FC<CargoContainerAnalyticsViewProps> = ({
  containers,
  cargoItems,
  onExport,
  loading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'containers' | 'cargo'>('containers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredContainers = containers.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.journey_status === statusFilter;
    const q = (search || '').toLowerCase();
    const cNum = (c.container_number || '').toLowerCase();
    const cVessel = (c.current_vessel_name || '').toLowerCase();
    const cDest = (c.destination_station || '').toLowerCase();

    const matchesSearch = !q || cNum.includes(q) || cVessel.includes(q) || cDest.includes(q);
    return matchesStatus && matchesSearch;
  });

  const filteredCargo = cargoItems.filter((cg) => {
    const matchesStatus = statusFilter === 'ALL' || cg.status === statusFilter;
    const q = (search || '').toLowerCase();
    const iName = (cg.item_name || '').toLowerCase();
    const cat = (cg.category || '').toLowerCase();
    const dest = (cg.destination_station || '').toLowerCase();
    const cNum = (cg.container_number || '').toLowerCase();

    const matchesSearch = !q || iName.includes(q) || cat.includes(q) || dest.includes(q) || cNum.includes(q);
    return matchesStatus && matchesSearch;
  });

  const getUtilizationColor = (pct: number) => {
    if (pct > 95) return 'text-rose-600 bg-rose-500';
    if (pct >= 75) return 'text-emerald-600 bg-emerald-500';
    if (pct >= 50) return 'text-blue-600 bg-blue-500';
    return 'text-amber-600 bg-amber-500';
  };

  return (
    <div className="space-y-4">
      {/* Sub Tab Switcher & Action Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveSubTab('containers')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeSubTab === 'containers'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ISO Containers & Utilization ({containers.length})
            </button>
            <button
              onClick={() => setActiveSubTab('cargo')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeSubTab === 'cargo'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cargo Manifest & Hazardous ({cargoItems.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter container or cargo item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => onExport(activeSubTab)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export {activeSubTab === 'containers' ? 'Containers' : 'Cargo'}</span>
          </button>
        </div>
      </div>

      {/* VIEW: CONTAINERS */}
      {activeSubTab === 'containers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContainers.map((c) => {
            const utilPct = Math.round((c.current_weight_kg / c.max_weight_capacity_kg) * 100);
            const utilStyle = getUtilizationColor(utilPct);

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-blue-600" />
                      <span className="font-mono font-bold text-slate-900 text-sm">{c.container_number}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Type: {c.container_type} • Destination: <strong className="text-slate-700">{c.destination_station}</strong>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {c.journey_status}
                  </span>
                </div>

                {/* Utilization meter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Stowage Utilization</span>
                    <span className="font-bold font-mono text-slate-900">{utilPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${utilStyle.split(' ')[1]}`}
                      style={{ width: `${Math.min(100, utilPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{c.current_weight_kg.toLocaleString()} kg</span>
                    <span>Max {c.max_weight_capacity_kg.toLocaleString()} kg</span>
                  </div>
                </div>

                {/* Key metadata badges */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stowage Tier</span>
                    <span className="font-semibold text-slate-800">Priority {c.stowage_priority}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Assigned Vessel</span>
                    <span className="font-semibold text-slate-800 truncate block">{c.current_vessel_name || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Hazardous items count */}
                {c.hazardous_items_count > 0 && (
                  <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-medium">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>Contains {c.hazardous_items_count} Hazardous Cargo Line Items</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: CARGO ITEMS */}
      {activeSubTab === 'cargo' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Cargo Line Item</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Assigned Container</th>
                  <th className="py-3 px-4 font-semibold">Mass / Volume</th>
                  <th className="py-3 px-4 font-semibold">Destination</th>
                  <th className="py-3 px-4 font-semibold">Hazardous Class</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">Loading freight items...</td>
                  </tr>
                ) : filteredCargo.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">No cargo items found matching criteria.</td>
                  </tr>
                ) : (
                  filteredCargo.map((cg) => (
                    <tr key={cg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{cg.item_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {cg.id}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {cg.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-blue-700 font-semibold">
                        {cg.container_number || 'Uncontainerized'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        <div>{cg.weight_kg.toLocaleString()} kg</div>
                        <div className="text-[10px] text-slate-400">{cg.volume_cbm} CBM</div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {cg.destination_station}
                      </td>

                      <td className="py-3 px-4">
                        {cg.is_hazardous ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <Flame className="w-3 h-3 text-amber-600" />
                            <span>{cg.hazardous_class || 'HAZMAT'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Non-Hazardous</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {cg.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
