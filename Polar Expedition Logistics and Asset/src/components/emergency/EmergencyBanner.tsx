import React from 'react';
import { 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  Clock, 
  Radio, 
  CheckCircle2, 
  ArrowRight,
  PhoneCall
} from 'lucide-react';
import { EmergencyRecord } from '../../types.ts';

interface EmergencyBannerProps {
  emergencies: EmergencyRecord[];
  onSelectEmergency: (emergency: EmergencyRecord) => void;
  onAcknowledgeEmergency: (id: string) => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  emergencies,
  onSelectEmergency,
  onAcknowledgeEmergency,
}) => {
  const activeEmergencies = emergencies.filter(
    (e) => e.status !== 'RESOLVED' && e.status !== 'CANCELLED'
  );
  const criticalUnack = activeEmergencies.filter(
    (e) => e.severity === 'CRITICAL' && !e.acknowledged_at
  );

  if (activeEmergencies.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-800 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">ALL POLAR STATIONS NOMINAL:</span>
          <span className="text-emerald-700">
            No active emergencies declared across Bharati, Maitri, Himadri, or expedition vessels.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-700 font-semibold">
          <Radio className="w-3.5 h-3.5" />
          <span>Iridium Sat Comms Ready</span>
        </div>
      </div>
    );
  }

  const primaryAlert = criticalUnack.length > 0 ? criticalUnack[0] : activeEmergencies[0];
  const elapsedMin = Math.max(
    0,
    Math.floor((Date.now() - new Date(primaryAlert.created_at).getTime()) / 60000)
  );

  const isCritical = primaryAlert.severity === 'CRITICAL';
  const isUnack = !primaryAlert.acknowledged_at;

  return (
    <div
      className={`rounded-xl p-4 border-2 shadow-md transition-all ${
        isCritical
          ? 'bg-rose-50 border-rose-500 text-rose-950'
          : 'bg-amber-50 border-amber-400 text-amber-950'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Indicator */}
        <div className="flex items-center gap-3.5">
          <div
            className={`p-2.5 rounded-xl text-white shrink-0 ${
              isCritical ? 'bg-rose-600 animate-pulse' : 'bg-amber-600'
            }`}
          >
            {isCritical ? <Flame className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-extrabold uppercase ${
                  isCritical ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                }`}
              >
                🚨 {primaryAlert.severity} {primaryAlert.emergency_type.replace(/_/g, ' ')}
              </span>

              <span className="font-mono text-xs font-bold">{primaryAlert.emergency_code}</span>

              <span className="text-xs text-slate-500">|</span>

              <span className="text-xs font-medium">{primaryAlert.location}</span>

              {primaryAlert.escalation_level > 1 && (
                <span className="px-1.5 py-0.2 bg-red-600 text-white font-mono text-[10px] rounded font-bold">
                  LEVEL {primaryAlert.escalation_level} ESCALATED
                </span>
              )}
            </div>

            <p className="text-xs font-semibold mt-1 leading-snug max-w-3xl">
              {primaryAlert.description}
            </p>

            <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Elapsed: {elapsedMin} min</span>
              </span>
              <span>•</span>
              <span>Reported: {primaryAlert.reported_by}</span>
              <span>•</span>
              <span className="font-semibold text-slate-800">
                Team: {primaryAlert.response_team_name || 'Routing...'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isUnack && (
            <button
              onClick={() => onAcknowledgeEmergency(primaryAlert.id)}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledge Alert</span>
            </button>
          )}

          <button
            onClick={() => onSelectEmergency(primaryAlert)}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <span>Open Incident Command</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
