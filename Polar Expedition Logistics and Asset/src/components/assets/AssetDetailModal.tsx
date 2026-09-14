import React, { useState, useEffect } from 'react';
import { 
  AssetMasterRecord, 
  AssetFullHistoryResponse,
  ControlledAssetStatus,
  ControlledAssetCondition
} from '../../types.ts';
import { 
  Cpu, 
  Clock, 
  Calendar, 
  UserCheck, 
  Truck, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  FileText, 
  Download, 
  Copy, 
  X,
  Sparkles,
  History,
  Activity,
  Tag
} from 'lucide-react';

interface AssetDetailModalProps {
  assetId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerAssign: (asset: AssetMasterRecord) => void;
  onTriggerTransfer: (asset: AssetMasterRecord) => void;
  onTriggerMaintenance: (asset: AssetMasterRecord) => void;
  onTriggerIncident: (asset: AssetMasterRecord) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  assetId,
  isOpen,
  onClose,
  onTriggerAssign,
  onTriggerTransfer,
  onTriggerMaintenance,
  onTriggerIncident
}) => {
  const [historyData, setHistoryData] = useState<AssetFullHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!assetId || !isOpen) return;

    setLoading(true);
    fetch(`/api/assets/${encodeURIComponent(assetId)}/history`)
      .then(res => res.json())
      .then(data => {
        setHistoryData(data);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Notice fetching asset history:', err);
        setLoading(false);
      });
  }, [assetId, isOpen]);

  if (!isOpen || !assetId) return null;

  const asset = historyData?.asset;

  const copyQrPayload = () => {
    if (!asset) return;
    navigator.clipboard.writeText(asset.qr_payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-blue-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded-sm bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  {asset?.asset_id || assetId}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {asset?.asset_category || 'Expedition Asset'}
                </span>
              </div>
              <h3 className="text-base font-bold tracking-wide mt-0.5">
                {asset?.asset_name || 'Loading Asset Details...'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        {asset && (
          <div className="bg-slate-100/80 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Station: <strong>{asset.assigned_station.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Location: <strong>{asset.current_location}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onTriggerAssign(asset)}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-300 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1 transition shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Assign</span>
              </button>
              <button
                type="button"
                onClick={() => onTriggerTransfer(asset)}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-cyan-50 hover:border-cyan-300 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1 transition shadow-2xs"
              >
                <Truck className="w-3.5 h-3.5 text-cyan-600" />
                <span>Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => onTriggerMaintenance(asset)}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-300 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1 transition shadow-2xs"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>Log Maintenance</span>
              </button>
              <button
                type="button"
                onClick={() => onTriggerIncident(asset)}
                className="px-3 py-1 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-md flex items-center gap-1 transition shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Report Incident</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              Fetching complete telemetry, QR signature, and historical ledger...
            </div>
          ) : asset ? (
            <>
              {/* Top Overview: Specs + QR Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Specifications Grid */}
                <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Technical & Operational Master Record</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Serial Number</span>
                      <span className="font-mono font-bold text-slate-800">{asset.serial_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Manufacturer</span>
                      <span className="font-semibold text-slate-800">{asset.manufacturer}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Model Specification</span>
                      <span className="font-semibold text-slate-800">{asset.model}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Status</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        asset.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                        asset.status === 'ASSIGNED' || asset.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                        asset.status === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {asset.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Condition</span>
                      <span className="font-bold text-slate-800">{asset.condition}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Health Score</span>
                      <span className="font-mono font-bold text-blue-700">{asset.health_score}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Operating Run-Hours</span>
                      <span className="font-mono font-semibold text-slate-800">{asset.operating_hours} hrs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Service Interval Threshold</span>
                      <span className="font-mono font-semibold text-slate-800">{asset.maintenance_threshold_hours} hrs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Vibration Telemetry</span>
                      <span className="font-mono font-semibold text-slate-800">{asset.vibration_index} mm/s</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Assigned Team</span>
                      <span className="font-semibold text-slate-800">{asset.assigned_team || 'Station Reserve'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Assigned Custodian</span>
                      <span className="font-semibold text-slate-800">{asset.assigned_personnel || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Next Scheduled Service</span>
                      <span className="font-mono text-slate-800">{asset.next_maintenance_date || 'None'}</span>
                    </div>
                  </div>

                  {asset.notes && (
                    <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Special Instructions / Notes:</span> {asset.notes}
                    </div>
                  )}
                </div>

                {/* Equipment Identification Card */}
                <div className="bg-white border border-blue-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-sm">
                      Official NCPOR Asset Seal
                    </span>
                    <h5 className="text-xs font-bold text-slate-800 mt-2">Station Registry ID</h5>
                  </div>

                  <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                    <div className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>{asset.asset_id}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Serial: {asset.serial_number || 'NCPOR-EQUIP-STD'}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      Status: {asset.status} ({asset.condition})
                    </div>
                  </div>

                  <div className="w-full">
                    <button
                      type="button"
                      onClick={copyQrPayload}
                      className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? 'ID Copied!' : 'Copy Asset Identifier'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Chronological History Timeline (Section 13) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" />
                    <span>Complete Asset Lifecycle Timeline</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    {historyData.timeline.length} Recorded Lifecycle Events
                  </span>
                </div>

                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {historyData.timeline.map((event, idx) => {
                    const isMaint = event.eventType === 'MAINTENANCE';
                    const isInc = event.eventType === 'INCIDENT';
                    const isTrans = event.eventType === 'TRANSFER';
                    const isAssign = event.eventType === 'ASSIGNMENT';
                    const isReg = event.eventType === 'REGISTRATION';

                    return (
                      <div key={idx} className="relative pl-9 text-xs">
                        {/* Dot indicator */}
                        <div className={`absolute left-1.5 top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                          isInc ? 'border-rose-500 text-rose-500' :
                          isMaint ? 'border-amber-500 text-amber-500' :
                          isTrans ? 'border-cyan-500 text-cyan-500' :
                          isAssign ? 'border-blue-500 text-blue-500' :
                          'border-emerald-500 text-emerald-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isInc ? 'bg-rose-500' :
                            isMaint ? 'bg-amber-500' :
                            isTrans ? 'bg-cyan-500' :
                            isAssign ? 'bg-blue-500' :
                            'bg-emerald-500'
                          }`} />
                        </div>

                        <div className="bg-slate-50 hover:bg-blue-50/40 border border-slate-200 rounded-xl p-3 transition space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isInc ? 'bg-rose-100 text-rose-800' :
                                isMaint ? 'bg-amber-100 text-amber-800' :
                                isTrans ? 'bg-cyan-100 text-cyan-800' :
                                isAssign ? 'bg-blue-100 text-blue-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {event.eventType}
                              </span>
                              <span>{event.title}</span>
                            </span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              {event.timestamp.slice(0, 10)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed">{event.details}</p>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Logged by: {event.actor}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500">Asset record not found.</div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
