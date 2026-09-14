import { pgTable, serial, text, integer, doublePrecision, timestamp, boolean } from 'drizzle-orm/pg-core';

// Users table authenticated via Firebase Auth / System Roles
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('Expedition Manager').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Antarctic Expeditions Primary Table
export const expeditions = pgTable('expeditions', {
  id: serial('id').primaryKey(),
  expeditionId: text('expedition_id').notNull().unique(),
  expeditionName: text('expedition_name').notNull(),
  expeditionCode: text('expedition_code').notNull().unique(),
  expeditionYear: integer('expedition_year').notNull(),
  description: text('description'),
  missionObjective: text('mission_objective'),
  targetRegion: text('target_region').notNull(),
  leadOrganization: text('lead_organization').notNull(),
  expeditionLeader: text('expedition_leader').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').notNull(), // 'Planned', 'Approved', 'Active', 'Completed', 'Cancelled'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
});

// Expedition Audit Logs Table
export const expeditionAuditLogs = pgTable('expedition_audit_logs', {
  id: serial('id').primaryKey(),
  expeditionId: text('expedition_id').notNull(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(), // 'CREATED', 'UPDATED', 'STATUS_CHANGED', 'APPROVED', 'ACTIVATED', 'COMPLETED', 'CANCELLED', 'DELETE_ATTEMPTED', 'DELETED'
  previousState: text('previous_state'),
  newState: text('new_state'),
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Future Module Relational Structures (Foreign keys to expedition_id)
export const expeditionPersonnelLinks = pgTable('expedition_personnel_links', {
  id: serial('id').primaryKey(),
  expeditionId: text('expedition_id').notNull(),
  personnelCode: text('personnel_code').notNull(),
  role: text('role').notNull(),
  status: text('status').default('ASSIGNED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expeditionTeamLinks = pgTable('expedition_team_links', {
  id: serial('id').primaryKey(),
  expeditionId: text('expedition_id').notNull(),
  teamName: text('team_name').notNull(),
  teamLead: text('team_lead').notNull(),
  discipline: text('discipline').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expeditionLocationLinks = pgTable('expedition_location_links', {
  id: serial('id').primaryKey(),
  expeditionId: text('expedition_id').notNull(),
  locationName: text('location_name').notNull(),
  coordinates: text('coordinates').notNull(),
  purpose: text('purpose').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expeditionCargoLinks = pgTable('expedition_cargo_links', {
  id: serial('id').primaryKey(),
  expeditionId: text('expedition_id').notNull(),
  containerNo: text('container_no').notNull(),
  cargoType: text('cargo_type').notNull(),
  weightKg: doublePrecision('weight_kg').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expeditionShipmentLinks = pgTable('expedition_shipment_links', {
  id: serial('id').primaryKey(),
  expeditionId: text('expedition_id').notNull(),
  shipmentCode: text('shipment_code').notNull(),
  vesselName: text('vessel_name').notNull(),
  portOfLoading: text('port_of_loading').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expeditionInventoryLinks = pgTable('expedition_inventory_links', {
  id: serial('id').primaryKey(),
  expeditionId: text('expedition_id').notNull(),
  itemCode: text('item_code').notNull(),
  itemName: text('item_name').notNull(),
  allocatedQuantity: integer('allocated_quantity').notNull(),
  unit: text('unit').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expeditionAssetLinks = pgTable('expedition_asset_links', {
  id: serial('id').primaryKey(),
  expeditionId: text('expedition_id').notNull(),
  assetCode: text('asset_code').notNull(),
  assetName: text('asset_name').notNull(),
  category: text('category').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Expedition Missions (Legacy / compatibility)
export const missions = pgTable('missions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  lead: text('lead').notNull(),
  station: text('station').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  priority: text('priority').notNull(), // CRITICAL, STRATEGIC, ROUTINE
  status: text('status').notNull(), // Active, En Route, Scheduled, Completed
  objectives: text('objectives').notNull(),
  personnelCount: integer('personnel_count').notNull(),
  requiredFuelKl: integer('required_fuel_kl').notNull(),
  riskIndex: text('risk_index').notNull(), // Low, Moderate, High, Severe
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Cargo Fleet Tracking
export const cargoItems = pgTable('cargo_items', {
  id: serial('id').primaryKey(),
  rfid: text('rfid').notNull().unique(),
  containerNo: text('container_no').notNull(),
  cargoType: text('cargo_type').notNull(),
  priority: text('priority').notNull(),
  departurePort: text('departure_port').notNull(),
  destination: text('destination').notNull(),
  vessel: text('vessel').notNull(),
  voyageId: text('voyage_id').notNull(),
  eta: text('eta').notNull(),
  status: text('status').notNull(), // In Transit, Cleared Customs, Discharged, Delayed
  tempCurrent: doublePrecision('temp_current').notNull(),
  tempTarget: doublePrecision('temp_target').notNull(),
  weightTons: doublePrecision('weight_tons').notNull(),
  hazmatClass: text('hazmat_class'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Station Inventory Ledger & Consumables
export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  station: text('station').notNull(),
  stock: integer('stock').notNull(),
  unit: text('unit').notNull(),
  minThreshold: integer('min_threshold').notNull(),
  dailyDepletion: integer('daily_depletion').notNull(),
  resupplyWindow: text('resupply_window').notNull(),
  daysRemaining: integer('days_remaining').notNull(),
  status: text('status').notNull(), // Nominal, Critical, Severe Deficit
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Heavy Equipment & Assets
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  station: text('station').notNull(),
  model: text('model').notNull(),
  status: text('status').notNull(), // Operational, Service Due, Cold Standby, Fault Alert
  hoursTotal: integer('hours_total').notNull(),
  serviceIntervalHours: integer('service_interval_hours').notNull(),
  hoursSinceService: integer('hours_since_service').notNull(),
  vibrationIndex: doublePrecision('vibration_index').notNull(),
  lastInspection: text('last_inspection').notNull(),
  sparesStatus: text('spares_status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Personnel Roster & Rotation
export const personnel = pgTable('personnel', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  station: text('station').notNull(),
  status: text('status').notNull(), // Deployed, In Transit, Quarantine, Evac Ready
  medicalClearance: text('medical_clearance').notNull(), // Class 1 Polar, Re-Eval Due
  polarCertValidUntil: text('polar_cert_valid_until').notNull(),
  transitLeg: text('transit_leg').notNull(),
  nextRotationDate: text('next_rotation_date').notNull(),
  bloodGroup: text('blood_group').notNull(),
  emergencyContact: text('emergency_contact').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Emergency Incident Command
export const emergencies = pgTable('emergencies', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type').notNull(),
  station: text('station').notNull(),
  status: text('status').notNull(), // Active, Contained, Drill, Resolved
  severity: text('severity').notNull(), // CRITICAL, WARNING, DRILL
  title: text('title').notNull(),
  timestamp: text('timestamp').notNull(),
  casualties: integer('casualties').default(0).notNull(),
  actionDirectives: text('action_directives').notNull(), // JSON or delimited string
  situationReport: text('situation_report').notNull(),
  resolvedAt: text('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================
// INVENTORY MANAGEMENT & PREDICTION SPECIFICATION SCHEMAS
// ==============================================================

// 1. Inventory Items Master (Station-independent, Expedition-aware)
export const invItemsMaster = pgTable('inv_items_master', {
  id: serial('id').primaryKey(),
  itemCode: text('item_code').notNull(),
  itemName: text('item_name').notNull(),
  category: text('category').notNull(), // Food, Water, Fuel, Medical supplies, Batteries, Scientific consumables, Cleaning supplies, Spare consumables, Operational provisions
  description: text('description'),
  unit: text('unit').notNull(), // L, kg, packs, units, cylinders
  stationId: text('station_id').notNull(), // bharati, maitri, himadri, etc.
  expeditionId: text('expedition_id').notNull(), // EXP-2026-045, etc.
  currentQuantity: doublePrecision('current_quantity').notNull().default(0),
  minimumStock: doublePrecision('minimum_stock').notNull().default(0),
  safetyStock: doublePrecision('safety_stock').notNull().default(0),
  maximumCapacity: doublePrecision('maximum_capacity').notNull().default(0),
  reorderLevel: doublePrecision('reorder_level').notNull().default(0),
  expiryDate: text('expiry_date'),
  status: text('status').notNull().default('NORMAL'), // NORMAL, LOW, CRITICAL, OUT_OF_STOCK, EXPIRED
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Inventory Transaction Ledger
export const invTransactions = pgTable('inv_transactions', {
  id: serial('id').primaryKey(),
  inventoryItemId: integer('inventory_item_id').notNull(),
  transactionType: text('transaction_type').notNull(), // OPENING_STOCK, RECEIPT, CONSUMPTION, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT, DAMAGE, EXPIRY, RESUPPLY, RETURN
  quantity: doublePrecision('quantity').notNull(), // positive = increase, negative = decrease
  timestamp: text('timestamp').notNull(),
  reason: text('reason').notNull(),
  referenceType: text('reference_type'), // SHIPMENT, CARGO_MANIFEST, EXPEDITION_PERSONNEL, DAILY_LOG, AUDIT
  referenceId: text('reference_id'),
  performedBy: text('performed_by').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Inventory Alerts & Stockout Notifications
export const invAlerts = pgTable('inv_alerts', {
  id: serial('id').primaryKey(),
  inventoryItemId: integer('inventory_item_id').notNull(),
  alertType: text('alert_type').notNull().default('STOCKOUT_RISK'), // STOCKOUT_RISK, EXPIRING_SOON, EXPIRED, DEFICIT_WARNING
  severity: text('severity').notNull(), // HIGH, MEDIUM, LOW, CRITICAL
  stationId: text('station_id').notNull(),
  itemCode: text('item_code').notNull(),
  itemName: text('item_name').notNull(),
  currentStock: doublePrecision('current_stock').notNull(),
  predictedDailyConsumption: doublePrecision('predicted_daily_consumption').notNull(),
  estimatedStockoutDays: doublePrecision('estimated_stockout_days').notNull(),
  nextShipmentEtaDays: doublePrecision('next_shipment_eta_days').notNull(),
  riskScore: text('risk_score').notNull(), // HIGH, MEDIUM, LOW
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Responsible Officer Notification History
export const invNotifications = pgTable('inv_notifications', {
  id: serial('id').primaryKey(),
  alertId: integer('alert_id'),
  recipientId: text('recipient_id').notNull(),
  recipientName: text('recipient_name').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  channel: text('channel').notNull(), // Email, SMS, In-app
  message: text('message').notNull(),
  sentAt: text('sent_at').notNull(),
  deliveryStatus: text('delivery_status').notNull().default('SENT'), // PENDING, SENT, DELIVERED, FAILED, ACKNOWLEDGED
  failureReason: text('failure_reason'),
  acknowledgedAt: text('acknowledged_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Resupply Requests & Verification
export const invResupplyRequests = pgTable('inv_resupply_requests', {
  id: serial('id').primaryKey(),
  requestCode: text('request_code').notNull().unique(),
  inventoryItemId: integer('inventory_item_id').notNull(),
  stationId: text('station_id').notNull(),
  expeditionId: text('expedition_id').notNull(),
  requestedQuantity: doublePrecision('requested_quantity').notNull(),
  approvedQuantity: doublePrecision('approved_quantity'),
  receivedQuantity: doublePrecision('received_quantity'),
  status: text('status').notNull().default('PENDING_REVIEW'), // PENDING_REVIEW, APPROVED, CARGO_ASSIGNED, IN_TRANSIT, ARRIVED, VERIFIED, REJECTED
  requestedBy: text('requested_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: text('approved_at'),
  notes: text('notes'),
  cargoCode: text('cargo_code'),
  vesselName: text('vessel_name'),
  etaDays: integer('eta_days'),
  discrepancyQuantity: doublePrecision('discrepancy_quantity'),
  discrepancyReason: text('discrepancy_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. ML Model Tracking & Performance Logs
export const invModelPerformanceLogs = pgTable('inv_model_performance_logs', {
  id: serial('id').primaryKey(),
  modelName: text('model_name').notNull(),
  modelVersion: text('model_version').notNull(),
  algorithm: text('algorithm').notNull(), // GradientBoostedRegression_LightGBM_Equivalent
  evaluationDate: text('evaluation_date').notNull(),
  mae: doublePrecision('mae').notNull(),
  rmse: doublePrecision('rmse').notNull(),
  r2Score: doublePrecision('r2_score').notNull(),
  status: text('status').notNull().default('OPTIMAL'), // OPTIMAL, DEGRADED, FALLBACK_ACTIVE
  totalInferences: integer('total_inferences').notNull().default(0),
  retrainedAt: text('retrained_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==============================================================
// ASSET MANAGEMENT & EQUIPMENT PREDICTION SCHEMAS
// ==============================================================

// 1. Assets Master Register
export const assetsMaster = pgTable('assets_master', {
  id: serial('id').primaryKey(),
  assetId: text('asset_id').notNull().unique(), // e.g. AST-001
  assetName: text('asset_name').notNull(),
  assetCategory: text('asset_category').notNull(),
  assetType: text('asset_type').notNull(),
  serialNumber: text('serial_number'),
  manufacturer: text('manufacturer').notNull(),
  model: text('model').notNull(),
  description: text('description'),
  expeditionId: text('expedition_id').notNull(),
  assignedStation: text('assigned_station').notNull(),
  assignedTeam: text('assigned_team'),
  assignedPersonnel: text('assigned_personnel'),
  currentLocation: text('current_location').notNull(),
  acquisitionDate: text('acquisition_date').notNull(),
  commissionDate: text('commission_date').notNull(),
  expectedLifetime: text('expected_lifetime').notNull(),
  condition: text('condition').notNull().default('GOOD'), // EXCELLENT, GOOD, FAIR, POOR, CRITICAL
  status: text('status').notNull().default('AVAILABLE'), // AVAILABLE, ASSIGNED, IN_USE, UNDER_MAINTENANCE, DAMAGED, LOST, DECOMMISSIONED
  lastMaintenanceDate: text('last_maintenance_date'),
  nextMaintenanceDate: text('next_maintenance_date'),
  operatingHours: doublePrecision('operating_hours').notNull().default(0),
  maintenanceThresholdHours: doublePrecision('maintenance_threshold_hours').notNull().default(500),
  vibrationIndex: doublePrecision('vibration_index').notNull().default(1.0),
  healthScore: doublePrecision('health_score').notNull().default(100),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Asset Assignment Ledger
export const assetAssignments = pgTable('asset_assignments', {
  id: serial('id').primaryKey(),
  assetId: text('asset_id').notNull(),
  assignedStation: text('assigned_station').notNull(),
  assignedTeam: text('assigned_team'),
  assignedPersonnel: text('assigned_personnel'),
  expeditionId: text('expedition_id').notNull(),
  assignedLocation: text('assigned_location').notNull(),
  assignmentDate: text('assignment_date').notNull(),
  releaseDate: text('release_date'),
  assignedBy: text('assigned_by').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Asset Transfer Ledger
export const assetTransfers = pgTable('asset_transfers', {
  id: serial('id').primaryKey(),
  assetId: text('asset_id').notNull(),
  fromLocation: text('from_location').notNull(),
  toLocation: text('to_location').notNull(),
  transferDate: text('transfer_date').notNull(),
  personResponsible: text('person_responsible').notNull(),
  reason: text('reason').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Asset Maintenance Records
export const assetMaintenanceRecords = pgTable('asset_maintenance_records', {
  id: serial('id').primaryKey(),
  assetId: text('asset_id').notNull(),
  maintenanceType: text('maintenance_type').notNull(), // PREVENTIVE, CORRECTIVE, OVERHAUL, CALIBRATION, EMERGENCY
  problem: text('problem').notNull(),
  inspectionDetails: text('inspection_details').notNull(),
  workPerformed: text('work_performed').notNull(),
  technician: text('technician').notNull(),
  maintenanceDate: text('maintenance_date').notNull(),
  nextMaintenanceDate: text('next_maintenance_date').notNull(),
  maintenanceStatus: text('maintenance_status').notNull().default('SCHEDULED'), // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  partsUsed: text('parts_used'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Asset Damage & Incident Records
export const assetIncidents = pgTable('asset_incidents', {
  id: serial('id').primaryKey(),
  incidentCode: text('incident_code').notNull().unique(),
  assetId: text('asset_id').notNull(),
  incidentType: text('incident_type').notNull(), // DAMAGED, LOST, MISSING, FAILURE, OTHER
  severity: text('severity').notNull().default('MEDIUM'), // CRITICAL, HIGH, MEDIUM, LOW
  description: text('description').notNull(),
  location: text('location').notNull(),
  reportedBy: text('reported_by').notNull(),
  reportedDate: text('reported_date').notNull(),
  status: text('status').notNull().default('REPORTED'), // REPORTED, INVESTIGATING, REPAIRED, RECOVERED, CLOSED
  resolutionNotes: text('resolution_notes'),
  resolvedAt: text('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Asset Requirement Predictions (ML & Rule-based)
export const assetPredictions = pgTable('asset_predictions', {
  id: serial('id').primaryKey(),
  expeditionId: text('expedition_id').notNull(),
  stationId: text('station_id').notNull(),
  assetCategory: text('asset_category').notNull(),
  assetType: text('asset_type').notNull(),
  predictedRequirement: integer('predicted_requirement').notNull(),
  currentlyAvailable: integer('currently_available').notNull(),
  predictedShortage: integer('predicted_shortage').notNull(),
  predictionHorizon: text('prediction_horizon').notNull(),
  riskLevel: text('risk_level').notNull().default('MEDIUM'), // HIGH, MEDIUM, LOW
  confidenceMetric: doublePrecision('confidence_metric').notNull().default(0.85),
  modelVersion: text('model_version').notNull(),
  predictionDate: text('prediction_date').notNull(),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, RESOLVED, REVIEWED
  reason: text('reason').notNull(),
  algorithmUsed: text('algorithm_used').notNull(),
  isFallback: boolean('is_fallback').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Asset Supply Requests (Procurement / Resupply Workflow)
export const assetSupplyRequests = pgTable('asset_supply_requests', {
  id: serial('id').primaryKey(),
  requestCode: text('request_code').notNull().unique(), // e.g. ASR-2026-001
  expeditionId: text('expedition_id').notNull(),
  stationId: text('station_id').notNull(),
  assetType: text('asset_type').notNull(),
  assetCategory: text('asset_category').notNull(),
  requestedQuantity: integer('requested_quantity').notNull(),
  predictedQuantity: integer('predicted_quantity').notNull(),
  approvedQuantity: integer('approved_quantity'),
  receivedQuantity: integer('received_quantity'),
  reason: text('reason').notNull(),
  requestedBy: text('requested_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: text('approved_at'),
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, IN_PREPARATION, IN_TRANSIT, RECEIVED, COMPLETED
  cargoCode: text('cargo_code'),
  containerNo: text('container_no'),
  vesselName: text('vessel_name'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 8. Asset Notifications (Dispatched to India Asset Logistics Officer)
export const assetNotifications = pgTable('asset_notifications', {
  id: serial('id').primaryKey(),
  alertId: integer('alert_id'),
  alertType: text('alert_type').notNull(), // EQUIPMENT_SHORTAGE, MAINTENANCE_DUE, CRITICAL_INCIDENT, FOOD_SHORTAGE
  department: text('department').notNull(),
  officerName: text('officer_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  channel: text('channel').notNull().default('Email'), // Email, SMS, In-App
  sentAt: text('sent_at').notNull(),
  deliveryStatus: text('delivery_status').notNull().default('SENT'), // SENT, DELIVERED, ACKNOWLEDGED, FAILED
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Asset Audit Trail
export const assetAuditLogs = pgTable('asset_audit_logs', {
  id: serial('id').primaryKey(),
  assetId: text('asset_id').notNull(),
  user: text('user').notNull(),
  action: text('action').notNull(),
  previousValue: text('previous_value'),
  newValue: text('new_value'),
  details: text('details').notNull(),
  timestamp: text('timestamp').notNull(),
});

// 10. Asset ML Model Tracking & Performance
export const assetModelPerformanceLogs = pgTable('asset_model_performance_logs', {
  id: serial('id').primaryKey(),
  modelName: text('model_name').notNull(),
  modelVersion: text('model_version').notNull(),
  algorithm: text('algorithm').notNull(), // RandomForest_LightEnsemble_Regressor
  evaluationDate: text('evaluation_date').notNull(),
  mae: doublePrecision('mae').notNull(),
  rmse: doublePrecision('rmse').notNull(),
  r2Score: doublePrecision('r2_score').notNull(),
  status: text('status').notNull().default('OPTIMAL'), // OPTIMAL, DEGRADED, FALLBACK_ACTIVE
  totalInferences: integer('total_inferences').notNull().default(0),
  retrainedAt: text('retrained_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// =============================================================
// WEATHER & ENVIRONMENTAL MONITORING TABLES
// =============================================================

// 1. Weather Observations (Normalized parameters from weather provider)
export const weatherObservations = pgTable('weather_observations', {
  id: serial('id').primaryKey(),
  observationId: text('observation_id').notNull().unique(),
  source: text('source').notNull(), // Open-Meteo Polar & Marine API
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  stationId: text('station_id'),
  vesselId: text('vessel_id'),
  expeditionId: text('expedition_id'),
  observedAt: text('observed_at').notNull(),
  temperature: doublePrecision('temperature').notNull(),
  apparentTemperature: doublePrecision('apparent_temperature'),
  windSpeed: doublePrecision('wind_speed').notNull(),
  windDirection: doublePrecision('wind_direction').notNull(),
  windGust: doublePrecision('wind_gust').notNull(),
  precipitation: doublePrecision('precipitation').notNull(),
  snow: doublePrecision('snow').notNull(),
  visibility: doublePrecision('visibility').notNull(),
  pressure: doublePrecision('pressure').notNull(),
  waveHeight: doublePrecision('wave_height'),
  wavePeriod: doublePrecision('wave_period'),
  waveDirection: doublePrecision('wave_direction'),
  seaState: text('sea_state'),
  weatherCondition: text('weather_condition').notNull(),
  weatherCode: integer('weather_code'),
  rawSourceReference: text('raw_source_reference'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Weather Forecasts
export const weatherForecasts = pgTable('weather_forecasts', {
  id: serial('id').primaryKey(),
  forecastId: text('forecast_id').notNull().unique(),
  location: text('location').notNull(),
  stationId: text('station_id'),
  vesselId: text('vessel_id'),
  source: text('source').notNull(),
  retrievedAt: text('retrieved_at').notNull(),
  forecastDataJson: text('forecast_data_json').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Weather Safety Rules (Configurable thresholds)
export const weatherRules = pgTable('weather_rules', {
  id: serial('id').primaryKey(),
  ruleId: text('rule_id').notNull().unique(),
  name: text('name').notNull(),
  environmentType: text('environment_type').notNull(), // 'SHIP', 'STATION'
  parameter: text('parameter').notNull(), // 'wind_speed', 'wind_gust', 'temperature', 'visibility', 'wave_height', etc.
  operator: text('operator').notNull(), // '>', '>=', '<', '<=', '==', '!='
  threshold: doublePrecision('threshold').notNull(),
  severity: text('severity').notNull(), // 'WATCH', 'WARNING', 'CRITICAL'
  enabled: boolean('enabled').default(true).notNull(),
  description: text('description').notNull(),
  combinedConditionsJson: text('combined_conditions_json'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Weather Events (Lifecycle: DETECTED -> ACTIVE -> MONITORED -> CONDITIONS_IMPROVE -> RESOLVED)
export const weatherEvents = pgTable('weather_events', {
  id: serial('id').primaryKey(),
  eventId: text('event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  severity: text('severity').notNull(),
  environmentType: text('environment_type').notNull(),
  stationId: text('station_id'),
  vesselId: text('vessel_id'),
  expeditionId: text('expedition_id'),
  targetName: text('target_name').notNull(),
  detectedAt: text('detected_at').notNull(),
  startTime: text('start_time').notNull(),
  expectedEndTime: text('expected_end_time'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  description: text('description').notNull(),
  triggeringConditions: text('triggering_conditions').notNull(),
  status: text('status').notNull().default('DETECTED'),
  resolvedAt: text('resolved_at'),
  resolvedBy: text('resolved_by'),
  emergencyId: text('emergency_id'),
  isEarlyWarning: boolean('is_early_warning').default(false),
  operationalInstruction: text('operational_instruction').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Weather Alerts & Dispatches
export const weatherAlerts = pgTable('weather_alerts', {
  id: serial('id').primaryKey(),
  alertId: text('alert_id').notNull().unique(),
  eventId: text('event_id').notNull(),
  severity: text('severity').notNull(),
  environmentType: text('environment_type').notNull(),
  targetId: text('target_id').notNull(),
  targetName: text('target_name').notNull(),
  recipientId: text('recipient_id').notNull(),
  recipientRole: text('recipient_role').notNull(),
  recipientName: text('recipient_name').notNull(),
  recipientContact: text('recipient_contact'),
  message: text('message').notNull(),
  channel: text('channel').notNull().default('IN_APP'),
  status: text('status').notNull().default('PENDING'),
  deliveredTime: text('delivered_time'),
  acknowledgedTime: text('acknowledged_time'),
  acknowledgedBy: text('acknowledged_by'),
  escalationContact: text('escalation_contact'),
  escalatedTime: text('escalated_time'),
  isEscalated: boolean('is_escalated').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Weather Audit Logs
export const weatherAuditLogs = pgTable('weather_audit_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  userId: text('user_id'),
  userEmail: text('user_email'),
  timestamp: text('timestamp').notNull(),
});

// =============================================================
// COMMUNICATION & NOTIFICATION MODULE SCHEMA
// =============================================================

// 1. Primary Notifications Table
export const notificationsTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  notificationCode: text('notification_code').notNull().unique(),
  sourceModule: text('source_module').notNull(), // 'EMERGENCY', 'WEATHER', 'INVENTORY', 'ASSET', 'SHIPMENT', 'EXPEDITION', 'PERSONNEL', 'SYSTEM'
  sourceEventId: text('source_event_id').notNull(),
  notificationType: text('notification_type').notNull(),
  priority: text('priority').notNull(), // 'LOW', 'NORMAL', 'HIGH', 'CRITICAL'
  title: text('title').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('CREATED'), // 'CREATED', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'ACKNOWLEDGED', 'FAILED', 'RETRYING', 'EXPIRED'
  createdAt: timestamp('created_at').defaultNow(),
  sentAt: text('sent_at'),
  deliveredAt: text('delivered_at'),
  readAt: text('read_at'),
  expiresAt: text('expires_at'),
  acknowledgedAt: text('acknowledged_at'),
  acknowledgedBy: text('acknowledged_by'),
  requiresAcknowledgement: boolean('requires_acknowledgement').default(false).notNull(),
  stationId: text('station_id'),
  vesselId: text('vessel_id'),
  expeditionId: text('expedition_id'),
  metadataJson: text('metadata_json'),
});

// 2. Notification Recipients Table
export const notificationRecipientsTable = pgTable('notification_recipients', {
  id: serial('id').primaryKey(),
  notificationId: text('notification_id').notNull(),
  recipientId: text('recipient_id').notNull(),
  recipientName: text('recipient_name').notNull(),
  recipientEmail: text('recipient_email'),
  recipientPhone: text('recipient_phone'),
  recipientRole: text('recipient_role').notNull(),
  recipientType: text('recipient_type').notNull(),
  deliveryStatus: text('delivery_status').notNull().default('CREATED'),
  channelsJson: text('channels_json').notNull(), // Array of channels e.g. ["IN_APP", "SMS", "EMAIL"]
  sentAt: text('sent_at'),
  deliveredAt: text('delivered_at'),
  readAt: text('read_at'),
  acknowledgedAt: text('acknowledged_at'),
  failureReason: text('failure_reason'),
});

// 3. Notification Predefined Templates Table
export const notificationTemplatesTable = pgTable('notification_templates', {
  id: serial('id').primaryKey(),
  templateCode: text('template_code').notNull().unique(),
  templateName: text('template_name').notNull(),
  notificationType: text('notification_type').notNull(),
  channel: text('channel').notNull().default('ALL'), // 'IN_APP', 'EMAIL', 'SMS', 'ALL'
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  variablesDescriptionJson: text('variables_description_json'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Notification Delivery Attempts Table
export const notificationAttemptsTable = pgTable('notification_attempts', {
  id: serial('id').primaryKey(),
  notificationId: text('notification_id').notNull(),
  recipientId: text('recipient_id').notNull(),
  channel: text('channel').notNull(), // 'IN_APP', 'EMAIL', 'SMS'
  attemptNumber: integer('attempt_number').notNull(),
  attemptedAt: text('attempted_at').notNull(),
  status: text('status').notNull(), // 'SUCCESS', 'FAILED', 'TIMEOUT', 'REJECTED'
  providerName: text('provider_name').notNull(),
  providerResponse: text('provider_response').notNull(),
  failureReason: text('failure_reason'),
});

// 5. Notification Personnel Preferences Table
export const notificationPreferencesTable = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  personnelId: text('personnel_id').notNull(),
  personnelName: text('personnel_name').notNull(),
  channel: text('channel').notNull(), // 'IN_APP', 'EMAIL', 'SMS'
  notificationType: text('notification_type').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  isMandatory: boolean('is_mandatory').default(false).notNull(),
});

// 6. Notification Audit Log Table
export const notificationAuditLogsTable = pgTable('notification_audit_logs', {
  id: serial('id').primaryKey(),
  notificationId: text('notification_id'),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  previousState: text('previous_state'),
  newState: text('new_state'),
  details: text('details').notNull(),
  timestamp: text('timestamp').notNull(),
});

