import fs from 'fs';
import path from 'path';
import { db } from './index.ts';
import { 
  assetsMaster, 
  assetAssignments, 
  assetTransfers, 
  assetMaintenanceRecords, 
  assetIncidents, 
  assetPredictions, 
  assetSupplyRequests, 
  assetNotifications, 
  assetAuditLogs,
  assetModelPerformanceLogs 
} from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { 
  INITIAL_ASSETS_MASTER, 
  INITIAL_ASSET_ASSIGNMENTS, 
  INITIAL_ASSET_TRANSFERS, 
  INITIAL_ASSET_MAINTENANCE, 
  INITIAL_ASSET_INCIDENTS, 
  INITIAL_ASSET_PREDICTIONS, 
  INITIAL_ASSET_SUPPLY_REQUESTS, 
  INITIAL_ASSET_NOTIFICATIONS,
  RESPONSIBLE_ASSET_OFFICER_CONFIG 
} from '../data/initialAssetMaster.ts';
import { 
  AssetMasterRecord, 
  AssetAssignmentRecord, 
  AssetTransferRecord, 
  AssetMaintenanceRecord, 
  AssetIncidentRecord, 
  AssetPredictionRecord, 
  AssetSupplyRequestRecord, 
  AssetNotificationRecord, 
  AssetAuditLogRecord, 
  ControlledAssetStatus, 
  ControlledAssetCondition 
} from '../types.ts';
import { 
  runEmbeddedAssetEnsemble, 
  assessAssetAvailabilityRisk, 
  runAssetModelTraining, 
  getLatestModelArtifact 
} from '../lib/assetMLService.ts';
import { 
  dispatchUnifiedSupplyNotification, 
  getAssetOfficerConfig, 
  updateAssetOfficerConfig 
} from '../lib/assetNotificationService.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const ASSET_STORE_FILE = path.join(DATA_DIR, 'asset_module_store.json');

export interface AssetStoreData {
  assets: AssetMasterRecord[];
  assignments: AssetAssignmentRecord[];
  transfers: AssetTransferRecord[];
  maintenance: AssetMaintenanceRecord[];
  incidents: AssetIncidentRecord[];
  predictions: AssetPredictionRecord[];
  supplyRequests: AssetSupplyRequestRecord[];
  notifications: AssetNotificationRecord[];
  auditLogs: AssetAuditLogRecord[];
  modelLogs: any[];
}

function buildInitialAssetStore(): AssetStoreData {
  return {
    assets: [...INITIAL_ASSETS_MASTER],
    assignments: [...INITIAL_ASSET_ASSIGNMENTS],
    transfers: [...INITIAL_ASSET_TRANSFERS],
    maintenance: [...INITIAL_ASSET_MAINTENANCE],
    incidents: [...INITIAL_ASSET_INCIDENTS],
    predictions: [...INITIAL_ASSET_PREDICTIONS],
    supplyRequests: [...INITIAL_ASSET_SUPPLY_REQUESTS],
    notifications: [...INITIAL_ASSET_NOTIFICATIONS],
    auditLogs: [
      {
        id: 1,
        asset_id: 'AST-001',
        user: 'System Bootstrapper',
        action: 'REGISTERED',
        previous_value: undefined,
        new_value: 'AST-001 Commissioned',
        details: 'Initial commissioning of Cummins 250kVA Generator at Bharati Station.',
        timestamp: '2023-12-05T14:30:00.000Z'
      },
      {
        id: 2,
        asset_id: 'AST-010',
        user: 'Capt. Rakesh Mehta',
        action: 'INCIDENT_REPORTED',
        previous_value: 'IN_USE',
        new_value: 'DAMAGED',
        details: 'VHF Tactical Antenna array sheared off at base mount during blizzard.',
        timestamp: '2026-09-08T18:45:00.000Z'
      }
    ],
    modelLogs: []
  };
}

let cachedAssetStore: AssetStoreData | null = null;

function ensureAssetStore(): AssetStoreData {
  if (cachedAssetStore) {
    return cachedAssetStore;
  }

  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {}
  }

  if (fs.existsSync(ASSET_STORE_FILE)) {
    try {
      const raw = fs.readFileSync(ASSET_STORE_FILE, 'utf-8');
      cachedAssetStore = JSON.parse(raw);
      return cachedAssetStore!;
    } catch (e) {
      console.warn('Failed to parse asset store file, re-seeding:', e);
    }
  }

  cachedAssetStore = buildInitialAssetStore();
  saveAssetStore(cachedAssetStore);
  return cachedAssetStore;
}

function saveAssetStore(data: AssetStoreData) {
  cachedAssetStore = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ASSET_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save asset store file:', e);
  }
}

// -------------------------------------------------------------
// ASSET AUDIT LOGGING HELPER
// -------------------------------------------------------------
export async function logAssetAudit(
  assetId: string,
  user: string,
  action: string,
  details: string,
  previousValue?: string,
  newValue?: string
) {
  const store = ensureAssetStore();
  const entry: AssetAuditLogRecord = {
    id: store.auditLogs.length + 1,
    asset_id: assetId,
    user: user || 'Authenticated Polar Officer',
    action,
    previous_value: previousValue,
    new_value: newValue,
    details,
    timestamp: new Date().toISOString()
  };

  store.auditLogs.unshift(entry);

  if (db) {
    try {
      await db.insert(assetAuditLogs).values({
        assetId,
        user: entry.user,
        action: entry.action,
        previousValue: entry.previous_value,
        newValue: entry.new_value,
        details: entry.details,
        timestamp: entry.timestamp
      });
    } catch (e) {
      // Handled via local store
    }
  }

  saveAssetStore(store);
  return entry;
}

