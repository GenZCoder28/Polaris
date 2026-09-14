import React, { useState, useEffect } from 'react';
import { 
  Asset, 
  Station, 
  AssetMasterRecord, 
  AssetMaintenanceRecord, 
  AssetIncidentRecord, 
  AssetAuditLogRecord 
} from '../types.ts';
import { 
  Cpu, 
  BrainCircuit, 
  Wrench, 
  AlertTriangle, 
  Ship, 
  FileText, 
  Plus, 
  Activity, 
  Layers, 
  ShieldCheck, 
  RotateCw,
  RefreshCw,
  Sliders,
  CheckCircle2
} from 'lucide-react';

import { AssetRegistryView } from './assets/AssetRegistryView.tsx';
import { AssetDetailModal } from './assets/AssetDetailModal.tsx';
import { 
  AssetRegistrationModal, 
  AssetAssignmentModal, 
  AssetTransferModal, 
  AssetMaintenanceModal, 
  AssetIncidentModal,
  AssetIncidentResolutionModal 
} from './assets/AssetActionModals.tsx';
import { AssetMLPredictionDashboard } from './assets/AssetMLPredictionDashboard.tsx';
import { AssetSupplyWorkflowView } from './assets/AssetSupplyWorkflowView.tsx';
import { 
  AssetMaintenanceListView, 
  AssetIncidentsListView, 
  AssetAuditTrailView 
} from './assets/AssetMaintenanceAndIncidentViews.tsx';

interface AssetManagementProps {
  assets: Asset[];
  stations: Station[];
  onUpdateAssetHours?: (assetId: string, additionalHours: number) => void;
  onServiceAsset?: (assetId: string) => void;
}

