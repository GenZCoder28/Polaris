import React, { useState } from 'react';
import { 
  AssetMasterRecord, 
  ControlledAssetStatus, 
  ControlledAssetCondition, 
  AssetCategory, 
  MaintenanceType, 
  IncidentType, 
  IncidentSeverity,
  AssetIncidentRecord
} from '../../types.ts';
import { 
  Plus, 
  UserCheck, 
  Truck, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Cpu,
  RotateCcw
} from 'lucide-react';

const CATEGORIES: AssetCategory[] = [
  'Generators',
  'Snow vehicles',
  'Scientific instruments',
  'Radios',
  'GPS devices',
  'Computers',
  'Power equipment',
  'Safety equipment',
  'Field equipment',
  'Refrigeration equipment',
  'Specialized expedition equipment'
];

// -------------------------------------------------------------
// 1. ASSET REGISTRATION MODAL
// -------------------------------------------------------------
interface AssetRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (payload: Partial<AssetMasterRecord>) => Promise<void>;
  existingAssetsCount: number;
}

export const AssetRegistrationModal: React.FC<AssetRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  existingAssetsCount
}) => {
  const [assetId, setAssetId] = useState(`AST-${String(existingAssetsCount + 1).padStart(3, '0')}`);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('Generators');
  const [assetType, setAssetType] = useState('Polar Arctic Special');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [expeditionId, setExpeditionId] = useState('EXP-2025-044');
  const [assignedStation, setAssignedStation] = useState('bharati');
  const [assignedTeam, setAssignedTeam] = useState('Power & Utilities Team');
  const [assignedPersonnel, setAssignedPersonnel] = useState('Vikram Malhotra');
  const [currentLocation, setCurrentLocation] = useState('Bharati Station - Generator Hall');
  const [expectedLifetime, setExpectedLifetime] = useState('10,000 hrs');
  const [condition, setCondition] = useState<ControlledAssetCondition>('GOOD');
  const [status, setStatus] = useState<ControlledAssetStatus>('AVAILABLE');
  const [operatingHours, setOperatingHours] = useState(0);
  const [maintenanceThresholdHours, setMaintenanceThresholdHours] = useState(500);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !manufacturer.trim() || !model.trim()) {
      setErrorMsg('Asset Name, Manufacturer, and Model are required.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await onRegister({
        asset_id: assetId.trim().toUpperCase(),
        asset_name: assetName.trim(),
        asset_category: assetCategory,
        asset_type: assetType.trim(),
        serial_number: serialNumber.trim(),
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        description: description.trim(),
        expedition_id: expeditionId,
        assigned_station: assignedStation,
        assigned_team: assignedTeam.trim(),
        assigned_personnel: assignedPersonnel.trim(),
        current_location: currentLocation.trim(),
        acquisition_date: new Date().toISOString().split('T')[0],
        commission_date: new Date().toISOString().split('T')[0],
        expected_lifetime: expectedLifetime.trim(),
        condition,
        status,
        operating_hours: Number(operatingHours || 0),
        maintenance_threshold_hours: Number(maintenanceThresholdHours || 500),
        vibration_index: 1.0,
        health_score: condition === 'EXCELLENT' ? 100 : condition === 'GOOD' ? 95 : 75,
        notes: notes.trim()
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register asset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-blue-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Plus className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold">Register New Antarctic Expedition Asset</h3>
              <p className="text-xs text-slate-400">Master record creation with serial registration and initial assignment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Asset ID *</label>
              <input
                type="text"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Asset / Equipment Name *</label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g. Cummins 250kVA Polar Generator #3"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Category *</label>
              <select
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Equipment Type</label>
              <input
                type="text"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                placeholder="e.g. Heavy Snowcat Groomer"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Serial Number</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-POLAR-9921"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Manufacturer *</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Cummins Power Systems"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Model / Arctic Spec *</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. QSB7-G5 Polar Winterized"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Station *</label>
              <select
                value={assignedStation}
                onChange={(e) => setAssignedStation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="bharati">Bharati Station (Larsemann Hills)</option>
                <option value="maitri">Maitri Station (Schirmacher Oasis)</option>
                <option value="himadri">Himadri Station (Ny-Ålesund, Arctic)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ControlledAssetStatus)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_USE">IN_USE</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ControlledAssetCondition)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              >
                <option value="EXCELLENT">EXCELLENT (Brand New / Factory Calibrated)</option>
                <option value="GOOD">GOOD (Field Ready)</option>
                <option value="FAIR">FAIR (Operational with signs of wear)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Team</label>
              <input
                type="text"
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                placeholder="e.g. Power & Utilities Team"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Custodian / Personnel</label>
              <input
                type="text"
                value={assignedPersonnel}
                onChange={(e) => setAssignedPersonnel(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Current Physical Location</label>
              <input
                type="text"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="e.g. Bharati Station - Main Hangar"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Maintenance Service Limit (Hours)</label>
              <input
                type="number"
                value={maintenanceThresholdHours}
                onChange={(e) => setMaintenanceThresholdHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Technical Notes / Cold-Start Guidelines</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Block heater requirements, hydraulic fluid rating (-50°C), etc."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              {isSubmitting ? 'Registering...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. ASSET ASSIGNMENT MODAL (Section 6)
// -------------------------------------------------------------
interface AssetAssignmentModalProps {
  asset: AssetMasterRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (assetId: string, assignment: any) => Promise<void>;
}

export const AssetAssignmentModal: React.FC<AssetAssignmentModalProps> = ({
  asset,
  isOpen,
  onClose,
  onAssign
}) => {
  const [station, setStation] = useState(asset?.assigned_station || 'bharati');
  const [team, setTeam] = useState(asset?.assigned_team || 'Field Operations Team');
  const [personnel, setPersonnel] = useState(asset?.assigned_personnel || 'Arun Joshi');
  const [assignedLocation, setAssignedLocation] = useState(asset?.current_location || 'Field Camp A');
  const [notes, setNotes] = useState('Assigned for upcoming glaciology field traverse.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const isLocked = asset.status === 'DAMAGED' || asset.status === 'UNDER_MAINTENANCE' || asset.status === 'LOST';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setErrorMsg(`Cannot assign equipment while status is ${asset.status}.`);
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onAssign(asset.asset_id, {
        station,
        team,
        personnel,
        assignedLocation,
        notes
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Assignment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-blue-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">Assign Asset: {asset.asset_id}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {isLocked && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Warning:</strong> Asset is currently <strong>{asset.status}</strong>. Resolve maintenance/incident before deployment.
              </span>
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-slate-500 block">Equipment</span>
            <p className="text-sm font-bold text-slate-900">{asset.asset_name} ({asset.asset_category})</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Station *</label>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="bharati">Bharati Station</option>
                <option value="maitri">Maitri Station</option>
                <option value="himadri">Himadri Station</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Location *</label>
              <input
                type="text"
                value={assignedLocation}
                onChange={(e) => setAssignedLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Team / Department *</label>
              <input
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Individual Personnel Custodian *</label>
              <input
                type="text"
                value={personnel}
                onChange={(e) => setPersonnel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Mission Notes / Directive</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLocked}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. ASSET TRANSFER MODAL (Section 7 & 9)
// -------------------------------------------------------------
interface AssetTransferModalProps {
  asset: AssetMasterRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (assetId: string, transfer: any) => Promise<void>;
}

export const AssetTransferModal: React.FC<AssetTransferModalProps> = ({
  asset,
  isOpen,
  onClose,
  onTransfer
}) => {
  const [fromLocation, setFromLocation] = useState(asset?.current_location || '');
  const [toLocation, setToLocation] = useState('');
  const [personResponsible, setPersonResponsible] = useState('Logistics Officer');
  const [reason, setReason] = useState('Relocation for upcoming scientific campaign');
  const [notes, setNotes] = useState('Transit via snowcat sled convoy.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toLocation.trim()) {
      setErrorMsg('Destination location is required.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onTransfer(asset.asset_id, {
        fromLocation: fromLocation || asset.current_location,
        toLocation: toLocation.trim(),
        personResponsible,
        reason,
        notes
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-blue-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold">Transfer Asset: {asset.asset_id}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 block">Current Location</span>
            <span className="font-semibold text-slate-800">{asset.current_location}</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Destination Location *</label>
            <input
              type="text"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              placeholder="e.g. Field Camp A (Larsemann Hills), Maitri Cargo Yard..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Person Responsible *</label>
              <input
                type="text"
                value={personResponsible}
                onChange={(e) => setPersonResponsible(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reason for Transfer *</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Transfer & Transport Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Recording...' : 'Record Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. ASSET MAINTENANCE MODAL (Section 10 & 11)
// -------------------------------------------------------------
interface AssetMaintenanceModalProps {
  asset: AssetMasterRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordMaintenance: (assetId: string, record: any) => Promise<void>;
}

export const AssetMaintenanceModal: React.FC<AssetMaintenanceModalProps> = ({
  asset,
  isOpen,
  onClose,
  onRecordMaintenance
}) => {
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('PREVENTIVE');
  const [problem, setProblem] = useState('Routine 500-hour service & polar filtration check');
  const [inspectionDetails, setInspectionDetails] = useState('Checked injectors, block heater, fuel filter differential pressure.');
  const [workPerformed, setWorkPerformed] = useState('Flushed lube oil, replaced dual fuel filters, lubricated bearings.');
  const [technician, setTechnician] = useState('Vikram Malhotra (Senior Heavy Diesel Mech)');
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('2026-11-20');
  const [maintenanceStatus, setMaintenanceStatus] = useState<'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'>('COMPLETED');
  const [partsUsed, setPartsUsed] = useState('2x Polar Fuel Filter FF5776, 38L Arctic Lube 0W-40');
  const [resetOperatingMeter, setResetOperatingMeter] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await onRecordMaintenance(asset.asset_id, {
        maintenanceType,
        problem,
        inspectionDetails,
        workPerformed,
        technician,
        maintenanceDate,
        nextMaintenanceDate,
        maintenanceStatus,
        partsUsed,
        resetOperatingMeter: maintenanceStatus === 'COMPLETED' ? resetOperatingMeter : false,
        conditionAfterMaintenance: 'GOOD'
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record maintenance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-blue-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">Log Maintenance: {asset.asset_id}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Maintenance Type *</label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              >
                <option value="PREVENTIVE">PREVENTIVE (Routine Service)</option>
                <option value="CORRECTIVE">CORRECTIVE (Repair / Fault Fix)</option>
                <option value="OVERHAUL">OVERHAUL (Major Refurbishment)</option>
                <option value="CALIBRATION">CALIBRATION (Precision Recalibration)</option>
                <option value="EMERGENCY">EMERGENCY (Field Breakdown)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Maintenance Status *</label>
              <select
                value={maintenanceStatus}
                onChange={(e) => setMaintenanceStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              >
                <option value="COMPLETED">COMPLETED (Return to Available)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Under Maintenance)</option>
                <option value="SCHEDULED">SCHEDULED (Upcoming Window)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Problem / Trigger Reason *</label>
            <input
              type="text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Inspection Details</label>
            <input
              type="text"
              value={inspectionDetails}
              onChange={(e) => setInspectionDetails(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Work Performed *</label>
            <textarea
              rows={2}
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Technician *</label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Next Scheduled Date</label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Spares / Consumable Parts Used</label>
            <input
              type="text"
              value={partsUsed}
              onChange={(e) => setPartsUsed(e.target.value)}
              placeholder="e.g. Filter Kit, O-Rings, Hydraulic Couplings..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          {maintenanceStatus === 'COMPLETED' && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
              <input
                type="checkbox"
                id="resetMeter"
                checked={resetOperatingMeter}
                onChange={(e) => setResetOperatingMeter(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <label htmlFor="resetMeter" className="cursor-pointer font-medium">
                Reset interval operating run-hours and restore health score to 98%
              </label>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Maintenance Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. ASSET INCIDENT & DAMAGE MODAL (Section 12 & 36)
// -------------------------------------------------------------
interface AssetIncidentModalProps {
  asset: AssetMasterRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onReportIncident: (assetId: string, incident: any) => Promise<void>;
}

export const AssetIncidentModal: React.FC<AssetIncidentModalProps> = ({
  asset,
  isOpen,
  onClose,
  onReportIncident
}) => {
  const [incidentType, setIncidentType] = useState<IncidentType>('DAMAGED');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [description, setDescription] = useState('Antenna sheared off during severe katabatic gust.');
  const [location, setLocation] = useState(asset?.current_location || '');
  const [reportedBy, setReportedBy] = useState('Capt. Rakesh Mehta');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onReportIncident(asset.asset_id, {
        incidentType,
        severity,
        description,
        location: location || asset.current_location,
        reportedBy
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to report incident.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-rose-950 text-white flex items-center justify-between border-b border-rose-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold">Report Asset Incident: {asset.asset_id}</h3>
          </div>
          <button onClick={onClose} className="text-rose-300 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg text-xs text-rose-800">
            Reporting will automatically change asset status to <strong>{incidentType === 'LOST' || incidentType === 'MISSING' ? 'LOST' : 'DAMAGED'}</strong>, locking it from deployment until repaired or recovered.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Incident Type *</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              >
                <option value="DAMAGED">DAMAGED (Physical Breakdown)</option>
                <option value="FAILURE">FAILURE (Operational/Electrical Loss)</option>
                <option value="LOST">LOST (Unrecovered in Traverse)</option>
                <option value="MISSING">MISSING (Inventory Discrepancy)</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Severity *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-rose-700"
              >
                <option value="CRITICAL">CRITICAL (Total mission hazard)</option>
                <option value="HIGH">HIGH (Major operational loss)</option>
                <option value="MEDIUM">MEDIUM (Repairable locally)</option>
                <option value="LOW">LOW (Cosmetic / Minor impact)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Incident Description *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Incident Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reported By *</label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Incident Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 6. ASSET INCIDENT RESOLUTION MODAL
// -------------------------------------------------------------
interface AssetIncidentResolutionModalProps {
  incident: AssetIncidentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (incidentCode: string, resolution: any) => Promise<void>;
}

export const AssetIncidentResolutionModal: React.FC<AssetIncidentResolutionModalProps> = ({
  incident,
  isOpen,
  onClose,
  onResolve
}) => {
  const [notes, setNotes] = useState('Replacement antenna assembly fitted and impedance tested. Ready for service.');
  const [newStatus, setNewStatus] = useState<ControlledAssetStatus>('AVAILABLE');
  const [newCondition, setNewCondition] = useState<ControlledAssetCondition>('GOOD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !incident) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onResolve(incident.incident_code, {
        notes,
        newStatus,
        newCondition
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Resolution failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-emerald-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base font-bold">Resolve Incident: {incident.incident_code}</h3>
          </div>
          <button onClick={onClose} className="text-emerald-300 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 block">Incident Details ({incident.incident_type})</span>
            <p className="font-semibold text-slate-900">{incident.description}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Resolution & Repair Actions *</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Restored Asset Status *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ControlledAssetStatus)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-emerald-800"
              >
                <option value="AVAILABLE">AVAILABLE (Station Reserve)</option>
                <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE (Further testing)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Restored Asset Condition *</label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as ControlledAssetCondition)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              >
                <option value="GOOD">GOOD (Nominal)</option>
                <option value="FAIR">FAIR (Functional with wear)</option>
                <option value="EXCELLENT">EXCELLENT (Rebuilt)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Resolving...' : 'Confirm Resolution & Return to Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
