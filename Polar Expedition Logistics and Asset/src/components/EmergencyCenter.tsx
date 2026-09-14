import React, { useState, useEffect } from 'react';
import { EmergencyIncident, Station } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  Radio, 
  Plus, 
  Building2, 
  Clock, 
  X,
  Send,
  Users,
  ShieldCheck,
  Search
} from 'lucide-react';
import { INITIAL_EMERGENCIES } from '../data/initialData';

interface EmergencyCenterProps {
  emergencies?: EmergencyIncident[];
  stations: Station[];
  onTriggerEmergency?: (incident: Omit<EmergencyIncident, 'id'>) => void;
  onResolveEmergency?: (incidentId: string) => void;
  onExecuteEmergencyAction?: (incidentId: string, actionText: string) => void;
}

export const EmergencyCenter: React.FC<EmergencyCenterProps> = ({
  emergencies = [],
  stations = [],
  onTriggerEmergency,
  onResolveEmergency,
}) => {
  // Merge initial emergencies if prop is empty
  const [incidents, setIncidents] = useState<EmergencyIncident[]>(() => {
    return emergencies.length > 0 ? emergencies : INITIAL_EMERGENCIES;
  });

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New incident form
  const [newTitle, setNewTitle] = useState('');
  const [newStation, setNewStation] = useState('bharati');
  const [newSeverity, setNewSeverity] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newType, setNewType] = useState('WEATHER');
  const [newDesc, setNewDesc] = useState('');

  // Keep local list in sync if parent prop changes
  useEffect(() => {
    if (emergencies.length > 0) {
      setIncidents(emergencies);
    }
  }, [emergencies]);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleResolve = (id: string) => {
    if (onResolveEmergency) {
      onResolveEmergency(id);
    }
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'RESOLVED' } : inc));
    showToast(`Incident ${id} marked as resolved.`);
  };

  const handleAcknowledge = (id: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { 
          ...inc, 
          status: 'ACKNOWLEDGED' as any,
          actionsTaken: [...inc.actionsTaken, `Acknowledged by Station Commander at ${new Date().toLocaleTimeString()}`]
        };
      }
      return inc;
    }));
    showToast(`Incident ${id} acknowledged. Response dispatched.`);
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newInc: EmergencyIncident = {
      id: `EMG-${Date.now().toString().slice(-4)}`,
      stationId: newStation as any,
      title: newTitle,
      description: newDesc || 'Reported field incident under operational observation.',
      severity: newSeverity,
      type: newType as any,
      status: 'ACTIVE',
      reportedTime: 'Just now',
      affectedPersonnelCount: 4,
      incidentCommander: newStation === 'bharati' ? 'Dr. P. K. Sen' : 'Dr. Vikram Nair',
      availableResources: ['Emergency Habitation Pods', 'Medical Doctor on Standby', 'Backup Radios'],
      actionsTaken: ['Initial incident alert logged into NCPOR polar safety log.']
    };

    if (onTriggerEmergency) {
      onTriggerEmergency(newInc);
    }

    setIncidents(prev => [newInc, ...prev]);
    setShowReportModal(false);
    setNewTitle('');
    setNewDesc('');
    showToast(`Emergency reported: ${newTitle}`);
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter(inc => {
    const matchesStatus = 
      filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && inc.status !== 'RESOLVED') ||
      (filterStatus === 'RESOLVED' && inc.status === 'RESOLVED');
    
    const q = (searchQuery || '').toLowerCase();
    const title = (inc.title || '').toLowerCase();
    const desc = (inc.description || '').toLowerCase();
    const stId = (inc.stationId || '').toLowerCase();

    const matchesSearch = !q || title.includes(q) || desc.includes(q) || stId.includes(q);

    return matchesStatus && matchesSearch;
  });

  const activeCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Simplified Module Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-lg border ${
              activeCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Polar Emergency & Safety Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time safety alerts, incident response, and station life-support monitoring
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Status Overview Cards (Simple) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Active Incidents</span>
          <div className={`text-2xl font-bold font-mono mt-1 ${activeCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {activeCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {activeCount > 0 ? 'Immediate action required' : 'All stations nominal'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Station Status</span>
          <div className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Bharati & Maitri Operational</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Habitation life-support online</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Emergency Comms Link</span>
          <div className="text-sm font-bold text-blue-700 mt-2 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-blue-600" />
            <span>Iridium & Inmarsat Active</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">24/7 direct link to NCPOR Goa</span>
        </div>
      </div>

      {/* Incidents Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({incidents.length})
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'ACTIVE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('RESOLVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Resolved
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-60"
            />
          </div>
        </div>

        {/* Incidents List */}
        <div className="space-y-3">
          {filteredIncidents.map((incident, idx) => {
            const isResolved = incident.status === 'RESOLVED';
            const isHigh = incident.severity === 'HIGH';
            const incidentKey = incident.id ? `${incident.id}-${idx}` : `emergency-item-${idx}`;

            return (
              <div
                key={incidentKey}
                className={`p-4 rounded-xl border transition-all ${
                  isResolved 
                    ? 'bg-slate-50/70 border-slate-200 opacity-80' 
                    : isHigh
                    ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                    : 'bg-amber-50/40 border-amber-200 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-white border border-slate-200 text-slate-700">
                        {incident.id || `EMG-${idx + 1}`}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isHigh
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {incident.severity} SEVERITY
                      </span>
                      <span className="text-xs font-semibold text-slate-700 uppercase">
                        {incident.stationId} Station
                      </span>
                      <span className="text-xs text-slate-400 font-mono">• {incident.reportedTime}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1">
                      {incident.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                      {incident.description}
                    </p>

                    {incident.incidentCommander && (
                      <div className="text-[11px] text-slate-500 mt-2">
                        Incident Lead: <strong className="text-slate-800">{incident.incidentCommander}</strong>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center gap-2 shrink-0">
                    {!isResolved && (
                      <>
                        <button
                          onClick={() => handleAcknowledge(incident.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition cursor-pointer shadow-2xs"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleResolve(incident.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer shadow-xs"
                        >
                          Mark Resolved
                        </button>
                      </>
                    )}
                    {isResolved && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredIncidents.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
              No incidents found matching the selected filter.
            </div>
          )}
        </div>
      </div>

      {/* Emergency Satellite Contact Directory */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-blue-600" />
          <span>Emergency Hotlines & Satellite Directory</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900">NCPOR Operations Center</div>
            <div className="text-slate-500 text-[11px]">Goa, India (24/7 Command)</div>
            <div className="mt-2 font-mono font-semibold text-blue-700">+91-832-2525600</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900">Bharati Station SatPhone</div>
            <div className="text-slate-500 text-[11px]">Larsemann Hills (Iridium-9555)</div>
            <div className="mt-2 font-mono font-semibold text-blue-700">+8816-318-50123</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900">Maitri Station Inmarsat</div>
            <div className="text-slate-500 text-[11px]">Schirmacher Oasis (BGAN Link)</div>
            <div className="mt-2 font-mono font-semibold text-blue-700">+870-764-89012</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900">MRCC Cape Town (SAR)</div>
            <div className="text-slate-500 text-[11px]">Maritime Search & Rescue</div>
            <div className="mt-2 font-mono font-semibold text-blue-700">+27-21-938-3300</div>
          </div>
        </div>
      </div>

      {/* Simple Report Emergency Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm">Report Station Emergency</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Incident Headline</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Auxiliary generator voltage fluctuation..."
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Station Location</label>
                  <select
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 cursor-pointer"
                  >
                    <option value="bharati">Bharati Station</option>
                    <option value="maitri">Maitri Station</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Severity Level</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 cursor-pointer"
                  >
                    <option value="HIGH">High (Critical)</option>
                    <option value="MEDIUM">Medium (Urgent)</option>
                    <option value="LOW">Low (Advisory)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Field Notes</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the condition, affected systems, and immediate safety measures..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
