import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Calendar, 
  MapPin, 
  User, 
  ArrowRight, 
  Plus, 
  Search, 
  Building2,
  ShieldAlert,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ExpeditionRecord, DashboardStats, UserRole } from '../../types';

interface ExpeditionDashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateToList: (filter?: { status?: string; q?: string }) => void;
  onOpenCreate: () => void;
  onSelectExpedition: (id: string) => void;
  userRole: UserRole;
}

export const ExpeditionDashboard: React.FC<ExpeditionDashboardProps> = ({
  stats,
  loading,
  onRefresh,
  onNavigateToList,
  onOpenCreate,
  onSelectExpedition,
  userRole
}) => {
  const isViewer = userRole === 'VIEWER';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Filtered expeditions for the scalable registry
  const filteredExpeditions = useMemo(() => {
    const list = stats?.recent_expeditions || [];
    return list.filter((e) => {
      if (statusFilter !== 'ALL' && e.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchId = e.expedition_id.toLowerCase().includes(q);
        const matchName = e.expedition_name.toLowerCase().includes(q);
        const matchCode = e.expedition_code.toLowerCase().includes(q);
        const matchLeader = (e.expedition_leader || '').toLowerCase().includes(q);
        const matchRegion = (e.target_region || '').toLowerCase().includes(q);
        const matchYear = String(e.expedition_year).includes(q);
        return matchId || matchName || matchCode || matchLeader || matchRegion || matchYear;
      }
      return true;
    });
  }, [stats?.recent_expeditions, statusFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredExpeditions.length / pageSize));
  const paginatedExpeditions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpeditions.slice(start, start + pageSize);
  }, [filteredExpeditions, currentPage, pageSize]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full opacity-10 pointer-events-none flex items-center justify-center">
          <Compass className="w-80 h-80 text-white" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
            Antarctic Expedition Planning & Management
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-dashboard-new-expedition"
              onClick={onOpenCreate}
              disabled={isViewer}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isViewer
                  ? 'bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-600'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow active:scale-95'
              }`}
              title={isViewer ? 'Viewer role cannot create expeditions' : 'Create new expedition'}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Expedition</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Expeditions */}
        <div 
          onClick={() => handleStatusFilterChange('ALL')}
          className={`bg-white p-4 rounded-xl border shadow-xs transition-all cursor-pointer group ${
            statusFilter === 'ALL' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Expeditions</span>
            <Compass className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {loading ? '...' : (stats?.total_expeditions ?? 0)}
          </div>
        </div>

        {/* Planned */}
        <div 
          onClick={() => handleStatusFilterChange('Planned')}
          className={`bg-white p-4 rounded-xl border shadow-xs transition-all cursor-pointer group ${
            statusFilter === 'Planned' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200 hover:border-amber-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Planned</span>
            <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {loading ? '...' : (stats?.planned_expeditions ?? 0)}
          </div>
        </div>

        {/* Approved */}
        <div 
          onClick={() => handleStatusFilterChange('Approved')}
          className={`bg-white p-4 rounded-xl border shadow-xs transition-all cursor-pointer group ${
            statusFilter === 'Approved' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-mono">
            {loading ? '...' : (stats?.approved_expeditions ?? 0)}
          </div>
        </div>

        {/* Active */}
        <div 
          onClick={() => handleStatusFilterChange('Active')}
          className={`bg-white p-4 rounded-xl border shadow-xs transition-all cursor-pointer group ${
            statusFilter === 'Active' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Active</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono">
            {loading ? '...' : (stats?.active_expeditions ?? 0)}
          </div>
        </div>

        {/* Completed */}
        <div 
          onClick={() => handleStatusFilterChange('Completed')}
          className={`bg-white p-4 rounded-xl border shadow-xs transition-all cursor-pointer group ${
            statusFilter === 'Completed' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {loading ? '...' : (stats?.completed_expeditions ?? 0)}
          </div>
        </div>

        {/* Cancelled */}
        <div 
          onClick={() => handleStatusFilterChange('Cancelled')}
          className={`bg-white p-4 rounded-xl border shadow-xs transition-all cursor-pointer group ${
            statusFilter === 'Cancelled' ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 hover:border-red-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Cancelled</span>
            <XCircle className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono">
            {loading ? '...' : (stats?.cancelled_expeditions ?? 0)}
          </div>
        </div>
      </div>

      {/* Recent Expeditions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <button
            onClick={() => onNavigateToList()}
            className="flex items-center gap-2 group cursor-pointer text-left select-none"
            title="Open complete Expedition Registry & Search"
          >
            <Calendar className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <span>Recent Expeditions Registry</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </h2>
            <span className="text-xs bg-blue-100 text-blue-800 font-mono font-bold px-2 py-0.5 rounded-full">
              {filteredExpeditions.length} record{filteredExpeditions.length !== 1 ? 's' : ''}
            </span>
          </button>
        </div>

        {/* Toolbar with Search, Page size */}
        <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by ID, Code, Name, Region, Leader..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 self-end md:self-auto">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value={6}>6 rows</option>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Expedition ID</th>
                <th className="px-4 py-3">Code & Name</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Target Region</th>
                <th className="px-4 py-3">Leader</th>
                <th className="px-4 py-3">Timeline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedExpeditions && paginatedExpeditions.length > 0 ? (
                paginatedExpeditions.map((e) => (
                  <tr 
                    key={e.id}
                    onClick={() => onSelectExpedition(e.expedition_id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-blue-700">
                      {e.expedition_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{e.expedition_name}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{e.expedition_code}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {e.expedition_year}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-slate-800">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {e.target_region}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {e.expedition_leader}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {e.start_date} → {e.end_date}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        e.status === 'Active' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        e.status === 'Approved' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        e.status === 'Planned' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        e.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onSelectExpedition(e.expedition_id);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 rounded transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    <p className="font-medium text-slate-600">No expeditions found matching current filters.</p>
                    {(searchTerm || statusFilter !== 'ALL') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('ALL');
                        }}
                        className="mt-2 text-xs text-blue-600 hover:underline inline-block"
                      >
                        Reset filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-800">{Math.min((currentPage - 1) * pageSize + 1, filteredExpeditions.length)}</span> to{' '}
              <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, filteredExpeditions.length)}</span> of{' '}
              <span className="font-semibold text-slate-800">{filteredExpeditions.length}</span> expeditions
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                    currentPage === num
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
