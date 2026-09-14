import React, { useState } from 'react';
import { 
  AssetMaintenanceRecord, 
  AssetIncidentRecord, 
  AssetAuditLogRecord 
} from '../../types.ts';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  User, 
  Check, 
  FileText,
  Search,
  Filter
} from 'lucide-react';

// -------------------------------------------------------------
// 1. MAINTENANCE LIST VIEW
// -------------------------------------------------------------
interface AssetMaintenanceListViewProps {
  maintenanceList: AssetMaintenanceRecord[];
  onOpenScheduleModal: () => void;
}

export const AssetMaintenanceListView: React.FC<AssetMaintenanceListViewProps> = ({
  maintenanceList,
  onOpenScheduleModal
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filtered = maintenanceList.filter((m) => {
    if (filterStatus === 'ALL') return true;
    return m.maintenance_status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
              <Wrench className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Preventative & Corrective Maintenance Management
              </h3>
              <p className="text-xs text-slate-500">
                Scheduled service windows, overhaul records, and polar technician job logs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === st
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-2.5 px-3">Job Code</th>
                <th className="py-2.5 px-3">Asset & Type</th>
                <th className="py-2.5 px-3">Work Scope / Problem</th>
                <th className="py-2.5 px-3">Technician</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                <th className="py-2.5 px-3">Date Completed</th>
                <th className="py-2.5 px-3">Next Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {m.maintenance_code}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-blue-700 font-mono">{m.asset_id}</span>
                    <div className="text-[11px] text-slate-500 font-medium">{m.maintenance_type}</div>
                  </td>
                  <td className="py-3 px-3 max-w-sm">
                    <p className="font-semibold text-slate-800">{m.problem_description}</p>
                    <p className="text-[11px] text-slate-500 truncate">{m.work_performed}</p>
                    {m.parts_used && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Spares: {m.parts_used}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {m.technician_name}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      m.maintenance_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      m.maintenance_status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {m.maintenance_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {m.maintenance_date}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-amber-700">
                    {m.next_maintenance_date || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. INCIDENTS & DAMAGE DESK
// -------------------------------------------------------------
interface AssetIncidentsListViewProps {
  incidents: AssetIncidentRecord[];
  onTriggerResolveIncident: (incident: AssetIncidentRecord) => void;
}

export const AssetIncidentsListView: React.FC<AssetIncidentsListViewProps> = ({
  incidents,
  onTriggerResolveIncident
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filtered = incidents.filter((i) => {
    if (filterStatus === 'ALL') return true;
    return i.status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Damage & Polar Incident Reporting Desk
              </h3>
              <p className="text-xs text-slate-500">
                Tracking blizzard damage, mechanical stress failures, missing field gear, and investigation resolutions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'REPORTED', 'INVESTIGATING', 'RESOLVED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === st
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((inc) => {
          const isResolved = inc.status === 'RESOLVED';
          const isCrit = inc.severity === 'CRITICAL';
          const isHigh = inc.severity === 'HIGH';

          return (
            <div
              key={inc.id}
              className={`bg-white border rounded-xl p-5 transition space-y-3 shadow-xs ${
                isResolved ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 hover:border-rose-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm">
                      {inc.incident_code}
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-xs">
                      Asset: {inc.asset_id}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                      isCrit ? 'bg-rose-700 text-white' :
                      isHigh ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {inc.severity} SEVERITY
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {inc.incident_type}: {inc.description}
                  </h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Location: <strong>{inc.location}</strong> • Reported by: <strong>{inc.reported_by}</strong> on {inc.incident_date}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                    isResolved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {inc.status}
                  </span>

                  {!isResolved && (
                    <button
                      type="button"
                      onClick={() => onTriggerResolveIncident(inc)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolve & Clear Incident</span>
                    </button>
                  )}
                </div>
              </div>

              {inc.resolution_notes && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  <span className="font-bold block">Resolution & Return to Service:</span>
                  <p>{inc.resolution_notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. AUDIT TRAIL VIEW
// -------------------------------------------------------------
interface AssetAuditTrailViewProps {
  auditLogs: AssetAuditLogRecord[];
}

export const AssetAuditTrailView: React.FC<AssetAuditTrailViewProps> = ({ auditLogs }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Asset Governance & Tamper-Evident Audit Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Comprehensive immutable activity trail tracking registrations, assignments, transfers, and status transitions
              </p>
            </div>
          </div>
        </div>
        <span className="font-mono text-xs text-slate-500">{auditLogs.length} Audit Events</span>
      </div>

      <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Asset ID</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-4">Event Details</th>
                <th className="py-2.5 px-3 text-right">User / Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">
                    {log.asset_id}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-600">
                    {log.user_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
