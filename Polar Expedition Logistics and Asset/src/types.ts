export type UserRole = 
  | 'ADMIN'
  | 'EXPEDITION_MANAGER'
  | 'VIEWER'
  | 'LOGISTICS_OFFICER'
  | 'STATION_MANAGER'
  | 'MEDICAL_OFFICER';

export type ExpeditionStatusValue = 'Planned' | 'Approved' | 'Active' | 'Completed' | 'Cancelled';

export interface ExpeditionRecord {
  id: number;
  expedition_id: string;
  expedition_name: string;
  expedition_code: string;
  expedition_year: number;
  description?: string | null;
  mission_objective?: string | null;
  target_region: string;
  lead_organization: string;
  expedition_leader: string;
  start_date: string;
  end_date: string;
  status: ExpeditionStatusValue;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ExpeditionCreatePayload {
  expedition_id: string;
  expedition_name: string;
  expedition_code: string;
  expedition_year: number;
  description?: string;
  mission_objective?: string;
  target_region: string;
  lead_organization: string;
  expedition_leader: string;
  start_date: string;
  end_date: string;
  status?: ExpeditionStatusValue;
  notes?: string;
}

export interface ExpeditionUpdatePayload {
  expedition_name?: string;
  expedition_code?: string;
  expedition_year?: number;
  description?: string;
  mission_objective?: string;
  target_region?: string;
  lead_organization?: string;
  expedition_leader?: string;
  start_date?: string;
  end_date?: string;
  status?: ExpeditionStatusValue;
  notes?: string;
}

export interface FutureModuleCounts {
  personnel_count: number;
  teams_count: number;
  locations_count: number;
  cargo_count: number;
  shipments_count: number;
  inventory_count: number;
  assets_count: number;
}

export interface ExpeditionAuditLog {
  id: number;
  expedition_id: string;
  user_id?: string;
  user_email: string;
  user_name: string;
  user_role: string;
  action: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'APPROVED' | 'ACTIVATED' | 'COMPLETED' | 'CANCELLED' | 'DELETE_ATTEMPTED' | 'DELETED' | string;
  previous_state?: string | null;
  new_state?: string | null;
  details?: string | null;
  timestamp: string;
}

export interface ExpeditionFilterParams {
  q?: string;
  status?: string;
  year?: string | number;
  target_region?: string;
  lead_organization?: string;
  start_date?: string;
  end_date?: string;
  date_from?: string;
  date_to?: string;
}

export interface ExpeditionDetailResponse {
  expedition: ExpeditionRecord;
  module_connections: FutureModuleCounts;
  audit_logs: ExpeditionAuditLog[];
}

export interface DashboardStats {
  total_expeditions: number;
  planned_expeditions: number;
  approved_expeditions: number;
  active_expeditions: number;
  completed_expeditions: number;
  cancelled_expeditions: number;
  upcoming_expeditions: number;
  recent_expeditions: ExpeditionRecord[];
  active_expedition?: ExpeditionRecord | null;
  planned?: number;
  approved?: number;
  active?: number;
  completed?: number;
  cancelled?: number;
  current_year_expeditions?: number;
}

export type StationId = 'bharati' | 'maitri' | 'himadri' | 'cape_town' | 'goa_hq';

export interface WeatherTelemetry {
  temperatureC: number;
  windSpeedKnots: number;
  condition: string;
  visibilityKm: number;
  pressureHpa: number;
}

export interface Station {
  id: StationId;
  name: string;
  region: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  commander: string;
  personnelCapacity: number;
  currentPersonnelCount: number;
  weather: WeatherTelemetry;
  status: 'OPERATIONAL' | 'RESTRICTED_WEATHER' | 'EMERGENCY_STANDBY';
  establishedYear: number;
}

export interface CargoRequirement {
  foodKg: number;
  fuelL: number;
  equipmentKg: number;
  medicineUnits: number;
  sparePartsKg: number;
}

export type ExpeditionStatus = 'PLANNING' | 'ACTIVE_EN_ROUTE' | 'ON_STATION' | 'COMPLETED';

export interface Expedition {
  id: string;
  code: string;
  name: string;
  destinationStationId: StationId;
  startDate: string;
  endDate: string;
  personnelCount: number;
  objective: string;
  status: ExpeditionStatus;
  requirements: CargoRequirement;
  allocatedWeightKg: number;
  containersAssigned: string[]; // container IDs
  vesselId: string;
  leadScientist: string;
}

export type CargoCategory = 'Fuel' | 'Food' | 'Medical' | 'Spare Parts' | 'Heavy Equipment' | 'Equipment' | 'Scientific Instruments';

export interface CargoItem {
  id: string;
  name: string;
  category: CargoCategory;
  quantity: number;
  unit: string;
  weightKg: number;
  priority: number; // 1 = highest / emergency, 4 = lowest
}

export type ContainerJourneyStatus = 
  | 'PACKED'
  | 'LOADED_GOA'
  | 'DEPARTED_GOA'
  | 'IN_CAPE_TOWN'
  | 'ON_SHIP'
  | 'ARRIVED_ICE_SHELF'
  | 'DELIVERED';

export type ContainerType = '20ft Standard' | '20ft Reefer (Cold Chain)' | '40ft High Cube' | 'ISO Polar Fuel Tanker';

export interface Container {
  id: string;
  code: string;
  type: ContainerType;
  capacityKg: number;
  currentWeightKg: number;
  stowagePriority: 1 | 2 | 3 | 4; // 1 = First out (emergency/vital), 4 = Last out
  stowageTierLabel: string;
  isHazardous: boolean;
  rfidTag: string;
  status: ContainerJourneyStatus;
  currentLocationName: string;
  vesselId: string;
  destinationStationId: StationId;
  items: CargoItem[];
  qrPayload: string;
  lastScannedTime: string;
}

export interface Vessel {
  id: string;
  name: string;
  type: string;
  callsign: string;
  origin: string;
  destination: string;
  eta: string;
  speedKnots: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  journeyStatus: 
    | 'DOCKED_GOA'
    | 'TRANSIT_INDIAN_OCEAN'
    | 'STAGING_CAPE_TOWN'
    | 'CROSSING_ROARING_FORTIES'
    | 'ICE_BREAKING_PRYDZ_BAY'
    | 'MOORED_FAST_ICE';
  cargoCapacityTeu: number;
  containersCarried: string[];
}

export interface InventoryItem {
  id: string;
  stationId: StationId;
  name: string;
  category: 'Fuel' | 'Food' | 'Medical' | 'Batteries' | 'Spare Parts' | 'Consumables';
  currentStock: number;
  unit: string;
  dailyConsumptionRate: number;
  minReserveThreshold: number;
  lastReplenishedDate: string;
  batchOrLotNumber: string;
}

export type ControlledAssetStatus = 
  | 'AVAILABLE' 
  | 'ASSIGNED' 
  | 'IN_USE' 
  | 'UNDER_MAINTENANCE' 
  | 'DAMAGED' 
  | 'LOST' 
  | 'DECOMMISSIONED';

export type ControlledAssetCondition = 
  | 'EXCELLENT' 
  | 'GOOD' 
  | 'FAIR' 
  | 'POOR' 
  | 'CRITICAL';

export type AssetCategory = 
  | 'Scientific instruments'
  | 'Generators'
  | 'Radios'
  | 'Communication equipment'
  | 'GPS devices'
  | 'Computers'
  | 'Snow vehicles'
  | 'Power equipment'
  | 'Refrigeration equipment'
  | 'Safety equipment'
  | 'Research equipment'
  | 'Field equipment'
  | 'Specialized expedition equipment';

// Maintained with backward compatibility support
export type AssetStatus = ControlledAssetStatus | 'OPERATIONAL' | 'MAINTENANCE_DUE' | 'CRITICAL_OFFLINE' | 'STANDBY';

export interface Asset {
  id: string;
  code: string;
  stationId: StationId;
  name: string;
  type: string;
  status: AssetStatus;
  operatingHours: number;
  maintenanceThresholdHours: number;
  vibrationIndex: number; // 0.0 - 10.0 (higher = abnormal wear)
  healthScore: number; // 0 - 100%
  lastMaintenanceDate: string;
  nextMaintenanceDue: string;
  linkedSpareParts: string;
  operatorNotes: string;
  // Extended specification fields
  category?: AssetCategory;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  description?: string;
  expeditionId?: string;
  assignedTeam?: string;
  assignedPersonnel?: string;
  currentLocation?: string;
  acquisitionDate?: string;
  commissionDate?: string;
  expectedLifetime?: string;
  condition?: ControlledAssetCondition;
}

// -------------------------------------------------------------
// ASSET MANAGEMENT MODULE FULL SPECIFICATION RECORDS
// -------------------------------------------------------------

export interface AssetMasterRecord {
  id: number;
  asset_id: string; // e.g. AST-001
  asset_name: string;
  asset_category: AssetCategory;
  asset_type: string; // e.g. "PistenBully 300 Polar", "Cummins 250kVA Genset"
  serial_number: string;
  manufacturer: string;
  model: string;
  description: string;
  expedition_id: string; // e.g. "EXP-2025-044"
  assigned_station: string; // "bharati", "maitri", "himadri"
  assigned_team: string; // e.g. "Power & Utilities", "Scientific Core", "Logistics Fleet"
  assigned_personnel: string; // e.g. "Vikram Malhotra", "Dr. Priya Sharma"
  current_location: string; // e.g. "Bharati Station", "Field Camp A (Larsemann)", "Schirmacher Oasis"
  acquisition_date: string;
  commission_date: string;
  expected_lifetime: string; // e.g. "10 years" or "8,000 hrs"
  condition: ControlledAssetCondition;
  status: ControlledAssetStatus;
  last_maintenance_date: string;
  next_maintenance_date: string;
  operating_hours: number;
  maintenance_threshold_hours: number;
  vibration_index: number;
  health_score: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AssetAssignmentRecord {
  id: number;
  asset_id: string;
  assigned_station: string;
  assigned_team: string;
  assigned_personnel: string;
  expedition_id: string;
  assigned_location: string;
  assignment_date: string;
  release_date: string | null;
  assigned_by: string;
  notes: string;
  created_at: string;
}

export interface AssetTransferRecord {
  id: number;
  asset_id: string;
  from_location: string;
  to_location: string;
  transfer_date: string;
  person_responsible: string;
  reason: string;
  notes: string;
  created_at: string;
}

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'OVERHAUL' | 'CALIBRATION' | 'EMERGENCY';
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface AssetMaintenanceRecord {
  id: number;
  asset_id: string;
  maintenance_type: MaintenanceType;
  problem: string;
  inspection_details: string;
  work_performed: string;
  technician: string;
  maintenance_date: string;
  next_maintenance_date: string;
  maintenance_status: MaintenanceStatus;
  parts_used: string;
  notes: string;
  created_at: string;
}

export type IncidentType = 'DAMAGED' | 'LOST' | 'MISSING' | 'FAILURE' | 'OTHER';
export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'REPORTED' | 'INVESTIGATING' | 'REPAIRED' | 'RECOVERED' | 'CLOSED';

export interface AssetIncidentRecord {
  id: number;
  incident_code: string;
  asset_id: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location: string;
  reported_by: string;
  reported_date: string;
  status: IncidentStatus;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AssetPredictionRecord {
  id: number;
  prediction_id?: string;
  expedition_id: string;
  station_id: string;
  station?: string;
  asset_category: string;
  asset_type: string;
  predicted_requirement: number;
  predicted_required_count?: number;
  currently_available: number;
  currently_available_count?: number;
  predicted_shortage: number;
  additional_requirement?: number;
  prediction_horizon: string;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_metric: number; // 0.0 - 1.0
  prediction_factors?: Record<string, any>;
  model_version: string;
  prediction_date: string;
  status: 'ACTIVE' | 'RESOLVED' | 'REVIEWED';
  reason: string;
  algorithm_used: string;
  is_fallback?: boolean;
  created_at: string;
}

export type AssetSupplyStatus = 
  | 'PENDING' 
  | 'PENDING_REVIEW'
  | 'APPROVED' 
  | 'REJECTED' 
  | 'ORDERED'
  | 'IN_PREPARATION' 
  | 'IN_TRANSIT' 
  | 'SHIPPED'
  | 'RECEIVED' 
  | 'COMPLETED';

export interface AssetSupplyRequestRecord {
  id: number;
  request_id?: string; // e.g. ASR-2026-001
  request_code?: string;
  expedition_id: string;
  station_id: string;
  station?: string;
  asset_type: string;
  asset_category: string;
  requested_quantity: number;
  quantity_requested?: number;
  predicted_quantity: number;
  approved_quantity: number | null;
  received_quantity: number | null;
  reason: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  justification?: string;
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  status: AssetSupplyStatus;
  cargo_code?: string;
  container_no?: string;
  containerNo?: string;
  assigned_container?: string;
  vessel_name?: string;
  assigned_vessel?: string;
  departure_port?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetNotificationRecord {
  id: number;
  notification_code?: string;
  alert_id?: number;
  alert_type: 'EQUIPMENT_SHORTAGE' | 'MAINTENANCE_DUE' | 'CRITICAL_INCIDENT' | 'FOOD_SHORTAGE' | string;
  department: string;
  officer_name?: string;
  recipient_name?: string;
  email?: string;
  recipient_email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  message_body?: string;
  channel: 'Email' | 'SMS' | 'In-App' | 'EMAIL' | 'RADIO' | 'SATELLITE' | string;
  sent_at: string;
  delivery_status: 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED' | string;
  created_at: string;
}

export interface AssetAuditLogRecord {
  id: number;
  asset_id: string;
  user?: string;
  user_name?: string;
  action: string;
  previous_value?: string;
  new_value?: string;
  details: string;
  timestamp: string;
}

export interface AssetFullHistoryResponse {
  asset: AssetMasterRecord;
  assignments: AssetAssignmentRecord[];
  transfers: AssetTransferRecord[];
  maintenance: AssetMaintenanceRecord[];
  incidents: AssetIncidentRecord[];
  auditLogs: AssetAuditLogRecord[];
}

export interface AssetAvailabilityRiskAssessment {
  asset_id: string;
  asset_name: string;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  failure_probability_pct: number;
  hours_until_service: number;
  risk_factors: string[];
  recommended_action: string;
  estimated_days_to_downtime?: number;
}

export interface AssetModelArtifact {
  model_name: string;
  algorithm: string;
  version?: string;
  model_version?: string;
  modelVersion?: string;
  r2_score: number;
  mae_score: number;
  rmse_score: number;
  sample_count: number;
  features?: string[];
  trained_at: string;
  total_inferences?: number;
  status?: string;
}

export interface IndiaOfficerConfig {
  assetOfficerName: string;
  assetOfficerRole: string;
  assetOfficerEmail: string;
  organizationUnit: string;
  foodOfficerName: string;
  foodOfficerRole: string;
  foodOfficerEmail: string;
}

export interface ResponsibleAssetOfficerConfig {
  department: string;
  officer_name: string;
  email: string;
  phone: string;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
}

export interface MovementLeg {
  id: string;
  from: string;
  to: string;
  transportMode: 'Flight (IL-76)' | 'Icebreaker Vessel' | 'PistenBully Snowcat' | 'Twin Otter Aircraft';
  departureDate: string;
  arrivalDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
}

export interface Personnel {
  id: string;
  name: string;
  role: string;
  specialization: string;
  assignedStationId: StationId;
  currentLocation: string;
  rotationType: 'Winter-over Team' | 'Summer Expedition Team' | 'Logistics Convoy' | 'HQ Command';
  medicalClearance: 'CERTIFIED' | 'CONDITIONAL' | 'PENDING';
  bloodGroup: string;
  emergencyContact: string;
  movementTimeline: MovementLeg[];
}

export type EmergencySource = 'PERSONNEL' | 'WEATHER' | 'SYSTEM';

export type EmergencyType =
  | 'MEDICAL'
  | 'FIRE'
  | 'VEHICLE_ACCIDENT'
  | 'EQUIPMENT_FAILURE'
  | 'WEATHER'
  | 'MISSING_PERSON'
  | 'SAFETY'
  | 'COMMUNICATION'
  | 'OTHER';

export type EmergencySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EmergencyStatus =
  | 'CREATED'
  | 'ALERTING'
  | 'ACKNOWLEDGED'
  | 'RESPONSE_ASSIGNED'
  | 'RESPONSE_IN_PROGRESS'
  | 'RESOLVED'
  | 'CANCELLED';

export type ResponseTeamType =
  | 'MEDICAL'
  | 'FIRE_SAFETY'
  | 'TECHNICAL'
  | 'SEARCH_AND_RESCUE'
  | 'OPERATIONS';

export type ResponseTeamAvailability =
  | 'AVAILABLE'
  | 'BUSY'
  | 'UNAVAILABLE'
  | 'OFF_DUTY';

export interface ResponseTeamMember {
  id: string;
  name: string;
  role: string;
  contact: string;
}

export interface ResponseTeam {
  id: string;
  name: string;
  station_id: string | null;
  vessel_id: string | null;
  team_type: ResponseTeamType;
  members: ResponseTeamMember[];
  contact_info: string;
  availability_status: ResponseTeamAvailability;
  active: boolean;
  backup_team_id: string | null;
}

export interface EmergencyActionRecord {
  id: string;
  emergency_id: string;
  action_type: 'DISPATCH' | 'ON_SCENE' | 'TREATMENT' | 'CONTAINMENT' | 'EVACUATION' | 'COMMUNICATION' | 'UPDATE';
  description: string;
  performed_by: string;
  created_at: string;
}

export interface EmergencyNotificationRecord {
  id: string;
  emergency_id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_role: string;
  recipient_contact: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'IRIDIUM_SATELLITE';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED';
  message: string;
  sent_at: string;
  delivered_at: string | null;
  acknowledged_at: string | null;
  failure_reason: string | null;
  retry_count: number;
}

export interface EmergencyEscalationRecord {
  id: string;
  emergency_id: string;
  escalation_level: number;
  escalated_to: string;
  triggered_at: string;
  acknowledged_at: string | null;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'ESCALATED';
}

export interface EmergencyResolutionRecord {
  id: string;
  emergency_id: string;
  resolved_by: string;
  resolution_type: 'RESOLVED_NORMAL' | 'EVACUATED' | 'CONTAINED' | 'FALSE_ALARM';
  summary: string;
  resolved_at: string;
  notes: string;
}

export interface EmergencyAuditLogRecord {
  id: string;
  emergency_id: string;
  user: string;
  action: string;
  previous_value: string | null;
  new_value: string | null;
  timestamp: string;
}

export interface EmergencyRecord {
  id: string;
  emergency_code: string;
  expedition_id: string;
  source: EmergencySource;
  emergency_type: EmergencyType;
  severity: EmergencySeverity;
  status: EmergencyStatus;
  reported_by: string;
  affected_personnel_id: string | null;
  affected_personnel_name: string | null;
  station_id: string | null;
  vessel_id: string | null;
  shipment_id: string | null;
  asset_id: string | null;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  detected_at: string;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  response_started_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_summary: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  escalation_level: number;
  response_team_id: string | null;
  response_team_name: string | null;
  actions?: EmergencyActionRecord[];
  notifications?: EmergencyNotificationRecord[];
  escalations?: EmergencyEscalationRecord[];
}

export interface EmergencyStats {
  active_count: number;
  critical_count: number;
  unacknowledged_count: number;
  response_in_progress_count: number;
  resolved_today_count: number;
  escalated_count: number;
  avg_time_to_acknowledge_min: number;
  avg_time_to_response_min: number;
  avg_time_to_resolve_min: number;
  by_station: Record<string, number>;
  by_type: Record<string, number>;
  notification_delivery_rate: number;
}

export interface EmergencyIncident {
  id: string;
  stationId: StationId;
  type: 'FIRE' | 'BLIZZARD' | 'VEHICLE_FAILURE' | 'MEDICAL_CRITICAL' | 'GENERATOR_OUTAGE' | EmergencyType;
  severity: 'HIGH' | 'CRITICAL' | 'EXTREME_CODE_RED' | EmergencySeverity;
  title: string;
  description: string;
  reportedTime: string;
  affectedPersonnelCount: number;
  status: 'ACTIVE' | 'CONTAINED' | 'RESOLVED' | EmergencyStatus;
  incidentCommander: string;
  availableResources: string[];
  actionsTaken: string[];
  // Extended fields
  emergency_code?: string;
  source?: EmergencySource;
  emergency_type?: EmergencyType;
  location?: string;
  latitude?: number;
  longitude?: number;
  response_team_id?: string | null;
  response_team_name?: string | null;
  reported_by?: string;
  affected_personnel_name?: string | null;
}

export interface SimulationStep {
  step: number;
  title: string;
  phaseName: string;
  description: string;
  actionButtonText: string;
}

// ==============================================================
// INVENTORY MANAGEMENT & PREDICTION TYPES
// ==============================================================

export type InventoryItemStatus = 'NORMAL' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK' | 'EXPIRED';

export type InventoryCategory = 
  | 'Food' 
  | 'Water' 
  | 'Fuel' 
  | 'Medical supplies' 
  | 'Batteries' 
  | 'Scientific consumables' 
  | 'Cleaning supplies' 
  | 'Spare consumables' 
  | 'Operational provisions';

export interface InvItemMasterRecord {
  id: number;
  item_code: string;
  item_name: string;
  category: InventoryCategory | string;
  description?: string | null;
  unit: string;
  station_id: string;
  expedition_id: string;
  current_quantity: number;
  minimum_stock: number;
  safety_stock: number;
  maximum_capacity: number;
  reorder_level: number;
  expiry_date?: string | null;
  status: InventoryItemStatus;
  created_at?: string;
  updated_at?: string;
}

export type InventoryTransactionType = 
  | 'OPENING_STOCK'
  | 'RECEIPT'
  | 'CONSUMPTION'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'EXPIRY'
  | 'RESUPPLY'
  | 'RETURN';

export interface InvTransactionRecord {
  id: number;
  inventory_item_id: number;
  transaction_type: InventoryTransactionType;
  quantity: number;
  timestamp: string;
  reason: string;
  reference_type?: string | null;
  reference_id?: string | null;
  performed_by: string;
  notes?: string | null;
  created_at?: string;
}

export interface InvAlertRecord {
  id: number;
  inventory_item_id: number;
  alert_type: 'STOCKOUT_RISK' | 'EXPIRING_SOON' | 'EXPIRED' | 'DEFICIT_WARNING';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  station_id: string;
  item_code: string;
  item_name: string;
  current_stock: number;
  predicted_daily_consumption: number;
  estimated_stockout_days: number;
  next_shipment_eta_days: number;
  risk_score: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  details?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InvNotificationRecord {
  id: number;
  alert_id?: number | null;
  recipient_id: string;
  recipient_name: string;
  recipient_email: string;
  channel: 'Email' | 'SMS' | 'In-app';
  message: string;
  sent_at: string;
  delivery_status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'ACKNOWLEDGED';
  failure_reason?: string | null;
  acknowledged_at?: string | null;
  created_at?: string;
}

export type ResupplyStatus = 
  | 'PENDING_REVIEW' 
  | 'APPROVED' 
  | 'CARGO_ASSIGNED' 
  | 'IN_TRANSIT' 
  | 'ARRIVED' 
  | 'VERIFIED' 
  | 'REJECTED';

export interface InvResupplyRequestRecord {
  id: number;
  request_code: string;
  inventory_item_id: number;
  station_id: string;
  expedition_id: string;
  requested_quantity: number;
  approved_quantity?: number | null;
  received_quantity?: number | null;
  status: ResupplyStatus;
  requested_by: string;
  approved_by?: string | null;
  approved_at?: string | null;
  notes?: string | null;
  cargo_code?: string | null;
  vessel_name?: string | null;
  eta_days?: number | null;
  discrepancy_quantity?: number | null;
  discrepancy_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ForecastResult {
  itemId: number;
  itemCode: string;
  itemName: string;
  stationId: string;
  unit: string;
  currentStock: number;
  safetyStock: number;
  reorderLevel: number;
  activePersonnel: number;
  
  // Statistical Baseline
  statistical: {
    movingAverage7d: number;
    weightedMovingAverage: number;
    averageDailyConsumption: number;
    consumptionTrend: 'INCREASING' | 'STEADY' | 'DECREASING';
    estimatedRemainingDays: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };

  // ML Prediction
  ml: {
    modelName: string;
    modelVersion: string;
    isAvailable: boolean;
    expectedDailyConsumption: number;
    stockoutProbability7d: number;
    stockoutProbability14d: number;
    predictionHorizonDays: number;
    confidenceScore: number;
    featuresUsed: string[];
    fallbackUsed: boolean;
    fallbackReason?: string;
  };

  // Hybrid Risk Engine
  hybrid: {
    recommendedDailyConsumption: number;
    estimatedStockoutDays: number;
    riskScore: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    nextShipmentEtaDays: number;
    recommendedResupplyQuantity: number;
    stockoutBeforeShipment: boolean;
    explanation: string;
  };

  // Historical Timeline for Charts
  historyTimeline: { date: string; consumption: number; actualStock: number }[];
  predictionTimeline: { date: string; projectedStock: number; projectedConsumption: number }[];
}

export interface ResponsibleOfficerContact {
  stationId: string;
  stationName: string;
  responsibleOrganization: string;
  role: string;
  officerName: string;
  email: string;
  phone: string;
  location: string;
}

// =============================================================
// WEATHER & ENVIRONMENTAL MONITORING TYPES (RULE-BASED ENGINE)
// =============================================================

export type WeatherEnvironmentType = 'SHIP' | 'STATION';

export type WeatherSeverity = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export type WeatherEventType =
  | 'HIGH_WIND'
  | 'EXTREME_COLD'
  | 'LOW_VISIBILITY'
  | 'HEAVY_SNOW'
  | 'STORM'
  | 'SEVERE_WEATHER'
  | 'MARINE_HAZARD'
  | 'FREEZING_SPRAY'
  | 'OTHER';

export type WeatherEventStatus =
  | 'DETECTED'
  | 'ACTIVE'
  | 'MONITORED'
  | 'CONDITIONS_IMPROVE'
  | 'RESOLVED';

export type WeatherAlertStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'ACKNOWLEDGED'
  | 'FAILED';

export type WeatherNotificationChannel =
  | 'IN_APP'
  | 'RADIO_IRIDIUM'
  | 'EMAIL'
  | 'SMS';

export type WeatherRuleOperator = '>' | '>=' | '<' | '<=' | '==' | '!=';

export interface WeatherObservation {
  id: string;
  source: string;
  latitude: number;
  longitude: number;
  station_id?: string | null;
  vessel_id?: string | null;
  expedition_id?: string | null;
  observed_at: string;
  temperature: number; // Celsius
  apparent_temperature?: number; // Wind chill
  wind_speed: number; // km/h
  wind_direction: number; // degrees
  wind_gust: number; // km/h
  precipitation: number; // mm
  snow: number; // cm
  visibility: number; // meters
  pressure: number; // hPa
  wave_height?: number | null; // meters (marine)
  wave_period?: number | null; // seconds
  wave_direction?: number | null; // degrees
  sea_state?: string | null; // e.g. "Rough (Wave 3.5m)"
  weather_condition: string; // e.g. "Blizzard", "Freezing Fog", "Overcast"
  weather_code?: number;
  raw_source_reference?: string;
  created_at?: string;
  is_stale?: boolean;
}

export interface WeatherForecastItem {
  forecast_time: string;
  temperature: number;
  apparent_temperature?: number;
  wind_speed: number;
  wind_gust: number;
  precipitation: number;
  snow: number;
  visibility: number;
  pressure: number;
  wave_height?: number | null;
  wave_period?: number | null;
  sea_state?: string | null;
  weather_condition: string;
  severe_indicator?: boolean;
}

export interface WeatherForecast {
  location: string;
  station_id?: string | null;
  vessel_id?: string | null;
  source: string;
  retrieved_at: string;
  hourly: WeatherForecastItem[];
  is_stale?: boolean;
}

export interface WeatherRuleCondition {
  parameter: string; // 'wind_speed' | 'wind_gust' | 'temperature' | 'visibility' | 'wave_height' | 'snow' | 'pressure'
  operator: WeatherRuleOperator;
  threshold: number;
}

export interface WeatherRule {
  id: string;
  name: string;
  environment_type: WeatherEnvironmentType;
  parameter: string;
  operator: WeatherRuleOperator;
  threshold: number;
  severity: WeatherSeverity;
  enabled: boolean;
  description: string;
  combined_conditions?: WeatherRuleCondition[];
  created_at?: string;
  updated_at?: string;
}

export interface WeatherEvent {
  id: string;
  event_type: WeatherEventType;
  severity: WeatherSeverity;
  environment_type: WeatherEnvironmentType;
  station_id?: string | null;
  vessel_id?: string | null;
  expedition_id?: string | null;
  target_name: string;
  detected_at: string;
  start_time: string;
  expected_end_time?: string | null;
  latitude: number;
  longitude: number;
  description: string;
  triggering_conditions: string;
  status: WeatherEventStatus;
  resolved_at?: string | null;
  resolved_by?: string | null;
  emergency_id?: string | null;
  is_early_warning?: boolean;
  operational_instruction: string;
}

export interface WeatherAlert {
  id: string;
  event_id: string;
  severity: WeatherSeverity;
  environment_type: WeatherEnvironmentType;
  target_id: string;
  target_name: string;
  recipient_id: string;
  recipient_role: string;
  recipient_name: string;
  recipient_contact?: string;
  message: string;
  channel: WeatherNotificationChannel;
  status: WeatherAlertStatus;
  delivered_time?: string;
  acknowledged_time?: string;
  acknowledged_by?: string;
  escalation_contact?: string;
  escalated_time?: string;
  is_escalated?: boolean;
  created_at: string;
}

export interface WeatherAuditLog {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
}

export interface StationWeatherConfig {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  operational_radius_km: number; // configurable monitoring radius
}

export interface WeatherOverviewStationItem {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  current: WeatherObservation;
  forecast: WeatherForecast;
  severity: WeatherSeverity;
  active_events: WeatherEvent[];
}

export interface WeatherOverviewVesselItem {
  vessel_id: string;
  name: string;
  latitude: number;
  longitude: number;
  current: WeatherObservation;
  forecast: WeatherForecast;
  severity: WeatherSeverity;
  active_events: WeatherEvent[];
  associated_containers: string[];
}

export interface WeatherOverviewResponse {
  stations: WeatherOverviewStationItem[];
  vessels: WeatherOverviewVesselItem[];
  active_events: WeatherEvent[];
  active_alerts: WeatherAlert[];
  system_status: {
    provider: string;
    last_sync: string;
    is_stale: boolean;
    last_api_error?: string | null;
    sync_interval_minutes: number;
  };
}

// =============================================================
// COMMUNICATION & NOTIFICATION MODULE TYPES
// =============================================================

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type DeliveryStatus = 
  | 'CREATED'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'ACKNOWLEDGED'
  | 'FAILED'
  | 'RETRYING'
  | 'EXPIRED';

export type SourceModule = 
  | 'EMERGENCY'
  | 'WEATHER'
  | 'INVENTORY'
  | 'ASSET'
  | 'SHIPMENT'
  | 'CARGO'
  | 'EXPEDITION'
  | 'PERSONNEL'
  | 'SYSTEM';

export type NotificationType = 
  | 'EMERGENCY'
  | 'WEATHER_WARNING'
  | 'CRITICAL_WEATHER_EMERGENCY'
  | 'INVENTORY_SHORTAGE'
  | 'FOOD_REQUIREMENT'
  | 'ASSET_REQUIREMENT'
  | 'SHIPMENT_DELAY'
  | 'SHIPMENT_ARRIVAL'
  | 'SHIPMENT_EXCEPTION'
  | 'PERSONNEL_ALERT'
  | 'MAINTENANCE_ALERT'
  | 'SYSTEM_COMMUNICATION_FAILURE'
  | 'GENERAL_UPDATE';

export type RecipientType = 
  | 'INDIVIDUAL'
  | 'TEAM'
  | 'STATION_PERSONNEL'
  | 'EXPEDITION_MANAGER'
  | 'OPERATIONS_OFFICER'
  | 'LOGISTICS_OFFICER'
  | 'EMERGENCY_RESPONSE_TEAM'
  | 'FOOD_LOGISTICS_OFFICER'
  | 'ASSET_LOGISTICS_OFFICER'
  | 'CENTRAL_OPERATIONS';

export interface NotificationRecord {
  id: string;
  notification_code: string;
  source_module: SourceModule;
  source_event_id: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  status: DeliveryStatus;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  expires_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  requires_acknowledgement: boolean;
  station_id?: string | null;
  vessel_id?: string | null;
  expedition_id?: string | null;
  metadata?: Record<string, any>;
  recipients: NotificationRecipientRecord[];
  attempts: NotificationAttemptRecord[];
}

export interface NotificationRecipientRecord {
  id: string;
  notification_id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  recipient_role: string;
  recipient_type: RecipientType;
  delivery_status: DeliveryStatus;
  channels: NotificationChannel[];
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  acknowledged_at: string | null;
  failure_reason?: string | null;
}

export interface NotificationTemplateRecord {
  id: string;
  template_code: string;
  template_name: string;
  notification_type: NotificationType;
  channel: NotificationChannel | 'ALL';
  subject: string;
  body: string;
  enabled: boolean;
  version: number;
  variables_description: string[];
  created_at: string;
  updated_at: string;
}

export interface NotificationAttemptRecord {
  id: string;
  notification_id: string;
  recipient_id: string;
  channel: NotificationChannel;
  attempt_number: number;
  attempted_at: string;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'REJECTED';
  provider_name: string;
  provider_response: string;
  failure_reason?: string | null;
}

export interface NotificationPreferenceRecord {
  id: string;
  personnel_id: string;
  personnel_name: string;
  channel: NotificationChannel;
  notification_type: NotificationType;
  enabled: boolean;
  is_mandatory: boolean;
}

export interface NotificationAuditLogRecord {
  id: string;
  notification_id: string | null;
  actor: string;
  action: string;
  previous_state: string | null;
  new_state: string | null;
  details: string;
  timestamp: string;
}

export interface NotificationDashboardStats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  acknowledged: number;
  failed: number;
  pending: number;
  retrying: number;
  critical: number;
  success_rate_percent: number;
  unacknowledged_critical: number;
  by_module: Record<string, number>;
  by_channel: Record<string, number>;
  by_priority: Record<string, number>;
  by_date: { date: string; count: number; critical: number }[];
}

export interface CreateNotificationRequest {
  source_module: SourceModule;
  source_event_id: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  station_id?: string;
  vessel_id?: string;
  expedition_id?: string;
  template_code?: string;
  custom_title?: string;
  custom_message?: string;
  template_params?: Record<string, any>;
  target_recipient_types?: RecipientType[];
  explicit_recipient_ids?: string[];
  requires_acknowledgement?: boolean;
  forced_channels?: NotificationChannel[];
  metadata?: Record<string, any>;
}

// ==============================================================
// 12. REPORTING & ANALYTICS MODULE SCHEMAS & TYPES
// ==============================================================

export type ReportDateRangePreset = 'today' | '7d' | '30d' | 'current_expedition' | 'custom';

export interface ReportFilterParams {
  dateRange?: ReportDateRangePreset;
  startDate?: string;
  endDate?: string;
  expeditionId?: string;
  stationId?: string;
  role?: string;
  team?: string;
  status?: string;
  category?: string;
  severity?: string;
  channel?: string;
  shipmentType?: 'SEA' | 'AIR' | 'LAND' | 'ALL';
  q?: string;
}

export interface ReportingDashboardKpis {
  // Expedition KPIs
  totalExpeditions: number;
  activeExpeditions: number;
  completedExpeditions: number;
  plannedExpeditions: number;
  cancelledExpeditions: number;

