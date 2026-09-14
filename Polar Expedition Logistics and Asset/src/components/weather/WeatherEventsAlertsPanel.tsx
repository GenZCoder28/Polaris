import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Clock, 
  UserCheck, 
  ArrowUpRight, 
  FileText, 
  Check, 
  X,
  Send,
  AlertCircle
} from 'lucide-react';
import { WeatherEvent, WeatherAlert, WeatherSeverity } from '../../types';

interface WeatherEventsAlertsPanelProps {
  events: WeatherEvent[];
  alerts: WeatherAlert[];
  onUpdateEventStatus: (eventId: string, status: WeatherEvent['status'], resolvedBy?: string) => Promise<void>;
  onAcknowledgeAlert: (alertId: string, acknowledgedBy: string) => Promise<void>;
  onEscalateAlert: (alertId: string) => Promise<void>;
}

export const WeatherEventsAlertsPanel: React.FC<WeatherEventsAlertsPanelProps> = ({
  events,
  alerts,
  onUpdateEventStatus,
  onAcknowledgeAlert,
  onEscalateAlert,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'alerts'>('events');
  const [eventFilter, setEventFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [inspectAlert, setInspectAlert] = useState<WeatherAlert | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [ackName, setAckName] = useState<string>('Officer On Watch');

  const filteredEvents = events.filter((e) => {
    if (eventFilter === 'ACTIVE') return e.status !== 'RESOLVED';
    if (eventFilter === 'RESOLVED') return e.status === 'RESOLVED';
    return true;
  });

  const handleResolve = async (eventId: string) => {
    await onUpdateEventStatus(eventId, 'RESOLVED', ackName);
    setResolvingId(null);
  };

  const handleConditionsImprove = async (eventId: string) => {
    await onUpdateEventStatus(eventId, 'CONDITIONS_IMPROVE');
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Selector */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'events'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Active Weather Events ({events.filter((e) => e.status !== 'RESOLVED').length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'alerts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Dispatched Alerts & Muster ({alerts.length})</span>
          </button>
        </div>

        {activeSubTab === 'events' && (
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            {(['ACTIVE', 'RESOLVED', 'ALL'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setEventFilter(filter)}
                className={`px-3 py-1 rounded text-[11px] font-semibold transition ${
                  eventFilter === filter ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: EVENTS LIFECYCLE TRACKER */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">No Active Weather Hazards</div>
              <p>All polar stations and transit vessels are operating within approved safe environmental envelopes.</p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isCrit = ev.severity === 'CRITICAL';
              const isWarn = ev.severity === 'WARNING';
              const isResolved = ev.status === 'RESOLVED';

              return (
                <div
                  key={ev.id}
                  className={`bg-white border rounded-xl p-5 shadow-xs space-y-4 transition ${
                    isResolved
                      ? 'border-slate-200 opacity-75'
                      : isCrit
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  {/* Event Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isCrit ? 'bg-rose-100 text-rose-800' : isWarn ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ev.severity}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-600">{ev.id}</span>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {ev.event_type.replace(/_/g, ' ')} at {ev.target_name}
                        </h4>
                        {ev.is_early_warning && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Forecast Early Warning (+6h)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {ev.description}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="text-right">
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${
                        ev.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ev.status === 'CONDITIONS_IMPROVE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : ev.status === 'MONITORED'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        STATUS: {ev.status}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Detected: {new Date(ev.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                      </div>
                    </div>
                  </div>

                  {/* Trigger Conditions & Directive */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Triggering Meteorological Conditions
                      </span>
                      <p className="font-mono text-[11px] text-slate-800">
                        {ev.triggering_conditions}
                      </p>
                    </div>

                    <div className={`border rounded-lg p-3 space-y-1 ${
                      isCrit ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Mandatory SOP Directive
                      </span>
                      <p className="text-[11px] font-semibold text-slate-900">
                        {ev.operational_instruction}
                      </p>
                    </div>
                  </div>

                  {/* Lifecycle Actions */}
                  {!isResolved && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <div className="text-[11px] text-slate-500 font-mono">
                        Lifecycle Stage: <strong>{ev.status}</strong> • Expected clearing:{' '}
                        {ev.expected_end_time ? new Date(ev.expected_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'} UTC
                      </div>

                      <div className="flex items-center gap-2">
                        {ev.status !== 'CONDITIONS_IMPROVE' && (
                          <button
                            onClick={() => handleConditionsImprove(ev.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                          >
                            Mark Conditions Improving
                          </button>
                        )}

                        <button
                          onClick={() => handleResolve(ev.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs"
                        >
                          Stand Down & Resolve Event
                        </button>
                      </div>
                    </div>
                  )}

                  {isResolved && ev.resolved_at && (
                    <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 flex items-center justify-between">
                      <span>Resolved by: <strong>{ev.resolved_by || 'Commander'}</strong></span>
                      <span>At: {new Date(ev.resolved_at).toUTCString()}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: DISPATCHED ALERTS & ACKNOWLEDGEMENTS */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs text-xs">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-700">
                Acknowledging Responder Name:
              </span>
              <input
                type="text"
                value={ackName}
                onChange={(e) => setAckName(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded-md text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                placeholder="Your Name / Call-sign"
              />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Delivery Channel: Terminal In-App + Iridium SMS Packet
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No automated alerts generated in current session.
                </div>
              ) : (
                alerts.map((al) => {
                  const isAck = al.status === 'ACKNOWLEDGED';
                  const isEscalated = al.is_escalated;
                  const isCrit = al.severity === 'CRITICAL';

                  return (
                    <div key={al.id} className="p-4 hover:bg-slate-50/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            isCrit ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {al.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{al.target_name}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-blue-700">
                            To: {al.recipient_name} ({al.recipient_role})
                          </span>
                          {isEscalated && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                              ESCALATED TO COMMAND
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-1 font-mono">
                          {al.message.split('\n')[0]}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                          <span>Delivered: {new Date(al.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
                          {al.recipient_contact && <span>Contact: {al.recipient_contact}</span>}
                          {isAck && (
                            <span className="text-emerald-700 font-bold">
                              ✓ Acknowledged by {al.acknowledged_by} ({al.acknowledged_time ? new Date(al.acknowledged_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} UTC)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => setInspectAlert(al)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Message</span>
                        </button>

                        {!isAck ? (
                          <>
                            <button
                              onClick={() => onAcknowledgeAlert(al.id, ackName)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Acknowledge</span>
                            </button>

                            {!isEscalated && (
                              <button
                                onClick={() => onEscalateAlert(al.id)}
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                                title="Escalate to Station Commander"
                              >
                                Escalate
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold px-2 py-1 bg-emerald-50 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Logged</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Full Alert Text */}
      {inspectAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Predefined Alert Dispatch Message
                </h3>
              </div>
              <button
                onClick={() => setInspectAlert(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {inspectAlert.message}
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                Escalation Contact: {inspectAlert.escalation_contact || 'NCPOR Central Emergency Desk'}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  Status: <strong className="text-slate-900">{inspectAlert.status}</strong>
                </div>
                <button
                  onClick={() => setInspectAlert(null)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
