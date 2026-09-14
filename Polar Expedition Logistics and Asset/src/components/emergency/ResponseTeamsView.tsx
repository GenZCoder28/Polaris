import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  HeartPulse, 
  Flame, 
  Wrench, 
  Radio, 
  Compass, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Phone
} from 'lucide-react';
import { ResponseTeam, ResponseTeamAvailability } from '../../types.ts';

interface ResponseTeamsViewProps {
  teams: ResponseTeam[];
  onUpdateStatus: (teamId: string, status: ResponseTeamAvailability) => void;
}

const TYPE_ICONS: Record<ResponseTeam['team_type'], React.ComponentType<{ className?: string }>> = {
  MEDICAL: HeartPulse,
  FIRE_SAFETY: Flame,
  TECHNICAL: Wrench,
  SEARCH_AND_RESCUE: Compass,
  OPERATIONS: Radio,
};

export const ResponseTeamsView: React.FC<ResponseTeamsViewProps> = ({
  teams,
  onUpdateStatus,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Station & Vessel Designated Response Teams
          </h3>
          <p className="text-xs text-slate-500">
            Pre-configured emergency units on duty with live availability status and radio frequencies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team) => {
          const Icon = TYPE_ICONS[team.team_type] || Users;
          const isAvailable = team.availability_status === 'AVAILABLE';
          const isBusy = team.availability_status === 'BUSY';

          return (
            <div
              key={team.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg text-white shrink-0 ${
                      team.team_type === 'MEDICAL'
                        ? 'bg-rose-600'
                        : team.team_type === 'FIRE_SAFETY'
                        ? 'bg-amber-600'
                        : team.team_type === 'TECHNICAL'
                        ? 'bg-blue-600'
                        : 'bg-emerald-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{team.name}</h4>
                    <span className="text-[11px] font-mono text-slate-500 block">
                      ID: {team.id} • Station:{' '}
                      {team.station_id ? team.station_id.toUpperCase() : 'VESSEL / MARITIME'}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                    isAvailable
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : isBusy
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {team.availability_status}
                </span>
              </div>

              {/* Members List */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  Designated Members ({team.members.length}):
                </span>
                {team.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{m.name}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{m.role}</span>
                  </div>
                ))}
              </div>

              {/* Direct Communications Channel */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 bg-blue-50/50 p-2 rounded border border-blue-100">
                <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{team.contact_info}</span>
              </div>

              {/* Status Switcher Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-500 font-medium">Toggle Availability:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdateStatus(team.id, 'AVAILABLE')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                      isAvailable
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => onUpdateStatus(team.id, 'BUSY')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                      isBusy
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Busy
                  </button>
                  <button
                    onClick={() => onUpdateStatus(team.id, 'UNAVAILABLE')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                      team.availability_status === 'UNAVAILABLE'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Offline
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
