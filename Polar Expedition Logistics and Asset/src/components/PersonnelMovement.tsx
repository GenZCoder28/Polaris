import React, { useState } from 'react';
import { Personnel, Station } from '../types';
import { 
  Users, 
  UserCheck, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plane, 
  Ship, 
  Truck, 
  ShieldCheck, 
  AlertCircle,
  Phone,
  HeartPulse,
  ArrowRight
} from 'lucide-react';

interface PersonnelMovementProps {
  personnel: Personnel[];
  stations: Station[];
}

export const PersonnelMovement: React.FC<PersonnelMovementProps> = ({
  personnel,
  stations,
}) => {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>(personnel[0]?.id || 'PRS-01');
  const [filterStation, setFilterStation] = useState<string>('ALL');

  const filteredPersonnel = personnel.filter((p) => {
    if (filterStation === 'ALL') return true;
    return p.assignedStationId === filterStation;
  });

  const selectedPerson = personnel.find((p) => p.id === selectedPersonnelId) || personnel[0];

  const getTransportIcon = (mode: string) => {
    if (mode.includes('Flight') || mode.includes('Aircraft')) {
      return <Plane className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (mode.includes('Ship') || mode.includes('Icebreaker')) {
      return <Ship className="w-3.5 h-3.5 text-blue-700" />;
    }
    return <Truck className="w-3.5 h-3.5 text-amber-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-blue-100 rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-blue-950">
              Personnel Movement, Rotation & Clearance Tracking
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking Antarctic winter-over teams, summer expeditions, medical certifications, and multi-leg transit journeys.
          </p>
        </div>

        {/* Filter by Station */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setFilterStation('ALL')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              filterStation === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Personnel ({personnel.length})
          </button>
          <button
            onClick={() => setFilterStation('bharati')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              filterStation === 'bharati'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bharati
          </button>
          <button
            onClick={() => setFilterStation('maitri')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              filterStation === 'maitri'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Maitri
          </button>
        </div>
      </div>

      {/* Main Grid: Personnel Directory (Left) & Personnel Journey Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): Roster list */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
              Expedition Members ({filteredPersonnel.length})
            </h3>
            <span className="text-[11px] text-slate-500">Click to view movement history</span>
          </div>

          <div className="space-y-2.5">
            {filteredPersonnel.map((p) => {
              const isSelected = p.id === selectedPerson.id;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPersonnelId(p.id)}
                  className={`border rounded-xl p-3.5 cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-50/60 border-2 border-blue-600 shadow-xs'
                      : 'bg-white hover:bg-blue-50/30 border-blue-100 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                      <span className="text-xs text-blue-600 font-semibold">{p.role}</span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {p.medicalClearance}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{p.currentLocation}</span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{p.rotationType}</span>
                    <span className="font-mono text-slate-700 font-semibold">{p.specialization.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Person Profile & Journey Timeline (Section 12) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-blue-100 rounded-xl p-5 space-y-5 shadow-xs">
            {/* Profile Overview */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-blue-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                  {selectedPerson.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedPerson.name}</h3>
                  <div className="text-xs text-blue-600 font-semibold">{selectedPerson.role}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{selectedPerson.specialization}</div>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold">
                  {selectedPerson.rotationType}
                </span>
                <span className="text-[11px] text-slate-500 font-mono block mt-1">
                  ID: {selectedPerson.id} • Blood: {selectedPerson.bloodGroup}
                </span>
              </div>
            </div>

            {/* Emergency Medical & Contact Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-100">
                <span className="text-slate-500 text-[10px] block flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-rose-600" />
                  Polar Medical Certification
                </span>
                <strong className="text-emerald-700 font-mono text-xs">
                  CERTIFIED (Extreme Cold & High Altitude Checked)
                </strong>
              </div>

              <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-100">
                <span className="text-slate-500 text-[10px] block flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-600" />
                  Next of Kin / Emergency Contact
                </span>
                <strong className="text-slate-800 text-xs truncate block">
                  {selectedPerson.emergencyContact}
                </strong>
              </div>
            </div>

            {/* Personnel Movement Timeline (Section 12 requirement) */}
            <div>
              <div className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Personnel Deployment & Transit Legs Timeline</span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
                {selectedPerson.movementTimeline.map((leg, idx) => {
                  const isDone = leg.status === 'COMPLETED';

                  return (
                    <div key={leg.id} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-blue-600 border-blue-400 text-white'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTransportIcon(leg.transportMode)}
                            <strong className="text-slate-900">
                              {leg.from} → {leg.to}
                            </strong>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            isDone ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-blue-50 text-blue-700 border border-blue-300'
                          }`}>
                            {leg.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                          <span>Mode: {leg.transportMode}</span>
                          <span>{leg.departureDate} to {leg.arrivalDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
