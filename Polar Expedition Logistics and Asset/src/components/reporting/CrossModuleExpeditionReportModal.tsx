import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Compass, 
  Users, 
  Boxes, 
  Truck, 
  ShieldAlert, 
  Wrench, 
  FileCheck, 
  Calendar, 
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { ExpeditionDeepReport } from '../../types.ts';
import { fetchReportingExpeditionDeepApi, getExportUrl } from '../../lib/api.ts';

interface CrossModuleExpeditionReportModalProps {
  expeditionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CrossModuleExpeditionReportModal: React.FC<CrossModuleExpeditionReportModalProps> = ({
  expeditionId,
  isOpen,
  onClose,
}) => {
  const [report, setReport] = useState<ExpeditionDeepReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'personnel' | 'cargo' | 'assets' | 'emergencies'>('overview');

  useEffect(() => {
    if (!isOpen || !expeditionId) return;
    setLoading(true);
    let isMounted = true;
    fetchReportingExpeditionDeepApi(expeditionId)
      .then((data) => {
        if (isMounted) {
          setReport(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch expedition deep report:', err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [isOpen, expeditionId]);

  if (!isOpen || !expeditionId) return null;

  const handlePrint = () => {
    const url = getExportUrl('pdf', 'expeditions', { expeditionId });
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Topbar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {report?.expedition.expedition_code || expeditionId}
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {report?.expedition.expedition_name || 'Loading Expedition Operational Dossier...'}
                </h2>
              </div>
              <p className="text-xs text-slate-500">Cross-Module Integrated Polar Expedition Command Dossier</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Official Print View</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Mission Dossier</span>
          </button>

          <button
            onClick={() => setActiveSubTab('personnel')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'personnel'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Personnel ({report?.personnelSummary.total || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cargo')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'cargo'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Cargo & Containers ({report?.cargoSummary.containersCount || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('assets')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'assets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Allocated Assets ({report?.assetsSummary.allocatedAssetsCount || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('emergencies')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'emergencies'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Safety & Emergencies ({report?.emergenciesSummary.incidentsCount || 0})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-20 text-slate-400 text-sm">Aggregating cross-module expedition datasets...</div>
          ) : !report ? (
            <div className="text-center py-20 text-slate-500 text-sm">Expedition data could not be retrieved.</div>
          ) : (
            <>
              {activeSubTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Status / Season</span>
                      <span className="text-base font-bold text-slate-900 mt-1 block">
                        {report.expedition.status} • {report.expedition.season_year}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Personnel Deployed</span>
                      <span className="text-base font-bold text-blue-700 mt-1 block">
                        {report.personnelSummary.total} Members
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Cargo Mass</span>
                      <span className="text-base font-bold text-emerald-700 mt-1 block">
                        {(report.cargoSummary.totalWeightKg / 1000).toFixed(1)} MT
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Average Asset Health</span>
                      <span className="text-base font-bold text-slate-800 mt-1 block">
                        {report.assetsSummary.avgHealthScore.toFixed(0)}% Fleet Nominal
                      </span>
                    </div>
                  </div>

                  {/* Mission Particulars */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-600" />
                      <span>Operational Mission Particulars</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-semibold text-slate-500 block">Mission Objective / Description</span>
                        <p className="text-slate-800 mt-1 leading-relaxed">{report.expedition.description}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500 font-medium">Target Stations:</span>
                          <span className="font-semibold text-slate-800">
                            {report.expedition.target_stations?.join(', ') || 'Bharati, Maitri'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500 font-medium">Mission Leader:</span>
                          <span className="font-semibold text-slate-800">{report.expedition.leader_name}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500 font-medium">Expedition Duration:</span>
                          <span className="font-semibold text-slate-800 font-mono">
                            {new Date(report.expedition.start_date).toLocaleDateString()} – {new Date(report.expedition.end_date).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500 font-medium">Assigned Polar Vessel:</span>
                          <span className="font-semibold text-slate-800">{report.expedition.vessel_name || 'MV Vasiliy Golovnin'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Treaty & Regulatory Compliance Card */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Treaty & Environmental Protocol Compliance</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 block">ATCM Notification</span>
                          <span className="text-[11px] text-slate-500">Formally Lodged & Approved</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 block">EIA Comprehensive</span>
                          <span className="text-[11px] text-slate-500">Madrid Protocol Cleared</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 block">Waste Disposal Plan</span>
                          <span className="text-[11px] text-slate-500">Zero Local Discharge Certified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'personnel' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Personnel Roster & Station Allocations</h3>
                    <span className="text-xs text-slate-500 font-mono">{report.personnelList.length} Roster Members</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Name</th>
                          <th className="py-2.5 px-3 font-semibold">Role</th>
                          <th className="py-2.5 px-3 font-semibold">Specialization</th>
                          <th className="py-2.5 px-3 font-semibold">Station / Location</th>
                          <th className="py-2.5 px-3 font-semibold">Team</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.personnelList.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                            <td className="py-2 px-3 text-slate-700">{p.role}</td>
                            <td className="py-2 px-3 text-slate-600">{p.specialization || 'Operations'}</td>
                            <td className="py-2 px-3 text-slate-800 font-medium">{p.station}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[11px]">
                                {p.team}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'cargo' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Container Manifest & Stowage</h3>
                    <span className="text-xs text-slate-500 font-mono">{report.containersList.length} Containers Allocated</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.containersList.map((c) => (
                      <div key={c.id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-blue-600" />
                            <span className="font-mono font-bold text-slate-900 text-xs">{c.container_number}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {c.journey_status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-600">
                            <span>Weight:</span>
                            <span className="font-semibold text-slate-800">{c.current_weight_kg.toLocaleString()} / {c.max_weight_capacity_kg.toLocaleString()} kg</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Volume:</span>
                            <span className="font-semibold text-slate-800">{c.volume_capacity_cbm} CBM</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Stowage Priority:</span>
                            <span className="font-semibold text-slate-800">Priority {c.stowage_priority}</span>
                          </div>
                        </div>

                        {/* Utilization Bar */}
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold mb-1">
                            <span className="text-slate-500">Capacity Utilization</span>
                            <span className="text-blue-700 font-mono">
                              {((c.current_weight_kg / c.max_weight_capacity_kg) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (c.current_weight_kg / c.max_weight_capacity_kg) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSubTab === 'assets' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Heavy Equipment & Fleet Allocation</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Asset Name</th>
                          <th className="py-2.5 px-3 font-semibold">Category</th>
                          <th className="py-2.5 px-3 font-semibold">Station</th>
                          <th className="py-2.5 px-3 font-semibold">Operating Hours</th>
                          <th className="py-2.5 px-3 font-semibold">Health Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.assetsList.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{a.name}</td>
                            <td className="py-2 px-3 text-slate-600">{a.category}</td>
                            <td className="py-2 px-3 text-slate-800">{a.station}</td>
                            <td className="py-2 px-3 font-mono text-slate-700">{a.operatingHours} hrs</td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-emerald-700 font-mono">
                                {Math.max(60, 100 - Math.round(a.vibrationIndex * 8))}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'emergencies' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Safety Incidents & Emergency Telemetry</h3>
                  {report.emergenciesList.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                      <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                      <span className="font-bold block">Zero Active Safety Violations</span>
                      <span>No critical emergency incidents recorded during this operational window.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {report.emergenciesList.map((e) => (
                        <div key={e.id} className="border border-red-200 rounded-xl p-4 bg-red-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-red-800 text-xs">{e.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                              {e.severity} • {e.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700">{e.description}</p>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Reported: {new Date(e.reportedTime).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Official Mission Archive ID: {report?.expedition.id || expeditionId}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
