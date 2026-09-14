import React, { useState } from 'react';
import { 
  Truck, 
  Ship, 
  Plane, 
  Search, 
  Download, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Boxes 
} from 'lucide-react';
import { ShipmentReportItem } from '../../types.ts';

interface ShipmentTrackingAnalyticsViewProps {
  shipments: ShipmentReportItem[];
  onExport: (type: string) => void;
  loading: boolean;
}

export const ShipmentTrackingAnalyticsView: React.FC<ShipmentTrackingAnalyticsViewProps> = ({
  shipments,
  onExport,
  loading,
}) => {
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');

  const filtered = shipments.filter((s) => {
    const matchesMode = modeFilter === 'ALL' || s.mode === modeFilter;
    const q = (search || '').toLowerCase();
    const trk = (s.trackingNumber || '').toLowerCase();
    const car = (s.carrierName || '').toLowerCase();
    const orig = (s.originPort || '').toLowerCase();
    const dest = (s.destinationPort || '').toLowerCase();
    const vf = (s.vesselOrFlightNumber || '').toLowerCase();

    const matchesSearch = !q || trk.includes(q) || car.includes(q) || orig.includes(q) || dest.includes(q) || vf.includes(q);
    return matchesMode && matchesSearch;
  });

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'SEA':
        return <Ship className="w-4 h-4 text-blue-600" />;
      case 'AIR':
        return <Plane className="w-4 h-4 text-sky-600" />;
      case 'LAND':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      default:
        return <Truck className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and export bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracking #, vessel, flight, or port..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['ALL', 'SEA', 'AIR', 'LAND'].map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-3 py-1 text-xs rounded-md font-bold transition-colors ${
                  modeFilter === m
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={() => onExport('shipments')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Shipments</span>
          </button>
        </div>
      </div>

      {/* Shipments Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const hasDelay = s.delayDurationDays > 0;
          return (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-100">
                    {getModeIcon(s.mode)}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 block">{s.trackingNumber}</span>
                    <span className="text-[10px] text-slate-500">{s.carrierName} • {s.vesselOrFlightNumber}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  s.status === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : s.status === 'DELAYED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {s.status}
                </span>
              </div>

              {/* Route */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Origin</span>
                  <span className="font-semibold text-slate-800">{s.originPort}</span>
                </div>
                <div className="text-slate-300 font-bold">➔</div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Destination</span>
                  <span className="font-semibold text-slate-800">{s.destinationPort}</span>
                </div>
              </div>

              {/* Transit times & delays */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Expected</span>
                  <span className="font-bold text-slate-800 font-mono">{s.expectedTransitDays}d</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Actual</span>
                  <span className="font-bold text-slate-800 font-mono">{s.actualTransitDays || '—'}d</span>
                </div>
                <div className={`p-2 rounded-lg ${hasDelay ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>
                  <span className="text-[10px] block opacity-80">Delay</span>
                  <span className="font-bold font-mono">+{s.delayDurationDays}d</span>
                </div>
              </div>

              {/* Checkpoint & containers */}
              <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Last Checkpoint:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[180px]">{s.lastCheckpoint}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Manifest:</span>
                  <span className="font-mono text-blue-700 font-semibold">{s.containers.join(', ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
