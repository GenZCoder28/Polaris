import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Plus, 
  Calendar, 
  MapPin, 
  Building2, 
  User, 
  Edit3, 
  Trash2, 
  Eye, 
  RefreshCw,
  AlertTriangle,
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  XCircle,
  Compass,
  ArrowLeft
} from 'lucide-react';
import { ExpeditionRecord, ExpeditionFilterParams, UserRole } from '../../types';

interface ExpeditionListProps {
  expeditions: ExpeditionRecord[];
  loading: boolean;
  filterParams: ExpeditionFilterParams;
  onFilterChange: (newFilters: Partial<ExpeditionFilterParams>) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onSelectExpedition: (id: string) => void;
  onOpenEdit: (expedition: ExpeditionRecord) => void;
  onOpenDelete: (expedition: ExpeditionRecord) => void;
  userRole: UserRole;
  onBackToDashboard?: () => void;
}

export const ExpeditionList: React.FC<ExpeditionListProps> = ({
  expeditions,
  loading,
  filterParams,
  onFilterChange,
  onResetFilters,
  onRefresh,
  onOpenCreate,
  onSelectExpedition,
  onOpenEdit,
  onOpenDelete,
  userRole,
  onBackToDashboard
}) => {
  const isViewer = userRole === 'VIEWER';
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Derive distinct regions and organizations from current data
  const distinctRegions = useMemo(() => {
    const set = new Set<string>();
    expeditions.forEach(e => {
      if (e.target_region) set.add(e.target_region);
    });
    return Array.from(set).sort();
  }, [expeditions]);

  const distinctYears = useMemo(() => {
    const set = new Set<number>();
    expeditions.forEach(e => {
      if (e.expedition_year) set.add(e.expedition_year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [expeditions]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterParams.q) count++;
    if (filterParams.status && filterParams.status !== 'ALL') count++;
    if (filterParams.year) count++;
    if (filterParams.target_region && filterParams.target_region !== 'ALL') count++;
    if (filterParams.lead_organization && filterParams.lead_organization !== 'ALL') count++;
    if (filterParams.start_date) count++;
    if (filterParams.end_date) count++;
    return count;
  }, [filterParams]);

  const handleStartDateChange = (val: string) => {
    if (filterParams.end_date && val && val > filterParams.end_date) {
      setDateError('Start date cannot be after end date.');
    } else {
      setDateError(null);
    }
    onFilterChange({ start_date: val });
  };

  const handleEndDateChange = (val: string) => {
    if (filterParams.start_date && val && val < filterParams.start_date) {
      setDateError('End date cannot be before start date.');
    } else {
      setDateError(null);
    }
    onFilterChange({ end_date: val });
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Return to Expedition Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <span>Expedition Registry & Search</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Search, filter, and monitor polar campaigns across all operational lifecycles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-list-refresh"
            onClick={onRefresh}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="input-expedition-search"
              type="text"
              placeholder='Search by name, ID, code (e.g. "Bharat", "2026", "ISEA-44", "Larsemann")...'
              value={filterParams.q || ''}
              onChange={(e) => onFilterChange({ q: e.target.value })}
              className="w-full pl-9.5 pr-8 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
            />
            {filterParams.q && (
              <button
                onClick={() => onFilterChange({ q: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
            {['ALL', 'Planned', 'Approved', 'Active', 'Completed', 'Cancelled'].map((st) => {
              const isActive = (filterParams.status || 'ALL') === st;
              return (
                <button
                  key={st}
                  id={`filter-status-${st.toLowerCase()}`}
                  onClick={() => onFilterChange({ status: st === 'ALL' ? 'ALL' : st })}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Statuses' : st}
                </button>
              );
            })}
          </div>

          {/* Toggle Advanced Filters */}
          <button
            id="btn-toggle-advanced-filters"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              showAdvancedFilters || activeFilterCount > 1
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold inline-flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              id="btn-clear-all-filters"
              onClick={() => {
                setDateError(null);
                onResetFilters();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Reset all search queries and filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50/50 p-3 rounded-lg">
            {/* Year */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expedition Year
              </label>
              <select
                id="select-filter-year"
                value={filterParams.year || ''}
                onChange={(e) => onFilterChange({ year: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {distinctYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Target Region */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Region
              </label>
              <select
                id="select-filter-region"
                value={filterParams.target_region || ''}
                onChange={(e) => onFilterChange({ target_region: e.target.value || undefined })}
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Regions</option>
                {distinctRegions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Commencement On/After
              </label>
              <input
                id="input-filter-start-date"
                type="date"
                value={filterParams.start_date || ''}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Conclusion On/Before
              </label>
              <input
                id="input-filter-end-date"
                type="date"
                value={filterParams.end_date || ''}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {dateError && (
              <div className="col-span-full text-red-600 text-xs flex items-center gap-1.5 font-medium bg-red-50 p-2 rounded border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{dateError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Header / Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <strong className="text-slate-900">{expeditions.length}</strong> expeditions
          {activeFilterCount > 0 && <span> (filtered)</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Approved
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Planned
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Cancelled
          </span>
        </div>
      </div>

      {/* Expeditions Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Expedition ID</th>
                <th className="px-4 py-3.5">Expedition Title & Code</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">Target Region</th>
                <th className="px-4 py-3.5">Leader & Organization</th>
                <th className="px-4 py-3.5">Operational Window</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading expedition registry...</span>
                  </td>
                </tr>
              ) : expeditions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 mb-2" />
                    <p className="font-semibold text-slate-800">No expeditions found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting your search criteria or resetting filters.
                    </p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={onResetFilters}
                        className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-xs"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                expeditions.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => onSelectExpedition(e.expedition_id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {e.expedition_id}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {e.expedition_name}
                      </div>
                      <div className="font-mono text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded">{e.expedition_code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-800">
                      {e.expedition_year}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-slate-900 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{e.target_region}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="font-medium text-slate-900">{e.expedition_leader}</div>
                      <div className="text-slate-500 text-[11px] truncate">{e.lead_organization}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      <div>{e.start_date}</div>
                      <div className="text-slate-400">to {e.end_date}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        e.status === 'Active' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        e.status === 'Approved' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        e.status === 'Planned' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        e.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {e.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                        {e.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                        {e.status === 'Cancelled' && <XCircle className="w-3 h-3 text-red-700" />}
                        {e.status === 'Planned' && <Clock className="w-3 h-3 text-amber-700" />}
                        <span>{e.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          id={`btn-view-${e.expedition_id}`}
                          onClick={() => onSelectExpedition(e.expedition_id)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details & Telemetry"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          id={`btn-edit-${e.expedition_id}`}
                          onClick={() => onOpenEdit(e)}
                          disabled={isViewer}
                          className={`p-1.5 rounded transition-colors ${
                            isViewer
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          title={isViewer ? 'Viewer cannot edit' : 'Edit Expedition'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          id={`btn-delete-${e.expedition_id}`}
                          onClick={() => onOpenDelete(e)}
                          disabled={isViewer}
                          className={`p-1.5 rounded transition-colors ${
                            isViewer
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={isViewer ? 'Viewer cannot delete' : 'Delete Expedition'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
