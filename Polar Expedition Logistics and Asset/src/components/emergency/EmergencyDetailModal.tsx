import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Radio, 
  Users, 
  UserCheck, 
  MapPin, 
  Phone, 
  Send, 
  X, 
  FileText, 
  TrendingUp, 
  RotateCcw,
  Ban,
  Activity,
  ChevronRight,
  ShieldCheck,
  Building,
  Navigation
} from 'lucide-react';
import { 
  EmergencyRecord, 
  ResponseTeam, 
  EmergencyActionRecord, 
  EmergencyNotificationRecord,
  EmergencySeverity,
  EmergencyStatus
} from '../../types.ts';

interface EmergencyDetailModalProps {
  emergency: EmergencyRecord | null;
  responseTeams: ResponseTeam[];
  onClose: () => void;
  onAcknowledge: (id: string, notes?: string) => void;
  onAssignTeam: (id: string, teamId: string, notes?: string) => void;
  onAcceptResponse: (id: string, notes?: string) => void;
  onRejectResponse: (id: string, reason: string) => void;
  onRecordAction: (id: string, type: EmergencyActionRecord['action_type'], description: string) => void;
  onEscalate: (id: string, reason?: string) => void;
  onResolve: (id: string, summary: string, notes?: string) => void;
  onCancel: (id: string, reason: string) => void;
}

