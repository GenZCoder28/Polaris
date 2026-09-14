import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Shield, 
  MapPin, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail,
  AlertCircle
} from 'lucide-react';
import { PersonnelReportItem } from '../../types.ts';

interface PersonnelAnalyticsViewProps {
  personnel: PersonnelReportItem[];
  onExport: (type: string) => void;
  loading: boolean;
  userRole: string;
}

export const PersonnelAnalyticsView: React.FC<PersonnelAnalyticsViewProps> = ({
  personnel,
  onExport,
  loading,
  userRole,
}) => {
  const [search, setSearch] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');

  const filtered = personnel.filter((p) => {
    const q = (search || '').toLowerCase();
    const stFilter = (stationFilter || '').toLowerCase();
    const pStation = (p.station || '').toLowerCase();
    const pName = (p.name || '').toLowerCase();
    const pRole = (p.role || '').toLowerCase();
    const pSpec = (p.specialization || '').toLowerCase();

    const matchesStation = stationFilter === 'ALL' || pStation === stFilter;
    const matchesTeam = teamFilter === 'ALL' || p.team === teamFilter;
    const matchesSearch = !q || pName.includes(q) || pRole.includes(q) || pSpec.includes(q) || pStation.includes(q);
    return matchesStation && matchesTeam && matchesSearch;
  });

  const isMasked = userRole !== 'CENTRAL_ADMIN' && userRole !== 'LOGISTICS_OFFICER' && userRole !== 'Expedition Manager';

  return (
    <div className="space-y-4">
      {/* Top Banner & Security Disclosure */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Personnel Deployments & Medical Telemetry</h3>
            <p className="text-xs text-slate-500">
              Active station allocations, rotation rosters, and emergency dispatch contact registries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMasked && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>Contact fields masked (RBAC enforced)</span>
            </div>
          )}
          <button
            onClick={() => onExport('personnel')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roster by name, role, specialization, or base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Stations</option>
            <option value="bharati">Bharati Station</option>
            <option value="maitri">Maitri Station</option>
            <option value="himadri">Himadri Station</option>
            <option value="cape_town">Cape Town Transit</option>
            <option value="goa">Goa HQ</option>
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Teams</option>
            <option value="Scientific">Scientific</option>
            <option value="Logistics">Logistics</option>
            <option value="Medical">Medical</option>
            <option value="Technical">Technical</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">Personnel Name</th>
                <th className="py-3 px-4 font-semibold">Role / Team</th>
                <th className="py-3 px-4 font-semibold">Specialization</th>
                <th className="py-3 px-4 font-semibold">Station / Coordinates</th>
                <th className="py-3 px-4 font-semibold">Contact / Phone</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">Loading personnel manifest...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">No personnel found matching criteria.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {p.id}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{p.role}</div>
                      <span className="inline-block px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                        {p.team}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {p.specialization || 'Polar Operations'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.station}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.phone || '—'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {p.movementStatus || 'DEPLOYED'}
                      </span>
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
