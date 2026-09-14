import React, { useState, useEffect } from 'react';
import { 
  AssetSupplyRequestRecord, 
  AssetNotificationRecord, 
  AssetPredictionRecord,
  IndiaOfficerConfig
} from '../../types.ts';
import { 
  Send, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  Ship, 
  Package, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Truck, 
  Clock, 
  User, 
  Settings,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface AssetSupplyWorkflowViewProps {
  onRefreshMasterAssets: () => void;
  initialCategory?: string;
  initialShortage?: number;
}

export const AssetSupplyWorkflowView: React.FC<AssetSupplyWorkflowViewProps> = ({
  onRefreshMasterAssets,
  initialCategory,
  initialShortage
}) => {
  const [requests, setRequests] = useState<AssetSupplyRequestRecord[]>([]);
  const [notifications, setNotifications] = useState<AssetNotificationRecord[]>([]);
  const [officerConfig, setOfficerConfig] = useState<IndiaOfficerConfig | null>(null);
  const [predictions, setPredictions] = useState<AssetPredictionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // New Request Form state
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [reqCategory, setReqCategory] = useState(initialCategory || 'Generators');
  const [reqStation, setReqStation] = useState('bharati');
  const [reqQuantity, setReqQuantity] = useState(initialShortage || 3);
  const [reqUrgency, setReqUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [reqJustification, setReqJustification] = useState('ML requirement forecast predicts deficit for winter-over life support redundancy.');

  // Approval Modal state
  const [selectedForApproval, setSelectedForApproval] = useState<AssetSupplyRequestRecord | null>(null);
  const [approvalContainer, setApprovalContainer] = useState('CNT-1024');
  const [approvalVessel, setApprovalVessel] = useState('MV Vasiliy Golovnin');
  const [approvalPort, setApprovalPort] = useState('Mormugao Port Berth 9, Goa');

  // Receive Modal state
  const [selectedForReceive, setSelectedForReceive] = useState<AssetSupplyRequestRecord | null>(null);
  const [receiveLocation, setReceiveLocation] = useState('Bharati Logistics Apron');
  const [receiveTechnician, setReceiveTechnician] = useState('Vikram Malhotra (Heavy Mech)');

  // Notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchSupplyData = async () => {
    setLoading(true);
    try {
      const [reqRes, notifRes, confRes, predRes] = await Promise.allSettled([
        fetch('/api/assets/supply-requests'),
        fetch('/api/assets/notifications'),
        fetch('/api/assets/officer-config'),
        fetch('/api/assets/predictions')
      ]);

      if (reqRes.status === 'fulfilled' && reqRes.value.ok) {
        const data = await reqRes.value.json().catch(() => null);
        if (Array.isArray(data)) setRequests(data);
      }
      if (notifRes.status === 'fulfilled' && notifRes.value.ok) {
        const data = await notifRes.value.json().catch(() => null);
        if (Array.isArray(data)) setNotifications(data);
      }
      if (confRes.status === 'fulfilled' && confRes.value.ok) {
        const data = await confRes.value.json().catch(() => null);
        if (data) setOfficerConfig(data);
      }
      if (predRes.status === 'fulfilled' && predRes.value.ok) {
        const data = await predRes.value.json().catch(() => null);
        const list = Array.isArray(data) ? data : (Array.isArray(data?.predictions) ? data.predictions : []);
        if (list.length > 0) setPredictions(list);
      }
    } catch (e: any) {
      console.warn('Notice fetching supply workflow data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplyData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/assets/supply-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station: reqStation,
          assetCategory: reqCategory,
          quantity: Number(reqQuantity),
          urgency: reqUrgency,
          justification: reqJustification
        })
      });

      if (res.ok) {
        setIsCreatingRequest(false);
        setToastMessage('Asset Supply Request submitted and routed to India Logistics Officer.');
        fetchSupplyData();
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      setToastMessage(`Error: ${err.message}`);
    }
  };

  const handleApprove = async () => {
    if (!selectedForApproval) return;
    try {
      const res = await fetch(`/api/assets/supply-requests/${selectedForApproval.request_code}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedContainer: approvalContainer,
          assignedVessel: approvalVessel,
          departurePort: approvalPort
        })
      });

      if (res.ok) {
        setSelectedForApproval(null);
        setToastMessage(`Supply Request ${selectedForApproval.request_code} APPROVED and assigned to ${approvalContainer}.`);
        fetchSupplyData();
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      setToastMessage(`Approval error: ${err.message}`);
    }
  };

  const handleReceive = async () => {
    if (!selectedForReceive) return;
    try {
      const res = await fetch(`/api/assets/supply-requests/${selectedForReceive.request_code}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: receiveLocation,
          technician: receiveTechnician
        })
      });

      if (res.ok) {
        setSelectedForReceive(null);
        setToastMessage(`Equipment received! Auto-registered ${selectedForReceive.quantity_requested} items into Master Registry and resolved alerts.`);
        fetchSupplyData();
        onRefreshMasterAssets();
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err: any) {
      setToastMessage(`Receive error: ${err.message}`);
    }
  };

  const handleManualDispatchNotification = async (req: AssetSupplyRequestRecord) => {
    try {
      const res = await fetch('/api/assets/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertType: 'SHORTAGE_ALERT',
          params: {
            station: req.station,
            category: req.asset_category,
            requiredCount: req.quantity_requested + 5,
            availableCount: 5,
            additionalRequirement: req.quantity_requested,
            expeditionId: 'EXP-2025-044'
          }
        })
      });

      if (res.ok) {
        setToastMessage(`Urgent dispatch sent to India Logistics Officer (${officerConfig?.assetOfficerName}).`);
        fetchSupplyData();
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      setToastMessage(`Dispatch error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-3.5 bg-blue-900 text-white border border-blue-400 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-blue-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & Responsible Logistics Officer Banner */}
      <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <Ship className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Antarctic Asset Resupply & Logistics Officer Dispatch Desk
              </h3>
              <p className="text-xs text-slate-500">
                Assistive supply workflow: ML Shortage Alert &rarr; Human Review &rarr; India Officer Routing &rarr; Marine Freight Booking &rarr; Polar Reception
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingRequest(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Equipment Requisition</span>
        </button>
      </div>

      {/* India Officer Separation Callout Banner (Section 17 & 21) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asset Logistics Officer */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <span className="p-2 rounded-lg bg-blue-600 text-white">
            <User className="w-5 h-5" />
          </span>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-950 text-sm">
                {officerConfig?.assetOfficerName || 'Shri Alok Mukherjee'}
              </span>
              <span className="px-2 py-0.2 rounded-full bg-blue-200 text-blue-900 font-mono text-[10px] font-bold">
                ASSETS & MACHINERY
              </span>
            </div>
            <p className="text-slate-600">
              {officerConfig?.assetOfficerRole || 'Chief Logistics & Asset Controller'} • {officerConfig?.organizationUnit || 'NCPOR Ministry of Earth Sciences, Goa'}
            </p>
            <p className="text-[11px] font-mono text-blue-800">
              Email: {officerConfig?.assetOfficerEmail || 'alok.logistics@ncpor.gov.in'} • Channel: Indian Ocean Iridium Gateway
            </p>
            <span className="inline-block text-[11px] text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 font-medium">
              Authorized for: Generators, PistenBully Snowcats, Radios, Cranes, Heavy Spares
            </span>
          </div>
        </div>

        {/* Food Logistics Officer (Explicit Separation) */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="p-2 rounded-lg bg-amber-600 text-white">
            <Package className="w-5 h-5" />
          </span>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-950 text-sm">
                {officerConfig?.foodOfficerName || 'Dr. Meenakshi Sundaram'}
              </span>
              <span className="px-2 py-0.2 rounded-full bg-amber-200 text-amber-900 font-mono text-[10px] font-bold">
                FOOD & PROVISIONS
              </span>
            </div>
            <p className="text-slate-600">
              {officerConfig?.foodOfficerRole || 'Director of Polar Provisions & Nutrition'} • Separate Procurement Channel
            </p>
            <p className="text-[11px] font-mono text-amber-800">
              Email: {officerConfig?.foodOfficerEmail || 'meenakshi.provisions@ncpor.gov.in'}
            </p>
            <span className="inline-block text-[11px] text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200 font-medium">
              Strictly segregated: Asset Management coordinates equipment and machinery only.
            </span>
          </div>
        </div>
      </div>

      {/* Supply Requests Table */}
      <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Asset Resupply Requisitions & Lifecycle</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and approve supply requests generated by ML prediction or polar station managers
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">{requests.length} Requests</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-2.5 px-3">Req Code</th>
                <th className="py-2.5 px-3">Category & Station</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-center">Urgency</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Assigned Logistics</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => {
                const isPending = req.status === 'PENDING_REVIEW';
                const isApproved = req.status === 'APPROVED';
                const isOrdered = req.status === 'ORDERED' || req.status === 'SHIPPED';
                const isReceived = req.status === 'RECEIVED';

                return (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {req.request_code}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {req.created_at?.slice(0, 10)}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{req.asset_category}</div>
                      <div className="text-[11px] font-mono text-slate-500 uppercase">{req.station} Station</div>
                      <div className="text-[11px] text-slate-600 max-w-xs truncate">{req.justification}</div>
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-sm text-slate-800">
                      {req.quantity_requested}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        req.urgency === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                        req.urgency === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                        isPending ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        isApproved ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        isOrdered ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {req.status}
                      </span>
                      {req.approved_by && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          by {req.approved_by}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      {req.assigned_container ? (
                        <div className="space-y-0.5 font-mono">
                          <span className="font-bold text-slate-800">{req.assigned_container}</span>
                          <div className="text-slate-500">{req.assigned_vessel}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => setSelectedForApproval(req)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition shadow-2xs"
                        >
                          Approve Requisition
                        </button>
                      )}

                      {(isApproved || isOrdered) && (
                        <button
                          type="button"
                          onClick={() => setSelectedForReceive(req)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition shadow-2xs"
                        >
                          Receive at Station
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleManualDispatchNotification(req)}
                        title="Resend notification to India Officer"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold transition"
                      >
                        Notify Officer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatched Notification History (Section 17 & 21) */}
      <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Official Notification Ledger (Dispatched to NCPOR Goa)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated Iridium satellite telex and priority email logs sent to responsible logistics personnel
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">{notifications.length} Logs</span>
        </div>

        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div key={notif.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-slate-900">{notif.notification_code}</span>
                  <span className="px-2 py-0.2 rounded-sm bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {notif.alert_type}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">Channel: <strong>{notif.channel}</strong></span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(notif.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-line leading-relaxed">
                {notif.message_body}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Recipient: <strong>{notif.recipient_name}</strong> ({notif.recipient_email})</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Delivered via Iridium SAT-COMM</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Requisition Modal */}
      {isCreatingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-blue-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold">Create Equipment Requisition</h3>
              <button onClick={() => setIsCreatingRequest(false)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Equipment Category *</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Generators">Generators</option>
                    <option value="Snow vehicles">Snow vehicles (Snowcats / Skidoos)</option>
                    <option value="Radios">Radios & VHF Comms</option>
                    <option value="Scientific instruments">Scientific instruments</option>
                    <option value="Safety equipment">Safety equipment</option>
                    <option value="Power equipment">Power equipment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Destination Station *</label>
                  <select
                    value={reqStation}
                    onChange={(e) => setReqStation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="bharati">Bharati Station</option>
                    <option value="maitri">Maitri Station</option>
                    <option value="himadri">Himadri Station</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity Required *</label>
                  <input
                    type="number"
                    min="1"
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Urgency Priority *</label>
                  <select
                    value={reqUrgency}
                    onChange={(e) => setReqUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-amber-700"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Life Support)</option>
                    <option value="HIGH">HIGH (Traverse Dependency)</option>
                    <option value="MEDIUM">MEDIUM (Scheduled Restock)</option>
                    <option value="LOW">LOW (Routine Buffer)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Technical Justification *</label>
                <textarea
                  rows={3}
                  value={reqJustification}
                  onChange={(e) => setReqJustification(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                Notice: Approvals will be routed to <strong>Shri Alok Mukherjee</strong> (Logistics Officer, NCPOR Goa) for marine vessel allotment.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreatingRequest(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Requisition Modal */}
      {selectedForApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-emerald-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
              <h3 className="text-base font-bold">Approve Supply Request: {selectedForApproval.request_code}</h3>
              <button onClick={() => setSelectedForApproval(null)} className="text-emerald-300 hover:text-white p-1">✕</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p><strong>Category:</strong> {selectedForApproval.asset_category}</p>
                <p><strong>Quantity:</strong> {selectedForApproval.quantity_requested} Units</p>
                <p><strong>Station:</strong> {selectedForApproval.station.toUpperCase()}</p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Allocated Cargo Container</label>
                <input
                  type="text"
                  value={approvalContainer}
                  onChange={(e) => setApprovalContainer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned Expedition Vessel</label>
                <input
                  type="text"
                  value={approvalVessel}
                  onChange={(e) => setApprovalVessel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Staging / Departure Port</label>
                <input
                  type="text"
                  value={approvalPort}
                  onChange={(e) => setApprovalPort(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedForApproval(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Confirm Marine Allotment & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Equipment Modal */}
      {selectedForReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-blue-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between border-b border-blue-800">
              <h3 className="text-base font-bold">Receive Equipment at Station: {selectedForReceive.request_code}</h3>
              <button onClick={() => setSelectedForReceive(null)} className="text-blue-300 hover:text-white p-1">✕</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                Receiving will automatically provision <strong>{selectedForReceive.quantity_requested}x {selectedForReceive.asset_category}</strong> into the active Asset Master table with status <strong>AVAILABLE</strong> and resolve the station shortage!
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Station Receiving Bay</label>
                <input
                  type="text"
                  value={receiveLocation}
                  onChange={(e) => setReceiveLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Receiving Technician / Custodian</label>
                <input
                  type="text"
                  value={receiveTechnician}
                  onChange={(e) => setReceiveTechnician(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedForReceive(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReceive}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Confirm Station Intake & Register Assets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
