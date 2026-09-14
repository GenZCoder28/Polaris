import React, { useState } from 'react';
import { 
  Package, 
  Wrench, 
  Search, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Clock, 
  Activity,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { InventoryReportItem, AssetReportItem } from '../../types.ts';

interface InventoryAssetAnalyticsViewProps {
  inventory: InventoryReportItem[];
  assets: AssetReportItem[];
  onExport: (type: string) => void;
  loading: boolean;
}

export const InventoryAssetAnalyticsView: React.FC<InventoryAssetAnalyticsViewProps> = ({
  inventory,
  assets,
  onExport,
  loading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'assets'>('inventory');
  const [search, setSearch] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');

  const filteredInventory = inventory.filter((item) => {
    const q = (search || '').toLowerCase();
    const stFilter = (stationFilter || '').toLowerCase();
    const itemStation = (item.station || '').toLowerCase();
    const itemName = (item.item_name || '').toLowerCase();
    const itemCat = (item.category || '').toLowerCase();

    const matchesStation = stationFilter === 'ALL' || itemStation === stFilter;
    const matchesSearch = !q || itemName.includes(q) || itemCat.includes(q) || itemStation.includes(q);
    return matchesStation && matchesSearch;
  });

  const filteredAssets = assets.filter((asset) => {
    const q = (search || '').toLowerCase();
    const stFilter = (stationFilter || '').toLowerCase();
    const assetStation = (asset.station || '').toLowerCase();
    const assetName = (asset.name || '').toLowerCase();
    const assetCode = (asset.code || '').toLowerCase();
    const assetCat = (asset.category || '').toLowerCase();

    const matchesStation = stationFilter === 'ALL' || assetStation === stFilter;
    const matchesSearch = !q || assetName.includes(q) || assetCode.includes(q) || assetCat.includes(q) || assetStation.includes(q);
    return matchesStation && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Sub Tab Switcher & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeSubTab === 'inventory'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventory Stock & Depletion ({inventory.length})
          </button>
          <button
            onClick={() => setActiveSubTab('assets')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeSubTab === 'assets'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Asset Health & Predictive Wear ({assets.length})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeSubTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Stations</option>
            <option value="bharati">Bharati Station</option>
            <option value="maitri">Maitri Station</option>
            <option value="himadri">Himadri Station</option>
          </select>

          <button
            onClick={() => onExport(activeSubTab)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export {activeSubTab === 'inventory' ? 'Stock' : 'Assets'}</span>
          </button>
        </div>
      </div>

      {/* VIEW: INVENTORY */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Stock Item</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Station</th>
                  <th className="py-3 px-4 font-semibold">Stock Level</th>
                  <th className="py-3 px-4 font-semibold">Daily Consumption</th>
                  <th className="py-3 px-4 font-semibold">Horizon (Days Left)</th>
                  <th className="py-3 px-4 font-semibold">Forecast Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">Calculating depletion horizons...</td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">No inventory records match filters.</td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const isCritical = item.isCriticalShortage || item.daysRemaining < 30;
                    const isLow = !isCritical && item.daysRemaining < 60;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.item_name}</span>
                          <span className="text-[10px] font-mono text-slate-400">SKU: {item.id}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {item.station}
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {item.current_quantity.toLocaleString()} {item.unit}
                          <span className="block text-[10px] text-slate-400 font-normal">Min: {item.minimum_threshold.toLocaleString()}</span>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700">
                          {item.daily_consumption_rate.toFixed(1)} {item.unit}/day
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono font-bold text-sm ${
                              isCritical ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                            }`}>
                              {item.daysRemaining} days
                            </span>
                            {isCritical && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.resupplyStatus === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : item.resupplyStatus === 'REORDER'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {item.resupplyStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: ASSETS */}
      {activeSubTab === 'assets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const isHighVibe = asset.vibrationIndex > 5.0;
            const needsMaint = asset.operatingHours >= asset.thresholdHours || isHighVibe;

            return (
              <div
                key={asset.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      <span className="font-mono font-bold text-slate-900 text-sm">{asset.code}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{asset.name}</h4>
                    <span className="text-[11px] text-slate-500">
                      {asset.category} • <strong className="text-slate-700">{asset.station}</strong>
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    needsMaint
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {asset.status}
                  </span>
                </div>

                {/* Operating hours meter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Duty Cycle Wear</span>
                    <span className="font-bold font-mono text-slate-900">
                      {asset.operatingHours} / {asset.thresholdHours} hrs
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${needsMaint ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (asset.operatingHours / asset.thresholdHours) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry row */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Vibration Index</span>
                    <span className={`font-mono font-bold ${isHighVibe ? 'text-rose-600' : 'text-slate-700'}`}>
                      {asset.vibrationIndex.toFixed(1)} mm/s RMS
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Health Score</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {asset.healthScore}% Nominal
                    </span>
                  </div>
                </div>

                {/* Maintenance Due Note */}
                <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Next Service:</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    {new Date(asset.nextMaintenanceDue).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
