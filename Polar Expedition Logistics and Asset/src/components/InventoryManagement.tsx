import React, { useState, useMemo } from 'react';
import { Station } from '../types';
import { INITIAL_INVENTORY_MASTER } from '../data/initialInventoryMaster';
import {
  Boxes,
  Fuel,
  Apple,
  HeartPulse,
  Wrench,
  FlaskConical,
  Search,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  ArrowUpDown,
  RefreshCw,
  Building2
} from 'lucide-react';

interface InventoryManagementProps {
  stations?: Station[];
  inventory?: any[];
  onUpdateStock?: (itemId: string, newStock: number) => void;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  stations = [],
}) => {
  // Station filter: only active Antarctic stations
  const [selectedStation, setSelectedStation] = useState<'bharati' | 'maitri'>('bharati');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local state initialized from master records
  const [stockItems, setStockItems] = useState(INITIAL_INVENTORY_MASTER);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Filtered by selected station
  const stationItems = useMemo(() => {
    return stockItems.filter(item => item.station_id === selectedStation);
  }, [stockItems, selectedStation]);

  // Filtered by search query
  const filteredItems = useMemo(() => {
    return stationItems.filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (item.item_name || (item as any).name || '').toLowerCase();
      const code = (item.item_code || (item as any).id || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return name.includes(q) || code.includes(q) || cat.includes(q) || desc.includes(q);
    });
  }, [stationItems, searchQuery]);

  // Statistics
  const totalItems = stationItems.length;
  const lowStockCount = stationItems.filter(i => i.current_quantity <= i.minimum_stock).length;
  const criticalCount = stationItems.filter(i => i.current_quantity <= i.safety_stock).length;
  const healthyCount = totalItems - lowStockCount;

  // Handlers to adjust stock
  const handleQuickAdjust = (id: number, delta: number) => {
    setStockItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.current_quantity + delta);
        const status = newQty <= item.safety_stock ? 'CRITICAL' : newQty <= item.minimum_stock ? 'LOW' : 'NORMAL';
        return {
          ...item,
          current_quantity: newQty,
          status,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    }));

    const adjustedItem = stockItems.find(i => i.id === id);
    if (adjustedItem) {
      showNotification(`${adjustedItem.item_name} updated (${delta > 0 ? '+' : ''}${delta} ${adjustedItem.unit})`);
    }
  };

  const getCategoryIcon = (cat?: string) => {
    switch ((cat || '').toLowerCase()) {
      case 'fuel':
        return <Fuel className="w-4 h-4 text-blue-600" />;
      case 'food':
        return <Apple className="w-4 h-4 text-emerald-600" />;
      case 'medical':
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case 'spares':
      case 'equipment':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      default:
        return <FlaskConical className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Module Header (Simple & Clean) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Boxes className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Station Inventory & Supply Levels
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Current stock balances, safety reserves, and daily consumption tracking
              </p>
            </div>
          </div>
        </div>

        {/* Station Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setSelectedStation('bharati')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              selectedStation === 'bharati'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bharati Station</span>
          </button>
          <button
            onClick={() => setSelectedStation('maitri')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              selectedStation === 'maitri'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Maitri Station</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics (Simple) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Tracked Items</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalItems}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active stock categories</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-700 block">Optimal Stock</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{healthyCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Above minimum reserve</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-amber-700 block">Low Stock Items</span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{lowStockCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Near reorder threshold</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-rose-700 block">Critical Reserves</span>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">{criticalCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">At emergency safety buffer</span>
        </div>
      </div>

      {/* Inventory Items List & Filter Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Search Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-700">
            Station Inventory Roster ({filteredItems.length} items)
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inventory items..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3">Item Description</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3 text-right">Safety Reserve</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredItems.map((item) => {
                const isLow = item.current_quantity <= item.minimum_stock;
                const isCritical = item.current_quantity <= item.safety_stock;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-medium text-slate-900">
                      <div>{item.item_name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.item_code}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(item.category)}
                        <span className="text-slate-700 font-medium">{item.category}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {item.current_quantity.toLocaleString()} <span className="text-[11px] font-sans font-normal text-slate-500">{item.unit}</span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {item.safety_stock.toLocaleString()} {item.unit}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isCritical
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isLow
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isCritical ? 'CRITICAL' : isLow ? 'LOW STOCK' : 'NOMINAL'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleQuickAdjust(item.id, -50)}
                          title="Log 50 units consumption"
                          className="p-1 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item.id, 100)}
                          title="Restock 100 units"
                          className="p-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No inventory records match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