export const AssetManagement: React.FC<AssetManagementProps> = ({
  assets: legacyAssets,
  stations,
  onUpdateAssetHours,
  onServiceAsset
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'registry' | 'ml_intelligence' | 'maintenance' | 'incidents' | 'supply_workflow' | 'audit_trail'
  >('registry');

  // Master asset list from API
  const [assetList, setAssetList] = useState<AssetMasterRecord[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<AssetMaintenanceRecord[]>([]);
  const [incidentsList, setIncidentsList] = useState<AssetIncidentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AssetAuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [historyAssetId, setHistoryAssetId] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  // Action Modals
  const [selectedAssetForAssign, setSelectedAssetForAssign] = useState<AssetMasterRecord | null>(null);
  const [selectedAssetForTransfer, setSelectedAssetForTransfer] = useState<AssetMasterRecord | null>(null);
  const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = useState<AssetMasterRecord | null>(null);
  const [selectedAssetForIncident, setSelectedAssetForIncident] = useState<AssetMasterRecord | null>(null);
  const [selectedIncidentForResolve, setSelectedIncidentForResolve] = useState<AssetIncidentRecord | null>(null);

  // Prepopulated shortage for supply workflow
  const [prefilledSupplyCategory, setPrefilledSupplyCategory] = useState<string | undefined>(undefined);
  const [prefilledSupplyShortage, setPrefilledSupplyShortage] = useState<number | undefined>(undefined);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [assetsRes, maintRes, incRes, auditRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/assets/maintenance'),
        fetch('/api/assets/incidents'),
        fetch('/api/assets/audit-logs')
      ]);

      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssetList(data);
      }
      if (maintRes.ok) setMaintenanceList(await maintRes.json());
      if (incRes.ok) setIncidentsList(await incRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (e: any) {
      console.warn('Notice loading assets from API:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Handlers for action modals
  const handleRegisterAsset = async (payload: Partial<AssetMasterRecord>) => {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    triggerToast(`Asset ${payload.asset_id} registered successfully with unique QR barcode seal.`);
    fetchAllData();
  };

  const handleAssignAsset = async (assetId: string, assignment: any) => {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Assignment failed');
    }
    triggerToast(`Asset ${assetId} assigned to ${assignment.personnel || assignment.team}.`);
    fetchAllData();
  };

  const handleTransferAsset = async (assetId: string, transfer: any) => {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transfer)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Transfer failed');
    }
    triggerToast(`Asset ${assetId} location updated to: ${transfer.toLocation}.`);
    fetchAllData();
  };

  const handleRecordMaintenance = async (assetId: string, record: any) => {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Maintenance logging failed');
    }
    triggerToast(`Maintenance record logged for ${assetId}. Status updated.`);
    fetchAllData();
  };

  const handleReportIncident = async (assetId: string, incident: any) => {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Incident reporting failed');
    }
    triggerToast(`Incident logged for ${assetId}. Status changed to DAMAGED.`);
    fetchAllData();
  };

  const handleResolveIncident = async (incidentCode: string, resolution: any) => {
    const res = await fetch(`/api/assets/incidents/${encodeURIComponent(incidentCode)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolution)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Incident resolution failed');
    }
    triggerToast(`Incident ${incidentCode} marked RESOLVED. Asset restored to AVAILABLE.`);
    fetchAllData();
  };

  const handleOpenSupplyForShortage = (category?: string, shortageQty?: number) => {
    setPrefilledSupplyCategory(category);
    setPrefilledSupplyShortage(shortageQty);
    setActiveSubTab('supply_workflow');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-blue-400 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Sub-navigation Tab Bar */}
      <div className="bg-white border border-blue-200/80 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('registry')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'registry'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Master Equipment Registry</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubTab === 'registry' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {assetList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ml_intelligence')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'ml_intelligence'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
            <span>ML Requirement & Risk Forecast</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-mono">
              Assistive ML
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('maintenance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'maintenance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-500" />
            <span>Preventative Maintenance</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubTab === 'maintenance' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {maintenanceList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('incidents')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'incidents'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Damage & Incident Desk</span>
            {incidentsList.filter(i => i.status !== 'RESOLVED').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                {incidentsList.filter(i => i.status !== 'RESOLVED').length} Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('supply_workflow')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'supply_workflow'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Ship className="w-4 h-4 text-blue-500" />
            <span>Resupply & India Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('audit_trail')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'audit_trail'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Audit Trail</span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchAllData}
          disabled={isLoading}
          title="Refresh All Asset Datasets"
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Subtab Views */}
      {activeSubTab === 'registry' && (
        <AssetRegistryView
          assets={assetList}
          onOpenRegister={() => setIsRegisterOpen(true)}
          onSelectAssetHistory={(id) => setHistoryAssetId(id)}
          onTriggerAssign={(asset) => setSelectedAssetForAssign(asset)}
          onTriggerTransfer={(asset) => setSelectedAssetForTransfer(asset)}
          onTriggerMaintenance={(asset) => setSelectedAssetForMaintenance(asset)}
          onTriggerIncident={(asset) => setSelectedAssetForIncident(asset)}
        />
      )}

      {activeSubTab === 'ml_intelligence' && (
        <AssetMLPredictionDashboard
          onOpenSupplyWorkflow={handleOpenSupplyForShortage}
        />
      )}

      {activeSubTab === 'maintenance' && (
        <AssetMaintenanceListView
          maintenanceList={maintenanceList}
          onOpenScheduleModal={() => {
            if (assetList.length > 0) setSelectedAssetForMaintenance(assetList[0]);
          }}
        />
      )}

      {activeSubTab === 'incidents' && (
        <AssetIncidentsListView
          incidents={incidentsList}
          onTriggerResolveIncident={(inc) => setSelectedIncidentForResolve(inc)}
        />
      )}

      {activeSubTab === 'supply_workflow' && (
        <AssetSupplyWorkflowView
          onRefreshMasterAssets={fetchAllData}
          initialCategory={prefilledSupplyCategory}
          initialShortage={prefilledSupplyShortage}
        />
      )}

      {activeSubTab === 'audit_trail' && (
        <AssetAuditTrailView
          auditLogs={auditLogs}
        />
      )}

      {/* Detail & History Modal */}
      <AssetDetailModal
        assetId={historyAssetId}
        isOpen={Boolean(historyAssetId)}
        onClose={() => setHistoryAssetId(null)}
        onTriggerAssign={(asset) => {
          setHistoryAssetId(null);
          setSelectedAssetForAssign(asset);
        }}
        onTriggerTransfer={(asset) => {
          setHistoryAssetId(null);
          setSelectedAssetForTransfer(asset);
        }}
        onTriggerMaintenance={(asset) => {
          setHistoryAssetId(null);
          setSelectedAssetForMaintenance(asset);
        }}
        onTriggerIncident={(asset) => {
          setHistoryAssetId(null);
          setSelectedAssetForIncident(asset);
        }}
      />

      {/* Registration Modal */}
      <AssetRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleRegisterAsset}
        existingAssetsCount={assetList.length}
      />

      {/* Assignment Modal */}
      <AssetAssignmentModal
        asset={selectedAssetForAssign}
        isOpen={Boolean(selectedAssetForAssign)}
        onClose={() => setSelectedAssetForAssign(null)}
        onAssign={handleAssignAsset}
      />

      {/* Transfer Modal */}
      <AssetTransferModal
        asset={selectedAssetForTransfer}
        isOpen={Boolean(selectedAssetForTransfer)}
        onClose={() => setSelectedAssetForTransfer(null)}
        onTransfer={handleTransferAsset}
      />

      {/* Maintenance Modal */}
      <AssetMaintenanceModal
        asset={selectedAssetForMaintenance}
        isOpen={Boolean(selectedAssetForMaintenance)}
        onClose={() => setSelectedAssetForMaintenance(null)}
        onRecordMaintenance={handleRecordMaintenance}
      />

      {/* Incident Modal */}
      <AssetIncidentModal
        asset={selectedAssetForIncident}
        isOpen={Boolean(selectedAssetForIncident)}
        onClose={() => setSelectedAssetForIncident(null)}
        onReportIncident={handleReportIncident}
      />

      {/* Incident Resolution Modal */}
      <AssetIncidentResolutionModal
        incident={selectedIncidentForResolve}
        isOpen={Boolean(selectedIncidentForResolve)}
        onClose={() => setSelectedIncidentForResolve(null)}
        onResolve={handleResolveIncident}
      />
    </div>
  );
};