  // Personnel KPIs
  totalPersonnel: number;
  currentlyDeployedPersonnel: number;
  inTransitPersonnel: number;
  completedPersonnel: number;
  personnelByStation: Record<string, number>;
  personnelByRole: Record<string, number>;
  personnelByTeam: Record<string, number>;

  // Cargo & Container KPIs
  totalCargo: number;
  totalCargoWeightKg: number;
  totalCargoVolumeM3: number;
  cargoInTransit: number;
  deliveredCargo: number;
  delayedCargo: number;
  cargoExceptions: number;
  totalContainers: number;
  containersInTransit: number;
  containersDelivered: number;
  avgContainerUtilizationPct: number;

  // Shipment & Tracking KPIs
  totalShipments: number;
  activeShipments: number;
  completedShipments: number;
  delayedShipments: number;
  avgDelayDays: number;
  avgTransitDurationDays: number;

  // Inventory KPIs
  totalInventoryItems: number;
  lowStockItems: number;
  criticalStockItems: number;
  normalStockItems: number;
  predictedShortagesCount: number;
  totalIncomingSupplies: number;

  // Asset KPIs
  totalAssets: number;
  operationalAssets: number;
  assetsUnderMaintenance: number;
  damagedAssets: number;
  missingAssets: number;
  avgAssetHealthScore: number;