// -------------------------------------------------------------
// ASSET REGISTRATION & QUERIES
// -------------------------------------------------------------
export async function getAssetsList(filters: {
  station?: string;
  category?: string;
  status?: string;
  condition?: string;
  expeditionId?: string;
  search?: string;
} = {}): Promise<AssetMasterRecord[]> {
  const store = ensureAssetStore();
  let list = [...store.assets];

  if (filters.station && filters.station !== 'ALL') {
    list = list.filter(a => a.assigned_station.toLowerCase() === filters.station!.toLowerCase());
  }

  if (filters.category && filters.category !== 'ALL') {
    list = list.filter(a => a.asset_category === filters.category);
  }

  if (filters.status && filters.status !== 'ALL') {
    list = list.filter(a => a.status === filters.status);
  }

  if (filters.condition && filters.condition !== 'ALL') {
    list = list.filter(a => a.condition === filters.condition);
  }

  if (filters.expeditionId && filters.expeditionId !== 'ALL') {
    list = list.filter(a => a.expedition_id === filters.expeditionId);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(a => 
      a.asset_id.toLowerCase().includes(q) ||
      a.asset_name.toLowerCase().includes(q) ||
      (a.serial_number && a.serial_number.toLowerCase().includes(q)) ||
      a.asset_type.toLowerCase().includes(q) ||
      a.assigned_team.toLowerCase().includes(q) ||
      a.assigned_personnel.toLowerCase().includes(q) ||
      a.current_location.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function getAssetById(assetIdOrCode: string): Promise<AssetMasterRecord | null> {
  const store = ensureAssetStore();
  const found = store.assets.find(a => 
    a.asset_id.toUpperCase() === assetIdOrCode.toUpperCase() || 
    String(a.id) === String(assetIdOrCode)
  );
  return found || null;
}

export async function registerAsset(
  payload: Partial<AssetMasterRecord>,
  user: string = 'Expedition Manager'
): Promise<AssetMasterRecord> {
  const store = ensureAssetStore();

  // Edge case: Asset ID must be unique
  const assetId = (payload.asset_id || `AST-${String(store.assets.length + 1).padStart(3, '0')}`).toUpperCase();
  if (store.assets.some(a => a.asset_id === assetId)) {
    throw new Error(`Asset ID '${assetId}' already exists. Asset ID must be unique.`);
  }

  // Edge case: Serial number should be unique when provided
  if (payload.serial_number && payload.serial_number.trim() !== '') {
    const dupSerial = store.assets.find(a => a.serial_number === payload.serial_number);
    if (dupSerial) {
      throw new Error(`Serial Number '${payload.serial_number}' is already assigned to asset ${dupSerial.asset_id} (${dupSerial.asset_name}).`);
    }
  }

  const newRecord: AssetMasterRecord = {
    id: store.assets.length + 1,
    asset_id: assetId,
    asset_name: payload.asset_name || 'Unnamed Equipment Asset',
    asset_category: payload.asset_category || 'Specialized expedition equipment',
    asset_type: payload.asset_type || 'Field Equipment',
    serial_number: payload.serial_number || '',
    manufacturer: payload.manufacturer || 'General Polar Supplies',
    model: payload.model || 'Standard Arctic Spec',
    description: payload.description || '',
    expedition_id: payload.expedition_id || 'EXP-2025-044',
    assigned_station: payload.assigned_station || 'bharati',
    assigned_team: payload.assigned_team || 'Unassigned',
    assigned_personnel: payload.assigned_personnel || 'Unassigned',
    current_location: payload.current_location || `${payload.assigned_station || 'Bharati'} Station Hangar`,
    acquisition_date: payload.acquisition_date || new Date().toISOString().split('T')[0],
    commission_date: payload.commission_date || new Date().toISOString().split('T')[0],
    expected_lifetime: payload.expected_lifetime || '5 years',
    condition: (payload.condition as ControlledAssetCondition) || 'GOOD',
    status: (payload.status as ControlledAssetStatus) || 'AVAILABLE',
    last_maintenance_date: payload.last_maintenance_date || new Date().toISOString().split('T')[0],
    next_maintenance_date: payload.next_maintenance_date || '',
    operating_hours: payload.operating_hours || 0,
    maintenance_threshold_hours: payload.maintenance_threshold_hours || 500,
    vibration_index: payload.vibration_index || 1.0,
    health_score: payload.health_score || 100,
    notes: payload.notes || 'Registered through Polar Asset Command.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.assets.push(newRecord);

  // If initially assigned to team or person, create assignment record
  if (newRecord.assigned_team !== 'Unassigned' || newRecord.assigned_personnel !== 'Unassigned') {
    newRecord.status = 'ASSIGNED';
    store.assignments.push({
      id: store.assignments.length + 1,
      asset_id: newRecord.asset_id,
      assigned_station: newRecord.assigned_station,
      assigned_team: newRecord.assigned_team,
      assigned_personnel: newRecord.assigned_personnel,
      expedition_id: newRecord.expedition_id,
      assigned_location: newRecord.current_location,
      assignment_date: new Date().toISOString().split('T')[0],
      release_date: null,
      assigned_by: user,
      notes: 'Initial assignment upon asset registration.',
      created_at: new Date().toISOString()
    });
  }

  // Create registration transfer entry
  store.transfers.push({
    id: store.transfers.length + 1,
    asset_id: newRecord.asset_id,
    from_location: 'Central Polar Warehouse (India / Cape Town)',
    to_location: newRecord.current_location,
    transfer_date: new Date().toISOString(),
    person_responsible: user,
    reason: 'Initial asset registration & expedition intake',
    notes: 'Intake and commissioning verified.',
    created_at: new Date().toISOString()
  });

  saveAssetStore(store);

  await logAssetAudit(
    newRecord.asset_id,
    user,
    'ASSET_REGISTERED',
    `Registered new asset ${newRecord.asset_id}: ${newRecord.asset_name} in category ${newRecord.asset_category}.`,
    undefined,
    newRecord.status
  );

  return newRecord;
}

export async function updateAsset(
  assetId: string,
  updates: Partial<AssetMasterRecord>,
  user: string = 'Polar Command'
): Promise<AssetMasterRecord> {
  const store = ensureAssetStore();
  const index = store.assets.findIndex(a => a.asset_id === assetId);
  if (index === -1) {
    throw new Error(`Asset '${assetId}' not found.`);
  }

  const existing = store.assets[index];
  const previousStatus = existing.status;

  // Validate status transitions (Section 4 & 36)
  if (updates.status && updates.status !== existing.status) {
    validateStatusTransition(existing, updates.status);
  }

  const updated: AssetMasterRecord = {
    ...existing,
    ...updates,
    asset_id: existing.asset_id, // Immutable ID
    updated_at: new Date().toISOString()
  };

  store.assets[index] = updated;
  saveAssetStore(store);

  await logAssetAudit(
    assetId,
    user,
    'ASSET_UPDATED',
    `Updated asset details for ${assetId}. Status: ${previousStatus} -> ${updated.status}.`,
    previousStatus,
    updated.status
  );

  return updated;
}

// -------------------------------------------------------------
// STATUS TRANSITION VALIDATION ENGINE (Section 4 & 36)
// -------------------------------------------------------------
function validateStatusTransition(asset: AssetMasterRecord, newStatus: ControlledAssetStatus) {
  // Controlled status list: AVAILABLE, ASSIGNED, IN_USE, UNDER_MAINTENANCE, DAMAGED, LOST, DECOMMISSIONED
  const validStatuses: ControlledAssetStatus[] = [
    'AVAILABLE', 'ASSIGNED', 'IN_USE', 'UNDER_MAINTENANCE', 'DAMAGED', 'LOST', 'DECOMMISSIONED'
  ];

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status '${newStatus}'. Allowed: ${validStatuses.join(', ')}`);
  }

  // Edge case: Cannot assign a DAMAGED or UNDER_MAINTENANCE asset
  if ((newStatus === 'ASSIGNED' || newStatus === 'IN_USE') && (asset.status === 'DAMAGED' || asset.status === 'UNDER_MAINTENANCE')) {
    throw new Error(`Asset ${asset.asset_id} is currently ${asset.status}. Damaged or maintenance-locked equipment cannot be deployed.`);
  }

  // Edge case: Cannot decommission an asset actively in use without releasing
  if (newStatus === 'DECOMMISSIONED' && asset.status === 'IN_USE') {
    throw new Error(`Cannot decommission asset ${asset.asset_id} while actively IN_USE. Release from team first.`);
  }
}

// -------------------------------------------------------------
// ASSET ASSIGNMENTS (Section 6)
// -------------------------------------------------------------
export async function assignAsset(
  assetId: string,
  assignment: {
    station: string;
    team: string;
    personnel: string;
    expeditionId?: string;
    assignedLocation?: string;
    notes?: string;
  },
  user: string = 'Commander'
): Promise<AssetMasterRecord> {
  const store = ensureAssetStore();
  const asset = store.assets.find(a => a.asset_id === assetId);
  if (!asset) {
    throw new Error(`Asset '${assetId}' not found.`);
  }

  // Edge case: Damaged or under maintenance
  if (asset.status === 'DAMAGED' || asset.status === 'UNDER_MAINTENANCE' || asset.status === 'LOST') {
    throw new Error(`Cannot assign asset ${assetId}: current status is ${asset.status}.`);
  }

  // Close previous active assignment if exists
  const activeAssignment = store.assignments.find(a => a.asset_id === assetId && !a.release_date);
  if (activeAssignment) {
    activeAssignment.release_date = new Date().toISOString().split('T')[0];
  }

  const newAssignment: AssetAssignmentRecord = {
    id: store.assignments.length + 1,
    asset_id: assetId,
    assigned_station: assignment.station || asset.assigned_station,
    assigned_team: assignment.team,
    assigned_personnel: assignment.personnel,
    expedition_id: assignment.expeditionId || asset.expedition_id,
    assigned_location: assignment.assignedLocation || asset.current_location,
    assignment_date: new Date().toISOString().split('T')[0],
    release_date: null,
    assigned_by: user,
    notes: assignment.notes || 'Field mission assignment.',
    created_at: new Date().toISOString()
  };

  store.assignments.push(newAssignment);

  // Update asset master
  const previousStatus = asset.status;
  asset.assigned_station = newAssignment.assigned_station;
  asset.assigned_team = newAssignment.assigned_team;
  asset.assigned_personnel = newAssignment.assigned_personnel;
  asset.current_location = newAssignment.assigned_location;
  asset.status = 'IN_USE';
  asset.updated_at = new Date().toISOString();

  saveAssetStore(store);

  await logAssetAudit(
    assetId,
    user,
    'ASSET_ASSIGNED',
    `Assigned ${assetId} to ${newAssignment.assigned_team} (${newAssignment.assigned_personnel}) at ${newAssignment.assigned_location}.`,
    previousStatus,
    'IN_USE'
  );

  return asset;
}

// -------------------------------------------------------------
// ASSET TRANSFERS (Section 7 & 9)
// -------------------------------------------------------------
export async function transferAsset(
  assetId: string,
  transfer: {
    fromLocation: string;
    toLocation: string;
    personResponsible: string;
    reason: string;
    notes?: string;
  },
  user: string = 'Logistics Officer'
): Promise<AssetMasterRecord> {
  const store = ensureAssetStore();
  const asset = store.assets.find(a => a.asset_id === assetId);
  if (!asset) {
    throw new Error(`Asset '${assetId}' not found.`);
  }

  // Edge case: Warning if under maintenance
  if (asset.status === 'UNDER_MAINTENANCE') {
    console.warn(`Asset ${assetId} transferred while under maintenance.`);
  }

  const transferRecord: AssetTransferRecord = {
    id: store.transfers.length + 1,
    asset_id: assetId,
    from_location: transfer.fromLocation || asset.current_location,
    to_location: transfer.toLocation,
    transfer_date: new Date().toISOString(),
    person_responsible: transfer.personResponsible || user,
    reason: transfer.reason,
    notes: transfer.notes || '',
    created_at: new Date().toISOString()
  };

  store.transfers.push(transferRecord);

  // Update current operational location
  const previousLocation = asset.current_location;
  asset.current_location = transfer.toLocation;
  asset.updated_at = new Date().toISOString();

  saveAssetStore(store);

  await logAssetAudit(
    assetId,
    user,
    'ASSET_TRANSFERRED',
    `Transferred ${assetId} from "${previousLocation}" to "${transfer.toLocation}". Reason: ${transfer.reason}`,
    previousLocation,
    transfer.toLocation
  );

  return asset;
}

// -------------------------------------------------------------
// MAINTENANCE MANAGEMENT (Section 10 & 11)
// -------------------------------------------------------------
export async function createMaintenanceRecord(
  assetId: string,
  payload: {
    maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'OVERHAUL' | 'CALIBRATION' | 'EMERGENCY';
    problem: string;
    inspectionDetails: string;
    workPerformed: string;
    technician: string;
    maintenanceDate: string;
    nextMaintenanceDate: string;
    maintenanceStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    partsUsed?: string;
    notes?: string;
    resetOperatingMeter?: boolean;
    conditionAfterMaintenance?: ControlledAssetCondition;
  },
  user: string = 'Lead Technician'
): Promise<AssetMaintenanceRecord> {
  const store = ensureAssetStore();
  const asset = store.assets.find(a => a.asset_id === assetId);
  if (!asset) {
    throw new Error(`Asset '${assetId}' not found.`);
  }

  const record: AssetMaintenanceRecord = {
    id: store.maintenance.length + 1,
    asset_id: assetId,
    maintenance_type: payload.maintenanceType,
    problem: payload.problem,
    inspection_details: payload.inspectionDetails,
    work_performed: payload.workPerformed,
    technician: payload.technician,
    maintenance_date: payload.maintenanceDate || new Date().toISOString().split('T')[0],
    next_maintenance_date: payload.nextMaintenanceDate || '',
    maintenance_status: payload.maintenanceStatus,
    parts_used: payload.partsUsed || '',
    notes: payload.notes || '',
    created_at: new Date().toISOString()
  };

  store.maintenance.push(record);

  // Reflect maintenance status on asset master
  const prevStatus = asset.status;
  if (payload.maintenanceStatus === 'IN_PROGRESS') {
    asset.status = 'UNDER_MAINTENANCE';
  } else if (payload.maintenanceStatus === 'COMPLETED') {
    asset.status = 'AVAILABLE';
    asset.last_maintenance_date = payload.maintenanceDate;
    if (payload.nextMaintenanceDate) {
      asset.next_maintenance_date = payload.nextMaintenanceDate;
    }
    if (payload.resetOperatingMeter) {
      asset.operating_hours = 0;
    }
    asset.condition = payload.conditionAfterMaintenance || 'GOOD';
    asset.vibration_index = 1.2;
    asset.health_score = 98;
  }

  asset.updated_at = new Date().toISOString();
  saveAssetStore(store);

  await logAssetAudit(
    assetId,
    user,
    'MAINTENANCE_RECORDED',
    `${payload.maintenanceType} maintenance recorded: ${payload.workPerformed} (Status: ${payload.maintenanceStatus}).`,
    prevStatus,
    asset.status
  );

  return record;
}

// -------------------------------------------------------------
// DAMAGE & INCIDENT MANAGEMENT (Section 12 & 36)
// -------------------------------------------------------------
export async function reportAssetIncident(
  assetId: string,
  payload: {
    incidentType: 'DAMAGED' | 'LOST' | 'MISSING' | 'FAILURE' | 'OTHER';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    location: string;
    reportedBy: string;
  },
  user: string = 'Operations Team'
): Promise<AssetIncidentRecord> {
  const store = ensureAssetStore();
  const asset = store.assets.find(a => a.asset_id === assetId);
  if (!asset) {
    throw new Error(`Asset '${assetId}' not found.`);
  }

  const incidentCode = `INC-AST-${new Date().getFullYear()}-${String(store.incidents.length + 1).padStart(3, '0')}`;
  const incident: AssetIncidentRecord = {
    id: store.incidents.length + 1,
    incident_code: incidentCode,
    asset_id: assetId,
    incident_type: payload.incidentType,
    severity: payload.severity,
    description: payload.description,
    location: payload.location || asset.current_location,
    reported_by: payload.reportedBy || user,
    reported_date: new Date().toISOString().split('T')[0],
    status: 'REPORTED',
    created_at: new Date().toISOString()
  };

  store.incidents.push(incident);

  // Update asset status to DAMAGED or LOST
  const previousStatus = asset.status;
  if (payload.incidentType === 'LOST' || payload.incidentType === 'MISSING') {
    asset.status = 'LOST';
  } else {
    asset.status = 'DAMAGED';
    asset.condition = 'CRITICAL';
    asset.health_score = 35;
  }

  asset.updated_at = new Date().toISOString();
  saveAssetStore(store);

  await logAssetAudit(
    assetId,
    user,
    'INCIDENT_REPORTED',
    `${payload.incidentType} Incident reported (${incidentCode}): ${payload.description}`,
    previousStatus,
    asset.status
  );

  return incident;
}

export async function resolveAssetIncident(
  incidentCode: string,
  resolution: {
    notes: string;
    newStatus?: ControlledAssetStatus;
    newCondition?: ControlledAssetCondition;
  },
  user: string = 'Lead Mechanic'
): Promise<AssetIncidentRecord> {
  const store = ensureAssetStore();
  const incident = store.incidents.find(i => i.incident_code === incidentCode);
  if (!incident) {
    throw new Error(`Incident '${incidentCode}' not found.`);
  }

  incident.status = 'REPAIRED';
  incident.resolution_notes = resolution.notes;
  incident.resolved_at = new Date().toISOString();

  const asset = store.assets.find(a => a.asset_id === incident.asset_id);
  if (asset) {
    // Edge case: Recovering an asset marked LOST
    const prevStatus = asset.status;
    asset.status = resolution.newStatus || 'AVAILABLE';
    asset.condition = resolution.newCondition || 'FAIR';
    asset.updated_at = new Date().toISOString();

    await logAssetAudit(
      asset.asset_id,
      user,
      'INCIDENT_RESOLVED',
      `Incident ${incidentCode} resolved: ${resolution.notes}`,
      prevStatus,
      asset.status
    );
  }

  saveAssetStore(store);
  return incident;
}

// -------------------------------------------------------------
// ASSET HISTORY & TIMELINE (Section 13)
// -------------------------------------------------------------
export async function getAssetFullHistory(assetId: string) {
  const store = ensureAssetStore();
  const asset = store.assets.find(a => a.asset_id === assetId);
  if (!asset) {
    throw new Error(`Asset '${assetId}' not found.`);
  }

  const assignments = store.assignments.filter(a => a.asset_id === assetId);
  const transfers = store.transfers.filter(t => t.asset_id === assetId);
  const maintenance = store.maintenance.filter(m => m.asset_id === assetId);
  const incidents = store.incidents.filter(i => i.asset_id === assetId);
  const audits = store.auditLogs.filter(a => a.asset_id === assetId);

  // Merge into unified chronological event timeline
  const timeline: Array<{
    type: 'REGISTRATION' | 'ASSIGNMENT' | 'TRANSFER' | 'MAINTENANCE' | 'INCIDENT' | 'AUDIT';
    date: string;
    title: string;
    description: string;
    actor: string;
    status: string;
  }> = [];

  // 1. Commissioning
  timeline.push({
    type: 'REGISTRATION',
    date: asset.commission_date,
    title: 'Asset Commissioned',
    description: `${asset.asset_name} commissioned at ${asset.assigned_station} station. Expected lifetime: ${asset.expected_lifetime}.`,
    actor: 'Station Acceptance Board',
    status: 'AVAILABLE'
  });

  // 2. Assignments
  assignments.forEach(a => {
    timeline.push({
      type: 'ASSIGNMENT',
      date: a.assignment_date,
      title: `Assigned to ${a.assigned_team}`,
      description: `Deployed to ${a.assigned_location} with ${a.assigned_personnel}. Notes: ${a.notes}`,
      actor: a.assigned_by,
      status: 'IN_USE'
    });
    if (a.release_date) {
      timeline.push({
        type: 'ASSIGNMENT',
        date: a.release_date,
        title: `Released from ${a.assigned_team}`,
        description: `Returned to station inventory reserve.`,
        actor: a.assigned_by,
        status: 'AVAILABLE'
      });
    }
  });

  // 3. Transfers
  transfers.forEach(t => {
    timeline.push({
      type: 'TRANSFER',
      date: t.transfer_date,
      title: `Transferred to ${t.to_location}`,
      description: `Moved from ${t.from_location} to ${t.to_location}. Reason: ${t.reason}. ${t.notes}`,
      actor: t.person_responsible,
      status: 'TRANSFER'
    });
  });

  // 4. Maintenance
  maintenance.forEach(m => {
    timeline.push({
      type: 'MAINTENANCE',
      date: m.maintenance_date,
      title: `${m.maintenance_type} Service (${m.maintenance_status})`,
      description: `${m.work_performed}. Inspected: ${m.inspection_details}. Parts: ${m.parts_used || 'None'}`,
      actor: m.technician,
      status: m.maintenance_status
    });
  });

  // 5. Incidents
  incidents.forEach(i => {
    timeline.push({
      type: 'INCIDENT',
      date: i.reported_date,
      title: `Incident: ${i.incident_type} (${i.severity})`,
      description: `${i.description} at ${i.location}. Status: ${i.status}`,
      actor: i.reported_by,
      status: i.status
    });
  });

  // Sort descending by date
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    asset,
    timeline,
    assignments,
    transfers,
    maintenance,
    incidents,
    audits
  };
}

// -------------------------------------------------------------
// QR CODE LOOKUP (Section 8)
// -------------------------------------------------------------
export async function lookupAssetByQr(qrPayload: string) {
  const cleanId = qrPayload.trim().toUpperCase();
  const asset = await getAssetById(cleanId);
  if (!asset) {
    throw new Error(`No asset found matching QR code payload: '${qrPayload}'.`);
  }

  const history = await getAssetFullHistory(asset.asset_id);
  return {
    asset,
    currentLocation: asset.current_location,
    currentTeam: asset.assigned_team,
    currentPersonnel: asset.assigned_personnel,
    condition: asset.condition,
    status: asset.status,
    activeIncidents: history.incidents.filter(i => i.status !== 'REPAIRED' && i.status !== 'CLOSED'),
    recentMaintenance: history.maintenance.slice(0, 3)
  };
}

// -------------------------------------------------------------
// SMALL ML REQUIREMENT PREDICTION & ALERTS (Sections 14-25)
// -------------------------------------------------------------
export async function generateAssetPredictions(): Promise<{
  predictions: AssetPredictionRecord[];
  alerts: any[];
  dispatchedNotifications: AssetNotificationRecord[];
}> {
  const store = ensureAssetStore();
  const categories: Array<AssetMasterRecord['asset_category']> = [
    'Generators',
    'Snow vehicles',
    'Radios',
    'Scientific instruments',
    'GPS devices',
    'Safety equipment'
  ];

  const stations = ['bharati', 'maitri', 'himadri'];
  const newPredictions: AssetPredictionRecord[] = [];
  const activeAlerts: any[] = [];
  const dispatchedNotifications: AssetNotificationRecord[] = [];

  for (const stationId of stations) {
    const stationAssets = store.assets.filter(a => a.assigned_station.toLowerCase() === stationId.toLowerCase());
    const activePersonnel = stationId === 'bharati' ? 50 : stationId === 'maitri' ? 25 : 12;
    const teamsCount = stationId === 'bharati' ? 4 : stationId === 'maitri' ? 2 : 1;

    for (const cat of categories) {
      const catAssets = stationAssets.filter(a => a.asset_category === cat);
      const availableCount = catAssets.filter(a => a.status === 'AVAILABLE').length;
      const assignedCount = catAssets.filter(a => a.status === 'ASSIGNED' || a.status === 'IN_USE').length;
      const underMaintCount = catAssets.filter(a => a.status === 'UNDER_MAINTENANCE').length;
      const damagedCount = catAssets.filter(a => a.status === 'DAMAGED').length;
      
      const historicalFailures = store.incidents.filter(i => {
        const matchingAsset = store.assets.find(a => a.asset_id === i.asset_id);
        return matchingAsset && matchingAsset.asset_category === cat && matchingAsset.assigned_station.toLowerCase() === stationId.toLowerCase();
      }).length;

      // Run lightweight ensemble inference
      const result = runEmbeddedAssetEnsemble(
        cat,
        `${cat} Fleet`,
        stationId,
        'EXP-2025-044',
        availableCount,
        assignedCount,
        underMaintCount,
        damagedCount,
        historicalFailures,
        activePersonnel,
        teamsCount,
        catAssets.length
      );

      const predictionRecord: AssetPredictionRecord = {
        id: store.predictions.length + newPredictions.length + 1,
        prediction_id: `PRED-${stationId.toUpperCase()}-${cat.replace(/\s+/g, '-').toUpperCase()}`,
        expedition_id: 'EXP-2025-044',
        station_id: stationId,
        station: stationId,
        asset_category: cat,
        asset_type: `${cat} Polar Units`,
        predicted_requirement: result.predictedRequirement,
        predicted_required_count: result.predictedRequirement,
        currently_available: result.currentlyAvailable,
        currently_available_count: result.currentlyAvailable,
        predicted_shortage: result.predictedShortage,
        additional_requirement: result.predictedShortage,
        prediction_horizon: '30-45 Days (Upcoming Polar Field Operations)',
        risk_level: result.riskLevel,
        confidence_metric: result.confidenceMetric,
        prediction_factors: { confidence: `${Math.round(result.confidenceMetric * 100)}%` },
        model_version: result.modelVersion,
        prediction_date: new Date().toISOString().split('T')[0],
        status: result.predictedShortage > 0 ? 'ACTIVE' : 'RESOLVED',
        reason: result.reason,
        algorithm_used: result.algorithmUsed,
        is_fallback: result.isFallback,
        created_at: new Date().toISOString()
      };

      newPredictions.push(predictionRecord);

      // If shortage detected, trigger alert and notify India Logistics Officer
      if (result.predictedShortage > 0) {
        const stationName = stationId === 'bharati' ? 'Bharati Station' : stationId === 'maitri' ? 'Maitri Station' : 'Himadri Station';
        const alert = {
          alertId: predictionRecord.id,
          stationId,
          stationName,
          category: cat,
          equipmentType: `${cat} Units`,
          predictedRequirement: result.predictedRequirement,
          currentlyAvailable: result.currentlyAvailable,
          additionalRequirement: result.predictedShortage,
          riskLevel: result.riskLevel,
          expeditionId: 'EXP-2025-044',
          reason: result.reason
        };
        activeAlerts.push(alert);

        // Dispatch unified notification to India Logistics Officer
        const { notification, isDuplicate } = dispatchUnifiedSupplyNotification(
          'EQUIPMENT_SHORTAGE',
          {
            alertId: predictionRecord.id,
            expeditionId: 'EXP-2025-044',
            stationName,
            equipmentType: cat,
            currentlyAvailable: result.currentlyAvailable,
            predictedRequirement: result.predictedRequirement,
            additionalRequirement: result.predictedShortage
          },
          store.notifications
        );

        if (!isDuplicate) {
          store.notifications.push(notification);
          dispatchedNotifications.push(notification);
        }
      }
    }
  }

  // Update predictions in store
  store.predictions = newPredictions;
  saveAssetStore(store);

  return {
    predictions: newPredictions,
    alerts: activeAlerts,
    dispatchedNotifications
  };
}

// -------------------------------------------------------------
// SUPPLY REQUEST MANAGEMENT (Section 26 & 27)
// -------------------------------------------------------------
export async function createSupplyRequest(
  payload: {
    expeditionId: string;
    stationId: string;
    assetType: string;
    assetCategory: string;
    requestedQuantity: number;
    predictedQuantity: number;
    reason: string;
  },
  user: string = 'Automated ML Engine'
): Promise<AssetSupplyRequestRecord> {
  const store = ensureAssetStore();
  const requestCode = `ASR-${new Date().getFullYear()}-${String(store.supplyRequests.length + 1).padStart(3, '0')}`;

  const request: AssetSupplyRequestRecord = {
    id: store.supplyRequests.length + 1,
    request_id: requestCode,
    expedition_id: payload.expeditionId || 'EXP-2025-044',
    station_id: payload.stationId || 'bharati',
    asset_type: payload.assetType,
    asset_category: payload.assetCategory,
    requested_quantity: payload.requestedQuantity,
    predicted_quantity: payload.predictedQuantity,
    approved_quantity: null,
    received_quantity: null,
    reason: payload.reason,
    requested_by: user,
    approved_by: null,
    approved_at: null,
    status: 'PENDING',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.supplyRequests.push(request);
  saveAssetStore(store);

  await logAssetAudit(
    requestCode,
    user,
    'SUPPLY_REQUEST_CREATED',
    `Created supply request ${requestCode} for ${payload.requestedQuantity}x ${payload.assetType} at ${payload.stationId}.`,
    undefined,
    'PENDING'
  );

  return request;
}

export async function approveSupplyRequest(
  requestCode: string,
  approval: {
    approvedQuantity: number;
    approvedBy: string;
    cargoCode?: string;
    containerNo?: string;
    vesselName?: string;
    notes?: string;
  }
): Promise<AssetSupplyRequestRecord> {
  const store = ensureAssetStore();
  const req = store.supplyRequests.find(r => r.request_id === requestCode);
  if (!req) {
    throw new Error(`Supply request '${requestCode}' not found.`);
  }

  req.approved_quantity = approval.approvedQuantity;
  req.approved_by = approval.approvedBy || 'Shri Alok Mukherjee (India Logistics Controller)';
  req.approved_at = new Date().toISOString();
  req.cargo_code = approval.cargoCode || `CRG-AST-${Math.floor(100 + Math.random() * 900)}`;
  req.containerNo = approval.containerNo || 'CONT-IND-902';
  req.vessel_name = approval.vesselName || 'MV Vasiliy Golovnin';
  req.notes = approval.notes || 'Approved for shipping in upcoming maritime voyage.';
  req.status = 'IN_TRANSIT';
  req.updated_at = new Date().toISOString();

  saveAssetStore(store);

  await logAssetAudit(
    requestCode,
    req.approved_by,
    'SUPPLY_REQUEST_APPROVED',
    `Approved ${approval.approvedQuantity} units for supply request ${requestCode}. Assigned Container ${req.containerNo} on vessel ${req.vessel_name}.`,
    'PENDING',
    'IN_TRANSIT'
  );

  return req;
}

export async function receiveSupplyEquipment(
  requestCode: string,
  receipt: {
    receivedQuantity: number;
    verifiedBy: string;
    conditionUponArrival?: ControlledAssetCondition;
    notes?: string;
  }
): Promise<{ request: AssetSupplyRequestRecord; registeredAssets: AssetMasterRecord[] }> {
  const store = ensureAssetStore();
  const req = store.supplyRequests.find(r => r.request_id === requestCode);
  if (!req) {
    throw new Error(`Supply request '${requestCode}' not found.`);
  }

  req.received_quantity = receipt.receivedQuantity;
  req.status = 'RECEIVED';
  req.updated_at = new Date().toISOString();

  // Register the new arrived equipment as AVAILABLE assets at the station
  const registeredAssets: AssetMasterRecord[] = [];
  for (let i = 1; i <= receipt.receivedQuantity; i++) {
    const newAssetId = `AST-${String(store.assets.length + 1).padStart(3, '0')}`;
    const newAsset: AssetMasterRecord = {
      id: store.assets.length + 1,
      asset_id: newAssetId,
      asset_name: `${req.asset_type} #${i}`,
      asset_category: req.asset_category as any,
      asset_type: req.asset_type,
      serial_number: `POL-ARRIV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      manufacturer: 'NCPOR Procurement Core',
      model: 'Polar Certified Mk II',
      description: `Equipment supplied under approved resupply request ${requestCode}.`,
      expedition_id: req.expedition_id,
      assigned_station: req.station_id,
      assigned_team: 'Station Reserve Hangar',
      assigned_personnel: 'Unassigned',
      current_location: `${req.station_id === 'bharati' ? 'Bharati' : req.station_id === 'maitri' ? 'Maitri' : 'Himadri'} Station Workshop`,
      acquisition_date: new Date().toISOString().split('T')[0],
      commission_date: new Date().toISOString().split('T')[0],
      expected_lifetime: '8 years',
      condition: receipt.conditionUponArrival || 'EXCELLENT',
      status: 'AVAILABLE',
      last_maintenance_date: new Date().toISOString().split('T')[0],
      next_maintenance_date: '',
      operating_hours: 0,
      maintenance_threshold_hours: 500,
      vibration_index: 0.9,
      health_score: 100,
      notes: `Received via shipment ${req.vessel_name || 'Polar Vessel'}. Verification by ${receipt.verifiedBy}.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.assets.push(newAsset);
    registeredAssets.push(newAsset);

    store.transfers.push({
      id: store.transfers.length + 1,
      asset_id: newAssetId,
      from_location: `Vessel ${req.vessel_name || 'Supply Vessel'} Fast-Ice Offloading`,
      to_location: newAsset.current_location,
      transfer_date: new Date().toISOString(),
      person_responsible: receipt.verifiedBy,
      reason: `Intake of resupply shipment ${requestCode}`,
      notes: receipt.notes || 'Verified intact upon Antarctic arrival.',
      created_at: new Date().toISOString()
    });
  }

  saveAssetStore(store);

  // Recalculate predictions to resolve alert
  await generateAssetPredictions();

  await logAssetAudit(
    requestCode,
    receipt.verifiedBy,
    'SUPPLY_EQUIPMENT_RECEIVED',
    `Verified and received ${receipt.receivedQuantity} units for ${requestCode}. Auto-registered assets: ${registeredAssets.map(a => a.asset_id).join(', ')}. Available stock increased.`,
    'IN_TRANSIT',
    'RECEIVED'
  );

  return { request: req, registeredAssets };
}

// -------------------------------------------------------------
// NOTIFICATIONS & AUDIT LOG ACCESSORS
// -------------------------------------------------------------
export async function getAssetNotifications(): Promise<AssetNotificationRecord[]> {
  const store = ensureAssetStore();
  return [...store.notifications].sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
}

export async function getAssetAuditLogs(): Promise<AssetAuditLogRecord[]> {
  const store = ensureAssetStore();
  return [...store.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getAssetSupplyRequests(): Promise<AssetSupplyRequestRecord[]> {
  const store = ensureAssetStore();
  return [...store.supplyRequests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getAssetMaintenanceList(): Promise<AssetMaintenanceRecord[]> {
  const store = ensureAssetStore();
  return [...store.maintenance].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getAssetIncidentsList(): Promise<AssetIncidentRecord[]> {
  const store = ensureAssetStore();
  return [...store.incidents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
