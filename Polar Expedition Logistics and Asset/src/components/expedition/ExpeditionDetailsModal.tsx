import React, { useState, useEffect } from 'react';
import { 
  X, 
  Compass, 
  MapPin, 
  Calendar, 
  Building2, 
  User, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Layers, 
  ShieldCheck, 
  History, 
  Users, 
  Package, 
  Ship, 
  Boxes, 
  Cpu, 
  Navigation,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { ExpeditionRecord, FutureModuleCounts, ExpeditionAuditLog, UserRole } from '../../types';
import { fetchExpeditionDetailApi, updateExpeditionApi } from '../../lib/api';

interface ExpeditionDetailsModalProps {
  isOpen: boolean;
  expeditionId: string | null;
  onClose: () => void;
  onOpenEdit: (exp: ExpeditionRecord) => void;
  onOpenDelete: (exp: ExpeditionRecord) => void;
  onStatusChanged: () => void;
  userRole: UserRole;
}

export const ExpeditionDetailsModal: React.FC<ExpeditionDetailsModalProps> = ({
  isOpen,
  expeditionId,
  onClose,
  onOpenEdit,
  onOpenDelete,
  onStatusChanged,
  userRole,
}) => {
  const isViewer = userRole === 'VIEWER';

  const [activeTab, setActiveTab] = useState<'info' | 'modules' | 'audit'>('info');
  const [loading, setLoading] = useState<boolean>(true);
  const [expedition, setExpedition] = useState<ExpeditionRecord | null>(null);
  const [moduleCounts, setModuleCounts] = useState<FutureModuleCounts | null>(null);
  const [auditLogs, setAuditLogs] = useState<ExpeditionAuditLog[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const loadData = async () => {
    if (!expeditionId) return;
    try {
      setLoading(true);
      setActionError(null);
      const res = await fetchExpeditionDetailApi(expeditionId);
      setExpedition(res.expedition);
      setModuleCounts(res.module_connections);
      setAuditLogs(res.audit_logs || []);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load expedition details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && expeditionId) {
      loadData();
    }
  }, [isOpen, expeditionId]);

  if (!isOpen || !expeditionId) return null;

  const handleStatusTransition = async (targetStatus: string) => {
    if (!expedition) return;
    if (isViewer) {
      setActionError('Viewer role is not authorized to transition expedition status.');
      return;
    }
    try {
      setIsTransitioning(true);
      setActionError(null);
      await updateExpeditionApi(expedition.expedition_id, { status: targetStatus });
      await loadData();
      onStatusChanged();
    } catch (err: any) {
      setActionError(err.message || 'Status transition failed.');
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  {expedition?.expedition_id || expeditionId}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                  {expedition?.expedition_code}
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  Year {expedition?.expedition_year}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  expedition?.status === 'Active' ? 'bg-blue-500 text-white animate-pulse' :
                  expedition?.status === 'Approved' ? 'bg-indigo-500 text-white' :
                  expedition?.status === 'Planned' ? 'bg-amber-500 text-white' :
                  expedition?.status === 'Completed' ? 'bg-emerald-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  ● {expedition?.status}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {expedition?.expedition_name || 'Expedition Command Dossier'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {expedition?.target_region}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  {expedition?.expedition_leader}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  {expedition?.start_date} → {expedition?.end_date}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workflow Action Bar */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Status Workflow:</span>
              {expedition?.status === 'Planned' && (
                <>
                  <button
                    id="btn-transition-approve"
                    onClick={() => handleStatusTransition('Approved')}
                    disabled={isViewer || isTransitioning}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-xs transition-colors disabled:opacity-50"
                    title={isViewer ? 'Viewer role cannot approve' : 'Grant operational clearance'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Expedition</span>
                  </button>
                  <button
                    id="btn-transition-cancel"
                    onClick={() => handleStatusTransition('Cancelled')}
                    disabled={isViewer || isTransitioning}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              {expedition?.status === 'Approved' && (
                <>
                  <button
                    id="btn-transition-activate"
                    onClick={() => handleStatusTransition('Active')}
                    disabled={isViewer || isTransitioning}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs transition-colors disabled:opacity-50"
                    title={isViewer ? 'Viewer role cannot activate' : 'Deploy team into field'}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Activate Expedition (Field Phase)</span>
                  </button>
                  <button
                    id="btn-transition-cancel"
                    onClick={() => handleStatusTransition('Cancelled')}
                    disabled={isViewer || isTransitioning}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              {expedition?.status === 'Active' && (
                <>
                  <button
                    id="btn-transition-complete"
                    onClick={() => handleStatusTransition('Completed')}
                    disabled={isViewer || isTransitioning}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs transition-colors disabled:opacity-50"
                    title={isViewer ? 'Viewer role cannot complete' : 'Mark mission completed'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Completed</span>
                  </button>
                  <button
                    id="btn-transition-cancel"
                    onClick={() => handleStatusTransition('Cancelled')}
                    disabled={isViewer || isTransitioning}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              {(expedition?.status === 'Completed' || expedition?.status === 'Cancelled') && (
                <span className="text-xs text-slate-400 font-mono italic">
                  Terminal state (No further transitions allowed)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-details-edit"
                onClick={() => expedition && onOpenEdit(expedition)}
                disabled={isViewer}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isViewer
                    ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                }`}
                title={isViewer ? 'Viewer cannot edit' : 'Edit Expedition'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                id="btn-details-delete"
                onClick={() => expedition && onOpenDelete(expedition)}
                disabled={isViewer}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isViewer
                    ? 'bg-red-950/20 text-red-300/40 cursor-not-allowed'
                    : 'bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-400/30'
                }`}
                title={isViewer ? 'Viewer cannot delete' : 'Delete Expedition'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="border-b border-slate-200 px-6 bg-slate-50 flex items-center gap-4 text-xs font-semibold text-slate-600">
          <button
            id="tab-expedition-info"
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Expedition Dossier</span>
          </button>

          <button
            id="tab-expedition-modules"
            onClick={() => setActiveTab('modules')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'modules'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Future Connected Modules</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono">
              7 Links
            </span>
          </button>

          <button
            id="tab-expedition-audit"
            onClick={() => setActiveTab('audit')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Clock className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Loading expedition dossier...</span>
            </div>
          ) : !expedition ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Expedition not found.
            </div>
          ) : (
            <>
              {/* TAB 1: Expedition Information */}
              {activeTab === 'info' && (
                <div className="space-y-6 text-xs">
                  {/* Grid of Key Properties */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-slate-500 text-[11px] font-medium mb-1">Expedition ID</div>
                      <div className="font-mono font-bold text-blue-700 text-sm">{expedition.expedition_id}</div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-slate-500 text-[11px] font-medium mb-1">Expedition Code</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">{expedition.expedition_code}</div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-slate-500 text-[11px] font-medium mb-1">Operational Year</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">{expedition.expedition_year}</div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-slate-500 text-[11px] font-medium mb-1">Current Lifecycle</div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        {expedition.status}
                      </div>
                    </div>
                  </div>

                  {/* Operational Leadership & Deployment */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="text-slate-500 font-medium flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>Target Region</span>
                      </div>
                      <div className="font-semibold text-slate-900 text-sm pt-1">
                        {expedition.target_region}
                      </div>
                      <div className="text-slate-500 text-[11px]">Station / Continental Sector</div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Lead Organization</span>
                      </div>
                      <div className="font-semibold text-slate-900 text-sm pt-1">
                        {expedition.lead_organization}
                      </div>
                      <div className="text-slate-500 text-[11px]">Executing Research Institute</div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="text-slate-500 font-medium flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-600" />
                        <span>Expedition Leader</span>
                      </div>
                      <div className="font-semibold text-slate-900 text-sm pt-1">
                        {expedition.expedition_leader}
                      </div>
                      <div className="text-slate-500 text-[11px]">Commanding Field Scientist</div>
                    </div>
                  </div>

                  {/* Deployment Timeline */}
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>Antarctic Deployment Window</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Approved operational field schedule
                      </div>
                    </div>
                    <div className="font-mono text-xs font-bold text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs">
                      {expedition.start_date} → {expedition.end_date}
                    </div>
                  </div>

                  {/* Mission Objective */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Mission Objectives</span>
                    </h3>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {expedition.mission_objective || 'No mission objectives recorded.'}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900">Expedition Scope & Description</h3>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {expedition.description || 'No detailed scope description provided.'}
                    </div>
                  </div>

                  {/* Logistics Notes */}
                  {expedition.notes && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900">Logistics & Diplomatic Directives</h3>
                      <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-amber-900 leading-relaxed whitespace-pre-wrap">
                        {expedition.notes}
                      </div>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div>Created by: {expedition.created_by || 'System'} ({expedition.created_at ? new Date(expedition.created_at).toLocaleString() : ''})</div>
                    <div>Last updated: {expedition.updated_by || 'System'} ({expedition.updated_at ? new Date(expedition.updated_at).toLocaleString() : ''})</div>
                  </div>
                </div>
              )}

              {/* TAB 2: Future Connected Modules */}
              {activeTab === 'modules' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-slate-700">
                    <p className="font-semibold text-blue-900 mb-1">
                      Relational Module Connections (Database Schema Ready)
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      The Expedition Planning module maintains relational foreign key connections referencing <code className="font-mono text-blue-800 font-bold">{expedition.expedition_id}</code>. Future operational modules link here to provide comprehensive mission visibility.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Personnel */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-medium">Personnel</span>
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {moduleCounts?.personnel_count ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Scientists & wintering staff</div>
                    </div>

                    {/* Teams */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-medium">Teams</span>
                        <Users className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {moduleCounts?.teams_count ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Glaciology, drilling, tech</div>
                    </div>

                    {/* Locations */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-medium">Locations</span>
                        <Navigation className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {moduleCounts?.locations_count ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Field camps & GPS stations</div>
                    </div>

                    {/* Cargo */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-medium">Cargo Items</span>
                        <Package className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {moduleCounts?.cargo_count ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Manifested containers</div>
                    </div>

                    {/* Shipments */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-medium">Shipments</span>
                        <Ship className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {moduleCounts?.shipments_count ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Icebreaker voyage charters</div>
                    </div>

                    {/* Inventory */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-medium">Inventory Items</span>
                        <Boxes className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {moduleCounts?.inventory_count ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Rations, fuel, medicine</div>
                    </div>

                    {/* Assets */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-medium">Assets</span>
                        <Cpu className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-slate-900">
                        {moduleCounts?.assets_count ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">PistenBullys, gensets, labs</div>
                    </div>
                  </div>

                  {/* Schema Integration Notice */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-4">
                    <h4 className="font-bold text-slate-900">Relational Integrity & Schema Design</h4>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      All 7 tables (<code className="font-mono text-blue-700">expedition_personnel</code>, <code className="font-mono text-blue-700">expedition_teams</code>, <code className="font-mono text-blue-700">expedition_locations</code>, <code className="font-mono text-blue-700">expedition_cargo</code>, <code className="font-mono text-blue-700">expedition_shipments</code>, <code className="font-mono text-blue-700">expedition_inventory</code>, <code className="font-mono text-blue-700">expedition_assets</code>) enforce foreign keys to <code className="font-mono text-blue-700">expeditions.expedition_id</code>. When those modules are integrated, their live tallies automatically appear here without any architectural refactoring.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: Audit Trail */}
              {activeTab === 'audit' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">Immutable Audit Log</span>
                      <span className="text-[11px] text-slate-500 ml-2">Every creation, update, and status change is permanently recorded.</span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {auditLogs.length} Records
                    </span>
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      No audit events logged yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Timestamp (UTC)</th>
                            <th className="px-4 py-2.5">Action</th>
                            <th className="px-4 py-2.5">User</th>
                            <th className="px-4 py-2.5">Role</th>
                            <th className="px-4 py-2.5">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                                {log?.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  log.action === 'CREATED' ? 'bg-emerald-100 text-emerald-800' :
                                  log.action === 'APPROVED' ? 'bg-indigo-100 text-indigo-800' :
                                  log.action === 'ACTIVATED' ? 'bg-blue-100 text-blue-800' :
                                  log.action === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                  log.action === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                  log.action === 'DELETE_ATTEMPTED' ? 'bg-amber-100 text-amber-800' :
                                  'bg-slate-100 text-slate-800'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-medium text-slate-900">
                                <div>{log.user_name}</div>
                                <div className="text-[10px] text-slate-400">{log.user_email}</div>
                              </td>
                              <td className="px-4 py-2.5 text-slate-600">
                                {log.user_role}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 max-w-sm">
                                {log.details}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
