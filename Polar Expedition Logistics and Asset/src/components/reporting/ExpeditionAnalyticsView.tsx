import React, { useState } from 'react';
import { 
  Compass, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Calendar, 
  Users, 
  Boxes, 
  Ship, 
  MapPin,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ExpeditionReportItem } from '../../types.ts';

interface ExpeditionAnalyticsViewProps {
  expeditions: ExpeditionReportItem[];
  onSelectExpedition: (id: string) => void;
  onExport: (type: string) => void;
  loading: boolean;
}

export const ExpeditionAnalyticsView: React.FC<ExpeditionAnalyticsViewProps> = ({
  expeditions,
  onSelectExpedition,
  onExport,
  loading,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = expeditions.filter((exp) => {
    const matchesStatus = statusFilter === 'ALL' || exp.status === statusFilter;
    const q = (search || '').toLowerCase();
    const name = (exp.expedition_name || '').toLowerCase();
    const code = (exp.expedition_code || '').toLowerCase();
    const leader = (exp.leader_name || '').toLowerCase();
    const matchesTarget = (exp.target_stations || []).some((s) => (s || '').toLowerCase().includes(q));

    const matchesSearch = !q || name.includes(q) || code.includes(q) || leader.includes(q) || matchesTarget;
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PLANNING':
      case 'PLANNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expeditions by code, title, station, or leader..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {['ALL', 'ACTIVE', 'PLANNING', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => onExport('expeditions')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Registry</span>
          </button>
        </div>
      </div>

      {/* Expeditions Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">Expedition</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Leader & Vessel</th>
                <th className="py-3 px-4 font-semibold">Target Stations</th>
                <th className="py-3 px-4 font-semibold">Duration Window</th>
                <th className="py-3 px-4 font-semibold">Personnel</th>
                <th className="py-3 px-4 font-semibold">Cargo (MT)</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">Loading expeditions registry...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">No expeditions found matching criteria.</td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                          {exp.expedition_code}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                            {exp.expedition_name}
                          </span>
                          <span className="text-[10px] text-slate-400">{exp.season_year} Season</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(exp.status)}`}>
                        {exp.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{exp.leader_name}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Ship className="w-3 h-3 text-slate-400" />
                        {exp.vessel_name || 'Vessel TBA'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {exp.target_stations.map((st) => (
                          <span key={st} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {st}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(exp.start_date).toLocaleDateString()} – {new Date(exp.end_date).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exp.personnelCount}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
                        <Boxes className="w-3.5 h-3.5 text-slate-400" />
                        <span>{(exp.totalCargoWeightKg / 1000).toFixed(1)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectExpedition(exp.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Deep Dossier</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
