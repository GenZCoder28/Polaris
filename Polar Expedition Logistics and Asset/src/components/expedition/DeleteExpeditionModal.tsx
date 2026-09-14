import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  Layers 
} from 'lucide-react';
import { ExpeditionRecord, FutureModuleCounts, UserRole } from '../../types';
import { fetchExpeditionDetailApi, deleteExpeditionApi, updateExpeditionApi } from '../../lib/api';

interface DeleteExpeditionModalProps {
  isOpen: boolean;
  expedition: ExpeditionRecord | null;
  onClose: () => void;
  onDeleted: () => void;
  onStatusChanged: () => void;
  userRole: UserRole;
}

export const DeleteExpeditionModal: React.FC<DeleteExpeditionModalProps> = ({
  isOpen,
  expedition,
  onClose,
  onDeleted,
  onStatusChanged,
  userRole,
}) => {
  const isViewer = userRole === 'VIEWER';

  const [loading, setLoading] = useState(true);
  const [moduleCounts, setModuleCounts] = useState<FutureModuleCounts | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && expedition) {
      setLoading(true);
      setErrorMessage(null);
      fetchExpeditionDetailApi(expedition.expedition_id)
        .then((res) => {
          setModuleCounts(res.module_connections);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, expedition]);

  if (!isOpen || !expedition) return null;

  const totalRecords = moduleCounts
    ? (moduleCounts.personnel_count || 0) +
      (moduleCounts.teams_count || 0) +
      (moduleCounts.locations_count || 0) +
      (moduleCounts.cargo_count || 0) +
      (moduleCounts.shipments_count || 0) +
      (moduleCounts.inventory_count || 0) +
      (moduleCounts.assets_count || 0)
    : 0;

  const isProtected = totalRecords > 0 || expedition.status === 'Active' || expedition.status === 'Completed';

  const handleConfirmDelete = async () => {
    if (isViewer) {
      setErrorMessage('Viewer role is not authorized to delete expeditions.');
      return;
    }
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      await deleteExpeditionApi(expedition.expedition_id);
      onDeleted();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete expedition.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkStatus = async (targetStatus: string) => {
    if (isViewer) {
      setErrorMessage('Viewer role is not authorized to change status.');
      return;
    }
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      await updateExpeditionApi(expedition.expedition_id, { status: targetStatus });
      onStatusChanged();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to update status to ${targetStatus}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className={`p-5 text-white flex items-center justify-between ${
          isProtected ? 'bg-amber-600' : 'bg-red-600'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {isProtected ? <ShieldAlert className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isProtected ? 'Deletion Prohibited (Protected Record)' : 'Delete Expedition'}
              </h2>
              <p className="text-xs text-white/80 font-mono">
                {expedition.expedition_id} ({expedition.expedition_code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center text-slate-500">
              <Clock className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Checking referential operational constraints...</span>
            </div>
          ) : isProtected ? (
            /* Protected Case */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <p className="font-bold text-sm mb-1">
                  This expedition cannot be deleted because it contains associated operational records.
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  To protect mission integrity and historical research records, campaigns with associated personnel, teams, cargo, shipments, inventory, or active deployment records cannot be permanently destroyed.
                </p>
              </div>

              {/* Module counts breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Linked Operational Records:</span>
                  <span className="font-mono text-xs font-bold text-blue-700">{totalRecords} Total</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>Personnel: <strong className="font-mono">{moduleCounts?.personnel_count ?? 0}</strong></div>
                  <div>Teams: <strong className="font-mono">{moduleCounts?.teams_count ?? 0}</strong></div>
                  <div>Locations: <strong className="font-mono">{moduleCounts?.locations_count ?? 0}</strong></div>
                  <div>Cargo: <strong className="font-mono">{moduleCounts?.cargo_count ?? 0}</strong></div>
                  <div>Shipments: <strong className="font-mono">{moduleCounts?.shipments_count ?? 0}</strong></div>
                  <div>Inventory: <strong className="font-mono">{moduleCounts?.inventory_count ?? 0}</strong></div>
                  <div>Assets: <strong className="font-mono">{moduleCounts?.assets_count ?? 0}</strong></div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-2">
                <div className="font-semibold">Recommended Administrative Resolution:</div>
                <p className="text-xs text-blue-800">
                  Instead of deletion, you may mark this expedition as <strong>Cancelled</strong> or <strong>Completed</strong>:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {expedition.status !== 'Cancelled' && (
                    <button
                      id="btn-mark-cancelled-instead"
                      type="button"
                      onClick={() => handleMarkStatus('Cancelled')}
                      disabled={isProcessing || isViewer}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-2xs transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Mark as Cancelled Instead</span>
                    </button>
                  )}

                  {expedition.status !== 'Completed' && (
                    <button
                      id="btn-mark-completed-instead"
                      type="button"
                      onClick={() => handleMarkStatus('Completed')}
                      disabled={isProcessing || isViewer}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark as Completed Instead</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Unlinked Case - Confirmation */
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900">
                <p className="font-bold text-sm mb-1">
                  Are you sure you want to delete this expedition?
                </p>
                <p className="text-xs text-red-800 leading-relaxed">
                  Expedition <strong className="font-mono">{expedition.expedition_id} ({expedition.expedition_name})</strong> has 0 linked operational records and is in Planned status. This action will permanently remove it from the command registry.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors font-medium"
          >
            Close
          </button>

          {!isProtected && !loading && (
            <button
              id="btn-confirm-delete-expedition"
              type="button"
              onClick={handleConfirmDelete}
              disabled={isProcessing || isViewer}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Deleting...' : 'Confirm Deletion'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