  // Safety & Weather KPIs
  totalEmergencies: number;
  activeEmergencies: number;
  resolvedEmergencies: number;
  criticalEmergencies: number;
  avgAckTimeMinutes: number;
  avgResponseTimeMinutes: number;
  avgResolutionTimeMinutes: number;
  criticalWeatherEvents: number;
  weatherWarnings: number;
  totalWeatherEvents: number;

  // Communication KPIs
  totalNotifications: number;
  notificationsSent: number;
  notificationsDelivered: number;
  notificationsRead: number;
  notificationsAcknowledged: number;
  failedNotifications: number;
  retriedNotifications: number;
  deliverySuccessRatePct: number;
  unacknowledgedCriticalAlerts: number;

  // Time-series & Breakdown Distributions
  expeditionsByStatus: { status: string; count: number; color: string }[];
  personnelDistribution: { station: string; deployed: number; inTransit: number; capacity: number }[];
  cargoByStatusChart: { name: string; value: number; color: string }[];
  shipmentPerformanceChart: { name: string; plannedDays: number; actualDays: number; delayDays: number }[];
  inventoryHealthChart: { category: string; nominal: number; low: number; critical: number }[];
  emergencyTrendChart: { date: string; created: number; resolved: number; critical: number }[];
  emergencyTypeChart: { type: string; count: number }[];
  weatherEventChart: { station: string; watch: number; warning: number; critical: number }[];
  notificationChannelChart: { channel: string; delivered: number; failed: number }[];
}

export interface ExpeditionReportItem {
  expeditionId: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  targetRegion: string;
  leadOrganization: string;
  leadScientist: string;
  destinationStationId: string;
  personnelCount: number;
  assignedPersonnel: { code: string; name: string; role: string; status: string }[];
  assignedStations: string[];
  cargoCount: number;
  totalCargoWeightKg: number;
  shipmentCount: number;
  shipments: string[];
  inventoryItemsCount: number;
  inventoryAlertsCount: number;
  assetCount: number;
  operationalAssetsCount: number;
  emergencyCount: number;
  activeEmergencyCount: number;
  weatherEventCount: number;
  completionPercentage: number;
}

export interface PersonnelAnalyticsItem {
  id: string;
  code: string;
  name: string;
  role: string;
  specialization: string;
  assignedStationId: string;
  currentLocation: string;
  rotationType: string;
  status: string;
  medicalClearance: string;
  bloodGroup?: string;
  emergencyContact?: string;
  expeditionId?: string;
  team: string;
  movementLegsCount: number;
  activeLeg?: string;
  activeTransitMode?: string;
}

export interface CargoAnalyticsItem {
  id: string;
  rfid: string;
  containerNo: string;
  cargoType: string;
  category: string;
  priority: string;
  departurePort: string;
  destination: string;
  vessel: string;
  voyageId: string;
  eta: string;
  status: string;
  weightTons: number;
  weightKg: number;
  volumeM3: number;
  tempCurrent: number;
  tempTarget: number;
  hazmatClass?: string | null;
  expeditionId?: string;
  shipmentCode?: string;
  isException: boolean;
  exceptionReason?: string;
}

export interface ContainerAnalyticsItem {
  id: string;
  code: string;
  type: string;
  capacityKg: number;
  currentWeightKg: number;
  utilizationPct: number;
  stowagePriority: number;
  stowageTierLabel: string;
  isHazardous: boolean;
  rfidTag: string;
  status: string;
  currentLocationName: string;
  vesselId: string;
  destinationStationId: string;
  shipmentCode: string;
  itemCount: number;
  lastScannedTime: string;
}

export interface ShipmentAnalyticsItem {
  id: string;
  shipmentCode: string;
  shipmentType: 'SEA' | 'AIR' | 'LAND';
  vesselOrCarrierName: string;
  origin: string;
  destination: string;
  departureDate: string;
  eta: string;
  actualArrivalDate?: string | null;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'EXCEPTION';
  expectedTransitDurationDays: number;
  actualTransitDurationDays: number;
  delayDurationDays: number;
  etaDeviationDays: number;
  currentLocation: string;
  containersCarried: string[];
  totalWeightKg: number;
  expeditionId: string;
  leadCoordinator: string;
}

export interface InventoryAnalyticsItem {
  id: string;
  code: string;
  name: string;
  category: string;
  stationId: string;
  expeditionId?: string;
  currentStock: number;
  unit: string;
  minReserveThreshold: number;
  safetyStock: number;
  dailyConsumptionRate: number;
  daysRemaining: number;
  status: 'NORMAL' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
  predictedRequirement: number;
  predictedShortage: number;
  priorityLevel: 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incomingSuppliesQty: number;
  restockingStatus: string;
  lastReplenishedDate: string;
}

export interface AssetAnalyticsItem {
  id: string;
  code: string;
  name: string;
  category: string;
  model: string;
  stationId: string;
  expeditionId?: string;
  assignedTeam: string;
  status: string;
  operatingHours: number;
  maintenanceThresholdHours: number;
  vibrationIndex: number;
  healthScore: number;
  condition: string;
  lastMaintenanceDate: string;
  nextMaintenanceDue: string;
  predictedRequirement: number;
  predictedShortage: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  sparesAvailability: string;
}

export interface WeatherAnalyticsItem {
  id: string;
  eventId: string;
  eventType: string;
  severity: 'WATCH' | 'WARNING' | 'CRITICAL';
  environmentType: 'STATION' | 'SHIP';
  targetName: string;
  stationId?: string;
  vesselId?: string;
  detectedAt: string;
  startTime: string;
  expectedEndTime?: string;
  status: string;
  description: string;
  triggeringConditions: string;
  operationalInstruction: string;
  emergencyTriggered: boolean;
  latitude: number;
  longitude: number;
}

export interface EmergencyAnalyticsItem {
  id: string;
  code: string;
  stationId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  reportedTime: string;
  status: string;
  casualties: number;
  incidentCommander: string;
  acknowledgementTimeMinutes: number;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationsCount: number;
  responseTeamName: string;
  actionsTakenCount: number;
}

export interface ResponseTeamPerformanceItem {
  teamId: string;
  teamName: string;
  stationId: string;
  lead: string;
  totalEmergenciesHandled: number;
  activeIncidents: number;
  avgAckMinutes: number;
  avgResponseMinutes: number;
  avgResolutionMinutes: number;
  escalationCount: number;
  unacknowledgedCount: number;
  failedNotificationsCount: number;
  readinessScore: number;
}

export interface CommunicationAnalyticsItem {
  totalNotifications: number;
  sent: number;
  delivered: number;
  read: number;
  acknowledged: number;
  failed: number;
  retried: number;
  channels: {
    inApp: { total: number; delivered: number; failed: number };
    email: { total: number; delivered: number; failed: number };
    sms: { total: number; delivered: number; failed: number };
  };
  byModule: Record<string, number>;
  byPriority: Record<string, number>;
  recentDeliveryFailures: {
    id: string;
    code: string;
    title: string;
    channel: string;
    recipientName: string;
    failureReason: string;
    attemptCount: number;
    timestamp: string;
  }[];
}

export interface CrossModuleExpeditionReport {
  expedition: ExpeditionRecord;
  overview: {
    daysTotal: number;
    daysElapsed: number;
    completionPct: number;
    healthIndex: number;
    riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  };
  personnelSummary: {
    total: number;
    deployed: number;
    inTransit: number;
    rolesList: string[];
    teamsList: string[];
    members: PersonnelAnalyticsItem[];
  };
  cargoSummary: {
    containersCount: number;
    totalWeightTons: number;
    totalVolumeM3: number;
    deliveredCount: number;
    inTransitCount: number;
    delayedCount: number;
    hazardousCargoCount: number;
    containers: ContainerAnalyticsItem[];
    cargoItems: CargoAnalyticsItem[];
  };
  shipmentsSummary: {
    total: number;
    active: number;
    completed: number;
    delayed: number;
    shipments: ShipmentAnalyticsItem[];
  };
  inventorySummary: {
    totalAllocatedItems: number;
    lowStockAlerts: number;
    criticalAlerts: number;
    predictedShortages: number;
    items: InventoryAnalyticsItem[];
  };
  assetsSummary: {
    totalAssets: number;
    operational: number;
    maintenanceDue: number;
    damagedOrOffline: number;
    predictedEquipmentNeeds: number;
    assets: AssetAnalyticsItem[];
  };
  safetySummary: {
    totalEmergencies: number;
    activeEmergencies: number;
    resolvedEmergencies: number;
    criticalEmergencies: number;
    emergencies: EmergencyAnalyticsItem[];
  };
  weatherSummary: {
    totalWeatherEvents: number;
    criticalEvents: number;
    activeEvents: number;
    events: WeatherAnalyticsItem[];
  };
  communicationsSummary: {
    totalNotifications: number;
    delivered: number;
    read: number;
    acknowledged: number;
    failed: number;
  };
  auditHistory: {
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }[];
}

export interface ReportingSearchResult {
  query: string;
  timestamp: string;
  counts: {
    expeditions: number;
    personnel: number;
    cargo: number;
    containers: number;
    shipments: number;
    inventory: number;
    assets: number;
    emergencies: number;
    weather: number;
  };
  expeditions: ExpeditionReportItem[];
  personnel: PersonnelAnalyticsItem[];
  cargo: CargoAnalyticsItem[];
  containers: ContainerAnalyticsItem[];
  shipments: ShipmentAnalyticsItem[];
  inventory: InventoryAnalyticsItem[];
  assets: AssetAnalyticsItem[];
  emergencies: EmergencyAnalyticsItem[];
  weather: WeatherAnalyticsItem[];
}

export interface ReportingAuditLogRecord {
  id: string;
  reportType: string;
  reportTitle: string;
  action: 'GENERATED' | 'FILTERED' | 'VIEWED' | 'EXPORTED_CSV' | 'EXPORTED_EXCEL' | 'EXPORTED_PDF' | 'DRILLDOWN';
  userEmail: string;
  userName: string;
  userRole: string;
  filtersJson: string;
  recordsCount: number;
  timestamp: string;
  executionDurationMs: number;
}

export interface KpiDefinition {
  code: string;
  name: string;
  category: 'EXPEDITION' | 'PERSONNEL' | 'CARGO_CONTAINER' | 'SHIPMENT' | 'INVENTORY' | 'ASSET' | 'SAFETY_EMERGENCY' | 'COMMUNICATION';
  formula: string;
  unit: string;
  description: string;
  authoritativeSource: string;
  targetOrBenchmark: string;
}

// Aliases for Reporting & Analytics Module
export type DashboardKpis = ReportingDashboardKpis;
export type PersonnelReportItem = PersonnelAnalyticsItem & {
  station?: string;
  phone?: string;
  movementStatus?: string;
};
export type CargoReportItem = CargoAnalyticsItem & {
  item_name?: string;
  destination_station?: string;
  container_number?: string;
  weight_kg?: number;
  volume_cbm?: number;
  is_hazardous?: boolean;
  hazardous_class?: string;
};
export type ContainerReportItem = ContainerAnalyticsItem & {
  container_number?: string;
  container_type?: string;
  destination_station?: string;
  current_weight_kg?: number;
  max_weight_capacity_kg?: number;
  stowage_priority?: number;
  current_vessel_name?: string;
  journey_status?: string;
  hazardous_items_count?: number;
};
export type ShipmentReportItem = ShipmentAnalyticsItem & {
  trackingNumber?: string;
  mode?: string;
  carrierName?: string;
  originPort?: string;
  destinationPort?: string;
  vesselOrFlightNumber?: string;
  expectedTransitDays?: number;
  actualTransitDays?: number;
  lastCheckpoint?: string;
  containers?: string[];
};
export type InventoryReportItem = InventoryAnalyticsItem & {
  item_name?: string;
  station?: string;
  current_quantity?: number;
  minimum_threshold?: number;
  daily_consumption_rate?: number;
  isCriticalShortage?: boolean;
  resupplyStatus?: string;
};
export type AssetReportItem = AssetAnalyticsItem & {
  station?: string;
  thresholdHours?: number;
  nextMaintenanceDue?: string;
};
export type WeatherReportItem = WeatherAnalyticsItem & {
  station?: string;
  condition?: string;
  safetyAlertActive?: boolean;
  temperatureCelsius?: number;
  windSpeedKnots?: number;
  windDirection?: string;
  visibilityKm?: number;
  operationalDirective?: string;
};
export type EmergencyReportItem = EmergencyAnalyticsItem & {
  station?: string;
  reportedTime?: string;
  actionsTaken?: string[];
};
export type ResponseTeamScorecard = ResponseTeamPerformanceItem & {
  station?: string;
  leaderName?: string;
  assignedPersonnelCount?: number;
  incidentsHandledCount?: number;
  avgResponseSpeedMinutes?: number;
  unacknowledgedAlertsCount?: number;
};
export type CommunicationReportSummary = CommunicationAnalyticsItem & {
  totalDispatches?: number;
  deliveredCount?: number;
  deliverySuccessRate?: number;
  pendingCount?: number;
  failedCount?: number;
  breakdownByModule?: Record<string, number>;
  breakdownByChannel?: Record<string, number>;
};
export type StationReportItem = any;
export type ExpeditionDeepReport = CrossModuleExpeditionReport;




