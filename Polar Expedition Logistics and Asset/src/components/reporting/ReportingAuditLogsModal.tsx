import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Search, Clock, FileText, Download, Filter, User } from 'lucide-react';
import { ReportingAuditLogRecord } from '../../types.ts';
import { fetchReportingAuditLogsApi } from '../../lib/api.ts';

interface ReportingAuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportingAuditLogsModal: React.FC<ReportingAuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ReportingAuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetchReportingAuditLogsApi()
      .then((data) => {
        if (isMounted) {
          setLogs(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch reporting audit logs:', err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesSearch = !search ||
      log.reportTitle.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.userRole.toLowerCase().includes(search.toLowerCase()) ||
      log.reportType.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reporting Module Audit Trail</h2>
              <p className="text-xs text-slate-500">Immutable ledger of report generations, queries, exports, and sensitivity access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, report title, or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'GENERATED', 'FILTERED', 'EXPORTED_CSV', 'EXPORTED_EXCEL', 'EXPORTED_PDF'].map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors ${
                  filterAction === act
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {act.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading security audit records...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No audit records found matching criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                    <th className="py-2.5 px-3 font-semibold">Report Title</th>
                    <th className="py-2.5 px-3 font-semibold">User / Role</th>
                    <th className="py-2.5 px-3 font-semibold">Records</th>
                    <th className="py-2.5 px-3 font-semibold">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const isExport = log.action.includes('EXPORT');
                    const badgeColor = isExport
                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                      : log.action === 'GENERATED'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <span className="block text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-900 block">{log.reportTitle}</span>
                          <span className="text-[10px] font-mono text-slate-400">{log.reportType}</span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <div>
                              <span className="font-medium text-slate-800 block text-[11px]">{log.userName}</span>
                              <span className="text-[9px] text-slate-500">{log.userRole}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700 font-semibold">{log.recordsCount}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{log.executionDurationMs}ms</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Displaying {filteredLogs.length} audit entries • Compliant with IT Act (GoI) 2000 Section 43A</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
