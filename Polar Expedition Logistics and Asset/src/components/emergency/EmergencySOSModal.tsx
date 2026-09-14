import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  HeartPulse, 
  Truck, 
  Wrench, 
  CloudLightning, 
  UserX, 
  AlertOctagon, 
  Radio, 
  HelpCircle,
  X,
  Send,
  MapPin,
  UserCheck
} from 'lucide-react';
import { EmergencyType, EmergencySeverity, Station } from '../../types.ts';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  onSubmitSOS: (data: {
    emergency_type: EmergencyType;
    severity: EmergencySeverity;
    station_id?: string;
    vessel_id?: string;
    location?: string;
    reported_by: string;
    affected_personnel_name?: string;
    description: string;
  }) => void;
}

const EMERGENCY_TYPES: Array<{
  type: EmergencyType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultSeverity: EmergencySeverity;
  defaultDesc: string;
}> = [
  {
    type: 'MEDICAL',
    label: 'Medical Trauma / Frostbite',
    icon: HeartPulse,
    defaultSeverity: 'CRITICAL',
    defaultDesc: 'Critical medical trauma / acute hypothermia / severe frostbite reported. Urgent medical team dispatch and telemedicine consultation required.',
  },
  {
    type: 'FIRE',
    label: 'Station Fire & Smoke',
    icon: Flame,
    defaultSeverity: 'CRITICAL',
    defaultDesc: 'Smoke and flame outbreak detected in station module. Automated isolation dampers primed. Fire suppression squad dispatched.',
  },
  {
    type: 'VEHICLE_ACCIDENT',
    label: 'Vehicle / Crevasse Accident',
    icon: Truck,
    defaultSeverity: 'HIGH',
    defaultDesc: 'PistenBully / snowcat vehicle immobilized or crevasse hazard encountered on traverse route. Field crew extraction required.',
  },
  {
    type: 'EQUIPMENT_FAILURE',
    label: 'Critical Life-Support / Power',
    icon: Wrench,
    defaultSeverity: 'HIGH',
    defaultDesc: 'Genset auxiliary power loss or heating loop failure. Rapid ambient temperature drop threatening station life support.',
  },
  {
    type: 'WEATHER',
    label: 'Severe Katabatic Blizzard',
    icon: CloudLightning,
    defaultSeverity: 'CRITICAL',
    defaultDesc: 'Catabatic gale winds exceeding 85 km/h with zero visibility. Immediate outdoor transit lockdown instituted.',
  },
  {
    type: 'MISSING_PERSON',
    label: 'Missing Personnel / Man Overboard',
    icon: UserX,
    defaultSeverity: 'CRITICAL',
    defaultDesc: 'Scientist / expedition member overdue from field sampling station. Visual search and rescue snowcat team mobilized.',
  },
  {
    type: 'SAFETY',
    label: 'Hazardous Chemical / Fuel Leak',
    icon: AlertOctagon,
    defaultSeverity: 'HIGH',
    defaultDesc: 'Aviation turbine fuel or toxic refrigerant spill detected at storage bulk tank farm. Containment team dispatched.',
  },
  {
    type: 'COMMUNICATION',
    label: 'Radio / Iridium Blackout',
    icon: Radio,
    defaultSeverity: 'MEDIUM',
    defaultDesc: 'Total satellite telemetry and high-frequency radio loss to field party. Backup solar HF emergency transceiver activated.',
  },
  {
    type: 'OTHER',
    label: 'Other Operational Emergency',
    icon: HelpCircle,
    defaultSeverity: 'MEDIUM',
    defaultDesc: 'Operational emergency requiring Station Commander intervention and safety muster roll-call.',
  },
];

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  stations,
  onSubmitSOS,
}) => {
  const [selectedType, setSelectedType] = useState<EmergencyType>('MEDICAL');
  const [severity, setSeverity] = useState<EmergencySeverity>('CRITICAL');
  const [selectedTarget, setSelectedTarget] = useState<string>('bharati');
  const [reporterName, setReporterName] = useState<string>('Arun Kumar (Field Geologist)');
  const [affectedPerson, setAffectedPerson] = useState<string>('Arun Kumar');
  const [customLocation, setCustomLocation] = useState<string>('Bharati Station (Sector 3)');
  const [description, setDescription] = useState<string>(
    'Critical medical trauma / acute hypothermia / severe frostbite reported. Urgent medical team dispatch and telemedicine consultation required.'
  );

  if (!isOpen) return null;

  const handleSelectType = (item: typeof EMERGENCY_TYPES[0]) => {
    setSelectedType(item.type);
    setSeverity(item.defaultSeverity);
    setDescription(item.defaultDesc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isVessel = selectedTarget.startsWith('vessel');
    onSubmitSOS({
      emergency_type: selectedType,
      severity,
      station_id: isVessel ? undefined : selectedTarget,
      vessel_id: isVessel ? selectedTarget : undefined,
      location: customLocation,
      reported_by: reporterName,
      affected_personnel_name: affectedPerson || undefined,
      description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border-2 border-rose-400 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>DECLARE FIELD EMERGENCY (SOS)</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-mono font-bold rounded uppercase">
                  Rapid Dispatch
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Immediately broadcasts alarm across VHF emergency radio, in-app siren, and notifies designated response teams.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Emergency Type Selector (Large Touch-Friendly Buttons) */}
          <div>
            <label className="block text-slate-800 font-bold mb-2">
              1. Select Emergency Classification:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {EMERGENCY_TYPES.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleSelectType(item)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold shadow-xs ring-1 ring-rose-500'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & Station */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Target Station / Vessel:
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => {
                  setSelectedTarget(e.target.value);
                  const found = stations.find((s) => s.id === e.target.value);
                  if (found) {
                    setCustomLocation(`${found.name} (${found.region})`);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:border-rose-500 focus:outline-none"
              >
                <option value="bharati">Bharati Station (Larsemann Hills)</option>
                <option value="maitri">Maitri Station (Schirmacher Oasis)</option>
                <option value="himadri">Himadri Station (Ny-Ålesund, Arctic)</option>
                <option value="vessel_golovnin">MV Vasiliy Golovnin (Southern Ocean)</option>
                <option value="cape_town">Cape Town Staging Port</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Severity Level:
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as EmergencySeverity)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:border-rose-500 focus:outline-none"
              >
                <option value="CRITICAL">CRITICAL (Immediate Threat to Life/Safety)</option>
                <option value="HIGH">HIGH (Major Damage / Field Hazard)</option>
                <option value="MEDIUM">MEDIUM (System Warning / Caution)</option>
                <option value="LOW">LOW (Informational Incident)</option>
              </select>
            </div>
          </div>

          {/* Reporter & Specific Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Reported By (Officer / Scientist):
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="e.g. Arun Kumar"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:border-rose-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Specific Location Detail:
              </label>
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="e.g. Habitation Pod 3 / Polar Traverse Km 12"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:border-rose-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Incident Situation & Hazards:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what occurred, immediate casualties, and critical response required..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:border-rose-500 focus:outline-none"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center gap-2 shadow-md transition"
            >
              <Send className="w-4 h-4" />
              <span>TRANSMIT EMERGENCY SOS NOW</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