export const EmergencyDetailModal: React.FC<EmergencyDetailModalProps> = ({
  emergency,
  responseTeams,
  onClose,
  onAcknowledge,
  onAssignTeam,
  onAcceptResponse,
  onRejectResponse,
  onRecordAction,
  onEscalate,
  onResolve,
  onCancel,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ACTIONS' | 'NOTIFICATIONS' | 'TEAMS' | 'AUDIT'>('ACTIONS');

  // Form states for dialog sub-actions
  const [showResolvePrompt, setShowResolvePrompt] = useState<boolean>(false);
  const [resolveSummary, setResolveSummary] = useState<string>('');
  const [resolveNotes, setResolveNotes] = useState<string>('');

  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  const [showRejectPrompt, setShowRejectPrompt] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  const [showActionPrompt, setShowActionPrompt] = useState<boolean>(false);
  const [actionType, setActionType] = useState<EmergencyActionRecord['action_type']>('UPDATE');
  const [actionDescription, setActionDescription] = useState<string>('');

  const [showReassignPrompt, setShowReassignPrompt] = useState<boolean>(false);
  const [selectedNewTeamId, setSelectedNewTeamId] = useState<string>('');

  if (!emergency) return null;

  const isCritical = emergency.severity === 'CRITICAL';
  const isClosed = emergency.status === 'RESOLVED' || emergency.status === 'CANCELLED';
  const isUnack = !emergency.acknowledged_at;

  const currentTeam = responseTeams.find((t) => t.id === emergency.response_team_id);
  const stationTeams = responseTeams.filter(
    (t) => (emergency.station_id && t.station_id === emergency.station_id) ||
           (emergency.vessel_id && t.vessel_id === emergency.vessel_id)
  );

  const elapsedMin = Math.max(
    0,
    Math.floor((Date.now() - new Date(emergency.created_at).getTime()) / 60000)
  );

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveSummary.trim()) return;
    onResolve(emergency.id, resolveSummary, resolveNotes);
    setShowResolvePrompt(false);
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    onCancel(emergency.id, cancelReason);
    setShowCancelPrompt(false);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    onRejectResponse(emergency.id, rejectReason);
    setShowRejectPrompt(false);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionDescription.trim()) return;
    onRecordAction(emergency.id, actionType, actionDescription);
    setActionDescription('');
    setShowActionPrompt(false);
  };

  const handleConfirmReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewTeamId) return;
    onAssignTeam(emergency.id, selectedNewTeamId, 'Reassigned by Incident Commander');
    setShowReassignPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-6 text-slate-900">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-xl text-white shrink-0 shadow-xs ${
                isCritical ? 'bg-rose-600 animate-pulse' : 'bg-amber-600'
              }`}
            >
              {isCritical ? <Flame className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-extrabold text-blue-950">
                  {emergency.emergency_code}
                </span>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                    emergency.severity === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : emergency.severity === 'HIGH'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}
                >
                  {emergency.severity}
                </span>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 uppercase">
                  {emergency.status.replace(/_/g, ' ')}
                </span>

                {emergency.escalation_level > 1 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-600 text-white animate-pulse">
                    ESCALATION LEVEL {emergency.escalation_level}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-black text-slate-900 mt-1">
                {emergency.emergency_type.replace(/_/g, ' ')} INCIDENT
              </h2>

              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-2xl">
                {emergency.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase">Location</span>
            <strong className="text-slate-900 block truncate">{emergency.location}</strong>
            <span className="text-[10px] text-blue-700">
              {emergency.latitude.toFixed(4)}°, {emergency.longitude.toFixed(4)}°
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase">Reported By</span>
            <strong className="text-slate-900 block truncate">{emergency.reported_by}</strong>
            <span className="text-[10px] text-slate-500">
              {new Date(emergency.created_at).toLocaleTimeString()} ({elapsedMin}m ago)
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase">Assigned Response Team</span>
            <strong className="text-blue-900 block truncate">
              {emergency.response_team_name || 'Unassigned'}
            </strong>
            <span className="text-[10px] text-emerald-700 font-semibold">
              {currentTeam ? currentTeam.availability_status : 'Awaiting Assignment'}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase">Acknowledgement</span>
            <strong className="text-slate-900 block">
              {emergency.acknowledged_by ? emergency.acknowledged_by : 'UNACKNOWLEDGED'}
            </strong>
            <span className="text-[10px] text-slate-500">
              {emergency.acknowledged_at
                ? new Date(emergency.acknowledged_at).toLocaleTimeString()
                : 'Pending response'}
            </span>
          </div>
        </div>

        {/* Command Action Directives Bar */}
        {!isClosed && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-700" />
                <span>Incident Command Directives:</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isUnack && (
                <button
                  onClick={() => onAcknowledge(emergency.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Acknowledge Alert</span>
                </button>
              )}

              {emergency.status === 'RESPONSE_ASSIGNED' && (
                <button
                  onClick={() => onAcceptResponse(emergency.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept Response & Deploy</span>
                </button>
              )}

              {emergency.status === 'RESPONSE_ASSIGNED' && (
                <button
                  onClick={() => setShowRejectPrompt(true)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Reject Assignment</span>
                </button>
              )}

              <button
                onClick={() => setShowActionPrompt(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Log Response Action</span>
              </button>

              <button
                onClick={() => setShowReassignPrompt(true)}
                className="px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-blue-800 hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reassign Team</span>
              </button>

              <button
                onClick={() => onEscalate(emergency.id, 'Commander manual escalation')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Escalate Incident</span>
              </button>

              <button
                onClick={() => setShowResolvePrompt(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition ml-auto"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Resolve (All-Clear)</span>
              </button>

              <button
                onClick={() => setShowCancelPrompt(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel (False Alarm)</span>
              </button>
            </div>
          </div>
        )}

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('ACTIONS')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeSubTab === 'ACTIONS'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Response Timeline ({emergency.actions?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('NOTIFICATIONS')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeSubTab === 'NOTIFICATIONS'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Transmitted Notifications ({emergency.notifications?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('TEAMS')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeSubTab === 'TEAMS'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Response Team Profile</span>
          </button>
        </div>

        {/* Sub-tab Content Area */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {/* 1. ACTIONS TIMELINE */}
          {activeSubTab === 'ACTIONS' && (
            <div className="space-y-2">
              {emergency.actions && emergency.actions.length > 0 ? (
                emergency.actions.map((act) => (
                  <div
                    key={act.id}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-100 text-blue-900 border border-blue-200">
                          {act.action_type}
                        </span>
                        <span className="font-semibold text-slate-900">{act.performed_by}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{act.description}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {new Date(act.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No response actions recorded yet. Use the "Log Response Action" directive above.
                </div>
              )}
            </div>
          )}

          {/* 2. NOTIFICATIONS */}
          {activeSubTab === 'NOTIFICATIONS' && (
            <div className="space-y-2">
              {emergency.notifications && emergency.notifications.length > 0 ? (
                emergency.notifications.map((n) => (
                  <div
                    key={n.id}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-100 text-purple-900 border border-purple-200">
                          {n.channel}
                        </span>
                        <span className="font-bold text-slate-900">{n.recipient_name}</span>
                        <span className="text-slate-500 text-[11px]">({n.recipient_role})</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          n.status === 'ACKNOWLEDGED' || n.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {n.status}
                      </span>
                    </div>
                    <p className="text-slate-600 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Contact: {n.recipient_contact}</span>
                      <span>Sent: {new Date(n.sent_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No notifications recorded.
                </div>
              )}
            </div>
          )}

          {/* 3. TEAMS PROFILE */}
          {activeSubTab === 'TEAMS' && (
            <div className="space-y-3">
              {currentTeam ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{currentTeam.name}</h4>
                      <span className="text-slate-500 text-xs">
                        Type: {currentTeam.team_type} • Status: {currentTeam.availability_status}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                      {currentTeam.availability_status}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Assigned Personnel:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentTeam.members.map((m) => (
                        <div key={m.id} className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <strong className="block text-slate-900">{m.name}</strong>
                          <span className="text-slate-500 text-[11px] block">{m.role}</span>
                          <span className="text-blue-700 font-mono text-[10px] block mt-1">
                            {m.contact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                    <strong>Direct Contact:</strong> {currentTeam.contact_info}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No response team assigned to this incident yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL PROMPT: RESOLVE INCIDENT */}
        {showResolvePrompt && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-3 text-xs">
            <h4 className="font-bold text-emerald-950 text-sm">Issue Incident All-Clear / Resolution</h4>
            <form onSubmit={handleConfirmResolve} className="space-y-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Resolution Summary (Required):
                </label>
                <input
                  type="text"
                  value={resolveSummary}
                  onChange={(e) => setResolveSummary(e.target.value)}
                  placeholder="e.g. Patient stabilized and transferred to MedBay B. Splint applied."
                  className="w-full bg-white border border-emerald-300 rounded px-3 py-2 text-slate-900 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResolvePrompt(false)}
                  className="px-3 py-1.5 rounded bg-white text-slate-700 border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-700 text-white font-bold"
                >
                  Confirm Incident Resolved
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL PROMPT: CANCEL INCIDENT */}
        {showCancelPrompt && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-3 text-xs">
            <h4 className="font-bold text-rose-950 text-sm">Cancel Incident (False Alarm)</h4>
            <form onSubmit={handleConfirmCancel} className="space-y-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Cancellation Reason (Required):
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Accidental button trigger during maintenance drill."
                  className="w-full bg-white border border-rose-300 rounded px-3 py-2 text-slate-900 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 rounded bg-white text-slate-700 border"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-rose-700 text-white font-bold"
                >
                  Confirm Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL PROMPT: REJECT ASSIGNMENT */}
        {showRejectPrompt && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3 text-xs">
            <h4 className="font-bold text-amber-950 text-sm">Reject Response Assignment</h4>
            <form onSubmit={handleConfirmReject} className="space-y-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Rejection Reason (Required):
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Team currently engaged in active field rescue."
                  className="w-full bg-white border border-amber-300 rounded px-3 py-2 text-slate-900 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectPrompt(false)}
                  className="px-3 py-1.5 rounded bg-white text-slate-700 border"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-700 text-white font-bold"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL PROMPT: LOG ACTION */}
        {showActionPrompt && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-300 space-y-3 text-xs">
            <h4 className="font-bold text-blue-950 text-sm">Record On-Scene Response Action</h4>
            <form onSubmit={handleConfirmAction} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Action Type:</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full bg-white border border-blue-300 rounded px-2.5 py-1.5 text-slate-900"
                  >
                    <option value="DISPATCH">DISPATCH</option>
                    <option value="ON_SCENE">ON_SCENE</option>
                    <option value="TREATMENT">TREATMENT</option>
                    <option value="CONTAINMENT">CONTAINMENT</option>
                    <option value="EVACUATION">EVACUATION</option>
                    <option value="COMMUNICATION">COMMUNICATION</option>
                    <option value="UPDATE">UPDATE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Description:</label>
                  <input
                    type="text"
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    placeholder="e.g. Stretcher deployed to Pod 3."
                    className="w-full bg-white border border-blue-300 rounded px-2.5 py-1.5 text-slate-900"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowActionPrompt(false)}
                  className="px-3 py-1.5 rounded bg-white text-slate-700 border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-700 text-white font-bold"
                >
                  Append Action
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL PROMPT: REASSIGN TEAM */}
        {showReassignPrompt && (
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-300 space-y-3 text-xs">
            <h4 className="font-bold text-purple-950 text-sm">Reassign Response Team</h4>
            <form onSubmit={handleConfirmReassign} className="space-y-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select New Team:</label>
                <select
                  value={selectedNewTeamId}
                  onChange={(e) => setSelectedNewTeamId(e.target.value)}
                  className="w-full bg-white border border-purple-300 rounded px-2.5 py-2 text-slate-900"
                  required
                >
                  <option value="">-- Choose Team --</option>
                  {stationTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.availability_status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReassignPrompt(false)}
                  className="px-3 py-1.5 rounded bg-white text-slate-700 border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-purple-700 text-white font-bold"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
