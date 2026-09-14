import { 
  NotificationTemplateRecord, 
  NotificationRecord, 
  NotificationPreferenceRecord,
  RecipientType,
  NotificationChannel
} from '../types.ts';

// Personnel Contact Directory for Recipient Resolver (Section 5, 6, 22)
export interface PersonnelContact {
  id: string;
  name: string;
  role: string;
  recipient_type: RecipientType;
  station_id?: string;
  vessel_id?: string;
  email: string;
  phone: string;
  in_app_id: string;
  is_active: boolean;
}

export const INITIAL_CONTACT_DIRECTORY: PersonnelContact[] = [
  {
    id: 'PER-HQ-01',
    name: 'Dr. M. Ravichandran',
    role: 'NCPOR Director / Mission Executive',
    recipient_type: 'CENTRAL_OPERATIONS',
    email: 'director@ncpor.gov.in',
    phone: '+91-832-2525500',
    in_app_id: 'director',
    is_active: true,
  },
  {
    id: 'PER-HQ-02',
    name: 'Dr. Rajesh Sharma',
    role: 'Expedition Planning Director',
    recipient_type: 'EXPEDITION_MANAGER',
    email: 'rajesh.sharma@ncpor.gov.in',
    phone: '+91-832-2525515',
    in_app_id: 'rajesh.sharma',
    is_active: true,
  },
  {
    id: 'PER-HQ-03',
    name: 'Dr. Vandana Rao',
    role: 'Food & Consumables Officer',
    recipient_type: 'FOOD_LOGISTICS_OFFICER',
    email: 'vandana.rao@ncpor.gov.in',
    phone: '+91-832-2525532',
    in_app_id: 'vandana.rao',
    is_active: true,
  },
  {
    id: 'PER-HQ-04',
    name: 'Er. Amitav Sen',
    role: 'Polar Equipment & Asset Specialist',
    recipient_type: 'ASSET_LOGISTICS_OFFICER',
    email: 'amitav.sen@ncpor.gov.in',
    phone: '+91-832-2525544',
    in_app_id: 'amitav.sen',
    is_active: true,
  },
  {
    id: 'PER-HQ-05',
    name: 'Capt. R. Deshmukh',
    role: 'Marine Logistics & Shipment Director',
    recipient_type: 'LOGISTICS_OFFICER',
    email: 'r.deshmukh@mormugaoport.gov.in',
    phone: '+91-832-2521122',
    in_app_id: 'r.deshmukh',
    is_active: true,
  },
  {
    id: 'PER-BH-01',
    name: 'Dr. Arunav Roy',
    role: 'Station Commander',
    recipient_type: 'STATION_PERSONNEL',
    station_id: 'bharati',
    email: 'commander.bharati@ncpor.gov.in',
    phone: '+8816-7770-1001', // Iridium Sat Phone
    in_app_id: 'arunav.roy',
    is_active: true,
  },
  {
    id: 'PER-BH-02',
    name: 'Dr. Priya Nair',
    role: 'Chief Medical Officer & Medical Team Lead',
    recipient_type: 'EMERGENCY_RESPONSE_TEAM',
    station_id: 'bharati',
    email: 'medical.bharati@ncpor.gov.in',
    phone: '+8816-7770-1002',
    in_app_id: 'priya.nair',
    is_active: true,
  },
  {
    id: 'PER-BH-03',
    name: 'Er. Tenzing Norbu',
    role: 'Life Support & Fire Safety Lead',
    recipient_type: 'EMERGENCY_RESPONSE_TEAM',
    station_id: 'bharati',
    email: 'lifesupport.bharati@ncpor.gov.in',
    phone: '+8816-7770-1003',
    in_app_id: 'tenzing.norbu',
    is_active: true,
  },
  {
    id: 'PER-MT-01',
    name: 'Dr. Sunita Kulkarni',
    role: 'Station Commander',
    recipient_type: 'STATION_PERSONNEL',
    station_id: 'maitri',
    email: 'commander.maitri@ncpor.gov.in',
    phone: '+8816-7770-2001',
    in_app_id: 'sunita.kulkarni',
    is_active: true,
  },
  {
    id: 'PER-MT-02',
    name: 'Dr. Alok Verma',
    role: 'Station Medical Officer',
    recipient_type: 'EMERGENCY_RESPONSE_TEAM',
    station_id: 'maitri',
    email: 'medical.maitri@ncpor.gov.in',
    phone: '+8816-7770-2002',
    in_app_id: 'alok.verma',
    is_active: true,
  },
  {
    id: 'PER-HM-01',
    name: 'Dr. K. Swaminathan',
    role: 'Himadri Arctic Station Lead',
    recipient_type: 'STATION_PERSONNEL',
    station_id: 'himadri',
    email: 'station.himadri@ncpor.gov.in',
    phone: '+47-7902-8811',
    in_app_id: 'k.swaminathan',
    is_active: true,
  },
  {
    id: 'PER-VS-01',
    name: 'Capt. Oleg Morozov',
    role: 'Master, MV Vasiliy Golovnin',
    recipient_type: 'OPERATIONS_OFFICER',
    vessel_id: 'VESSEL-01',
    email: 'master.golovnin@fesco.com',
    phone: '+8816-4321-9988',
    in_app_id: 'oleg.morozov',
    is_active: true,
  },
];

// Predefined Notification Templates (Section 8, 9) - NO LLM!
export const INITIAL_NOTIFICATION_TEMPLATES: NotificationTemplateRecord[] = [
  {
    id: 'TPL-EMG-01',
    template_code: 'CRITICAL_EMERGENCY',
    template_name: 'Critical Emergency Incident Alert',
    notification_type: 'EMERGENCY',
    channel: 'ALL',
    subject: '🚨 CRITICAL EMERGENCY ALERT: {{emergency_type}} at {{station_name}}',
    body: `CRITICAL EMERGENCY ALERT

Incident Code: {{emergency_code}}
Station/Location: {{station_name}}
Emergency Type: {{emergency_type}}
Severity: {{severity}}
Reported By: {{reported_by}}
Detected At: {{detected_at}}

Situation Report:
{{description}}

Assigned Response Team: {{response_team}}
Operational Directive: Follow the organization's approved emergency response procedure. Immediate response acknowledgement required.

NCPOR POLAR EMERGENCY COMMAND`,
    enabled: true,
    version: 1,
    variables_description: [
      'emergency_code',
      'station_name',
      'emergency_type',
      'severity',
      'reported_by',
      'detected_at',
      'description',
      'response_team',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-EMG-02',
    template_code: 'EMERGENCY_ESCALATION',
    template_name: 'Emergency Response Escalation',
    notification_type: 'EMERGENCY',
    channel: 'ALL',
    subject: '⚠️ ESCALATION LEVEL {{escalation_level}}: {{emergency_code}} at {{station_name}}',
    body: `EMERGENCY ESCALATION DIRECTIVE

Incident Code: {{emergency_code}}
Station: {{station_name}}
Escalation Level: LEVEL {{escalation_level}} ({{escalated_to_role}})
Reason: {{escalation_reason}}
Elapsed Time Without Ack: {{elapsed_minutes}} minutes

Current Situation:
{{description}}

Immediate intervention mandated by NCPOR Central Operations.`,
    enabled: true,
    version: 1,
    variables_description: [
      'emergency_code',
      'station_name',
      'escalation_level',
      'escalated_to_role',
      'escalation_reason',
      'elapsed_minutes',
      'description',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-WX-01',
    template_code: 'CRITICAL_WEATHER_EMERGENCY',
    template_name: 'Critical Weather Emergency Alert',
    notification_type: 'CRITICAL_WEATHER_EMERGENCY',
    channel: 'ALL',
    subject: '🔴 CRITICAL WEATHER ALERT: {{weather_condition}} at {{station_name}}',
    body: `CRITICAL WEATHER ALERT

Station:
{{station_name}}

Condition:
{{weather_condition}}

Severity:
{{severity}}

Detected At:
{{detected_at}}

Wind Speed: {{wind_speed}} km/h | Gusts: {{wind_gust}} km/h | Temperature: {{temperature}}°C

Follow the organization's approved emergency procedure. Exterior movement is frozen immediately.`,
    enabled: true,
    version: 1,
    variables_description: [
      'station_name',
      'weather_condition',
      'severity',
      'detected_at',
      'wind_speed',
      'wind_gust',
      'temperature',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-WX-02',
    template_code: 'WEATHER_WARNING',
    template_name: 'Weather Warning Advisory',
    notification_type: 'WEATHER_WARNING',
    channel: 'ALL',
    subject: '🟡 WEATHER WARNING: {{weather_condition}} at {{station_name}}',
    body: `WEATHER ADVISORY & WARNING

Target: {{station_name}}
Event: {{weather_condition}}
Severity: {{severity}}
Observed Wind: {{wind_speed}} km/h | Visibility: {{visibility}} km
Detected At: {{detected_at}}

Safety Directive:
{{operational_instruction}}

Please monitor radar and prepare outdoor assets for securing.`,
    enabled: true,
    version: 1,
    variables_description: [
      'station_name',
      'weather_condition',
      'severity',
      'wind_speed',
      'visibility',
      'detected_at',
      'operational_instruction',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-INV-01',
    template_code: 'FOOD_REQUIREMENT',
    template_name: 'Food Supply Requirement Alert',
    notification_type: 'FOOD_REQUIREMENT',
    channel: 'ALL',
    subject: '📦 Food Supply Requirement Alert: {{station}} ({{expedition}})',
    body: `Food Supply Requirement Alert

Expedition:
{{expedition}}

Station:
{{station}}

Current Stock:
{{current_stock}}

Predicted Requirement:
{{predicted_requirement}}

Additional Requirement:
{{shortage}}

Please review the supply requirement.`,
    enabled: true,
    version: 1,
    variables_description: [
      'expedition',
      'station',
      'current_stock',
      'predicted_requirement',
      'shortage',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-INV-02',
    template_code: 'INVENTORY_SHORTAGE',
    template_name: 'General Inventory Stockout Risk',
    notification_type: 'INVENTORY_SHORTAGE',
    channel: 'ALL',
    subject: '⚠️ Inventory Depletion Alert: {{item_name}} at {{station}}',
    body: `INVENTORY DEPLETION WARNING

Station: {{station}}
Item: {{item_name}} (Code: {{item_code}})
Category: {{category}}
Current Stock: {{current_stock}} {{unit}}
Daily Depletion Rate: {{daily_depletion}} {{unit}}/day
Projected Stockout Window: {{stockout_days}} days
Safety Reserve Threshold: {{min_reserve}} {{unit}}

Action: Please initiate priority resupply requisition.`,
    enabled: true,
    version: 1,
    variables_description: [
      'station',
      'item_name',
      'item_code',
      'category',
      'current_stock',
      'unit',
      'daily_depletion',
      'stockout_days',
      'min_reserve',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-AST-01',
    template_code: 'ASSET_REQUIREMENT',
    template_name: 'Equipment Requirement Alert',
    notification_type: 'ASSET_REQUIREMENT',
    channel: 'ALL',
    subject: '⚙️ Equipment Requirement Alert: {{asset_type}} at {{station}}',
    body: `Equipment Requirement Alert

Expedition:
{{expedition}}

Station:
{{station}}

Equipment:
{{asset_type}}

Available:
{{available}}

Predicted Requirement:
{{predicted}}

Additional Requirement:
{{shortage}}

Please review the equipment supply requirement.`,
    enabled: true,
    version: 1,
    variables_description: [
      'expedition',
      'station',
      'asset_type',
      'available',
      'predicted',
      'shortage',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-SHP-01',
    template_code: 'SHIPMENT_DELAY',
    template_name: 'Shipment Schedule Delay Event',
    notification_type: 'SHIPMENT_DELAY',
    channel: 'ALL',
    subject: '🚢 Shipment Delay: {{shipment_id}} ({{vessel_name}})',
    body: `Shipment Delay

Shipment:
{{shipment_id}}

Vessel:
{{vessel_name}}

Origin:
{{origin}}

Destination:
{{destination}}

Previous ETA:
{{previous_eta}}

Updated ETA:
{{updated_eta}}

Reason:
{{reason}}`,
    enabled: true,
    version: 1,
    variables_description: [
      'shipment_id',
      'vessel_name',
      'origin',
      'destination',
      'previous_eta',
      'updated_eta',
      'reason',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-SHP-02',
    template_code: 'SHIPMENT_ARRIVAL',
    template_name: 'Shipment Port or Anchorage Arrival',
    notification_type: 'SHIPMENT_ARRIVAL',
    channel: 'ALL',
    subject: '⚓ Shipment Arrival: {{shipment_id}} at {{destination}}',
    body: `Shipment Arrival

Shipment: {{shipment_id}}
Vessel: {{vessel_name}}
Destination: {{destination}}
Arrival Time: {{arrival_time}}
Allocated Cargo Containers: {{containers_count}}
Cargo Status: Vessel anchored safely; ready for offload operations.`,
    enabled: true,
    version: 1,
    variables_description: [
      'shipment_id',
      'vessel_name',
      'destination',
      'arrival_time',
      'containers_count',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-SHP-03',
    template_code: 'SHIPMENT_EXCEPTION',
    template_name: 'Shipment Route or Cargo Exception',
    notification_type: 'SHIPMENT_EXCEPTION',
    channel: 'ALL',
    subject: '⚠️ Shipment Route Exception: {{shipment_id}}',
    body: `Shipment Exception Notice

Shipment: {{shipment_id}}
Vessel: {{vessel_name}}
Exception Type: {{exception_type}}
Location: {{location_coordinates}}
Incident Details: {{details}}
Corrective Directive: {{action_plan}}`,
    enabled: true,
    version: 1,
    variables_description: [
      'shipment_id',
      'vessel_name',
      'exception_type',
      'location_coordinates',
      'details',
      'action_plan',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-PSN-01',
    template_code: 'PERSONNEL_ALERT',
    template_name: 'Personnel Movement or Medical Clearance Alert',
    notification_type: 'PERSONNEL_ALERT',
    channel: 'ALL',
    subject: '👤 Personnel Operational Alert: {{personnel_name}}',
    body: `Personnel Operational Alert

Personnel: {{personnel_name}} (ID: {{personnel_id}})
Role: {{role}}
Station/Location: {{station_name}}
Event Type: {{event_type}}
Status/Remarks: {{remarks}}
Effective Date: {{effective_date}}`,
    enabled: true,
    version: 1,
    variables_description: [
      'personnel_name',
      'personnel_id',
      'role',
      'station_name',
      'event_type',
      'remarks',
      'effective_date',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-AST-02',
    template_code: 'MAINTENANCE_ALERT',
    template_name: 'Asset Preventative Maintenance Alert',
    notification_type: 'MAINTENANCE_ALERT',
    channel: 'ALL',
    subject: '🔧 Maintenance Scheduled: {{asset_name}} ({{asset_code}})',
    body: `Asset Maintenance Alert

Equipment: {{asset_name}} ({{asset_code}})
Station: {{station_name}}
Current Operating Hours: {{operating_hours}} hrs
Maintenance Schedule: {{maintenance_schedule}}
Criticality: {{criticality}}
Action: Perform scheduled filter and hydraulic fluid checks.`,
    enabled: true,
    version: 1,
    variables_description: [
      'asset_name',
      'asset_code',
      'station_name',
      'operating_hours',
      'maintenance_schedule',
      'criticality',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'TPL-SYS-01',
    template_code: 'SYSTEM_COMMUNICATION_FAILURE',
    template_name: 'System Communication Link Failure Alert',
    notification_type: 'SYSTEM_COMMUNICATION_FAILURE',
    channel: 'ALL',
    subject: '📡 System Alert: Satellite Link Degradation at {{station_name}}',
    body: `COMMUNICATION LINK ADVISORY

Station: {{station_name}}
Primary Link: {{primary_link}}
Degradation: Packet loss {{packet_loss}}%, Latency {{latency_ms}} ms
Fallback Active: Secondary Iridium SBD Gateway engaged.
Action: Non-essential bandwidth throttling in effect.`,
    enabled: true,
    version: 1,
    variables_description: [
      'station_name',
      'primary_link',
      'packet_loss',
      'latency_ms',
    ],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
];

// Initial Notification Channel Preferences (Section 21)
export const INITIAL_NOTIFICATION_PREFERENCES: NotificationPreferenceRecord[] = [
  // For Director & Central Ops
  { id: 'PREF-01', personnel_id: 'PER-HQ-01', personnel_name: 'Dr. M. Ravichandran', channel: 'IN_APP', notification_type: 'EMERGENCY', enabled: true, is_mandatory: true },
  { id: 'PREF-02', personnel_id: 'PER-HQ-01', personnel_name: 'Dr. M. Ravichandran', channel: 'EMAIL', notification_type: 'EMERGENCY', enabled: true, is_mandatory: true },
  { id: 'PREF-03', personnel_id: 'PER-HQ-01', personnel_name: 'Dr. M. Ravichandran', channel: 'SMS', notification_type: 'EMERGENCY', enabled: true, is_mandatory: true },
  { id: 'PREF-04', personnel_id: 'PER-HQ-01', personnel_name: 'Dr. M. Ravichandran', channel: 'IN_APP', notification_type: 'CRITICAL_WEATHER_EMERGENCY', enabled: true, is_mandatory: true },

  // For Food Logistics Officer
  { id: 'PREF-05', personnel_id: 'PER-HQ-03', personnel_name: 'Dr. Vandana Rao', channel: 'IN_APP', notification_type: 'FOOD_REQUIREMENT', enabled: true, is_mandatory: false },
  { id: 'PREF-06', personnel_id: 'PER-HQ-03', personnel_name: 'Dr. Vandana Rao', channel: 'EMAIL', notification_type: 'FOOD_REQUIREMENT', enabled: true, is_mandatory: false },
  { id: 'PREF-07', personnel_id: 'PER-HQ-03', personnel_name: 'Dr. Vandana Rao', channel: 'SMS', notification_type: 'FOOD_REQUIREMENT', enabled: true, is_mandatory: false },
  { id: 'PREF-08', personnel_id: 'PER-HQ-03', personnel_name: 'Dr. Vandana Rao', channel: 'IN_APP', notification_type: 'INVENTORY_SHORTAGE', enabled: true, is_mandatory: false },
  { id: 'PREF-09', personnel_id: 'PER-HQ-03', personnel_name: 'Dr. Vandana Rao', channel: 'EMAIL', notification_type: 'INVENTORY_SHORTAGE', enabled: true, is_mandatory: false },

  // For Asset Logistics Officer
  { id: 'PREF-10', personnel_id: 'PER-HQ-04', personnel_name: 'Er. Amitav Sen', channel: 'IN_APP', notification_type: 'ASSET_REQUIREMENT', enabled: true, is_mandatory: false },
  { id: 'PREF-11', personnel_id: 'PER-HQ-04', personnel_name: 'Er. Amitav Sen', channel: 'EMAIL', notification_type: 'ASSET_REQUIREMENT', enabled: true, is_mandatory: false },
  { id: 'PREF-12', personnel_id: 'PER-HQ-04', personnel_name: 'Er. Amitav Sen', channel: 'SMS', notification_type: 'ASSET_REQUIREMENT', enabled: true, is_mandatory: false },

  // For Station Commanders
  { id: 'PREF-13', personnel_id: 'PER-BH-01', personnel_name: 'Dr. Arunav Roy', channel: 'IN_APP', notification_type: 'EMERGENCY', enabled: true, is_mandatory: true },
  { id: 'PREF-14', personnel_id: 'PER-BH-01', personnel_name: 'Dr. Arunav Roy', channel: 'SMS', notification_type: 'EMERGENCY', enabled: true, is_mandatory: true },
  { id: 'PREF-15', personnel_id: 'PER-BH-01', personnel_name: 'Dr. Arunav Roy', channel: 'IN_APP', notification_type: 'CRITICAL_WEATHER_EMERGENCY', enabled: true, is_mandatory: true },
  { id: 'PREF-16', personnel_id: 'PER-BH-01', personnel_name: 'Dr. Arunav Roy', channel: 'SMS', notification_type: 'CRITICAL_WEATHER_EMERGENCY', enabled: true, is_mandatory: true },
];

// Seed Historical & Active Notifications (Sections 15, 25, 28)
export const INITIAL_NOTIFICATIONS_STORE: NotificationRecord[] = [
  {
    id: 'NTF-2026-0001',
    notification_code: 'NTF-2026-0001',
    source_module: 'EMERGENCY',
    source_event_id: 'EMG-2026-0012',
    notification_type: 'EMERGENCY',
    priority: 'CRITICAL',
    title: '🔴 CRITICAL EMERGENCY: Medical Evacuation at Bharati Station',
    message: `CRITICAL EMERGENCY ALERT\n\nIncident Code: EMG-2026-0012\nStation/Location: Bharati Station (Larsemann Hills)\nEmergency Type: MEDICAL\nSeverity: CRITICAL\nReported By: Dr. Rajesh Sharma\nDetected At: 2026-09-12 01:10 UTC\n\nSituation Report:\nSevere hypothermia and compound fracture during ridge sampling survey.\n\nAssigned Response Team: Bharati Station Medical Response Team\nOperational Directive: Follow approved medical evacuation procedures.`,
    status: 'DELIVERED',
    created_at: '2026-09-12T01:10:00.000Z',
    sent_at: '2026-09-12T01:10:02.000Z',
    delivered_at: '2026-09-12T01:10:05.000Z',
    read_at: '2026-09-12T01:11:00.000Z',
    expires_at: null,
    acknowledged_at: null, // Awaiting ACK!
    acknowledged_by: null,
    requires_acknowledgement: true,
    station_id: 'bharati',
    vessel_id: null,
    expedition_id: 'EXP-45-IND',
    metadata: {
      emergency_code: 'EMG-2026-0012',
      casualty_count: 1,
    },
    recipients: [
      {
        id: 'REC-001-01',
        notification_id: 'NTF-2026-0001',
        recipient_id: 'PER-BH-02',
        recipient_name: 'Dr. Priya Nair',
        recipient_email: 'medical.bharati@ncpor.gov.in',
        recipient_phone: '+8816-7770-1002',
        recipient_role: 'Chief Medical Officer',
        recipient_type: 'EMERGENCY_RESPONSE_TEAM',
        delivery_status: 'DELIVERED',
        channels: ['IN_APP', 'SMS', 'EMAIL'],
        sent_at: '2026-09-12T01:10:02.000Z',
        delivered_at: '2026-09-12T01:10:05.000Z',
        read_at: '2026-09-12T01:11:00.000Z',
        acknowledged_at: null,
        failure_reason: null,
      },
      {
        id: 'REC-001-02',
        notification_id: 'NTF-2026-0001',
        recipient_id: 'PER-BH-01',
        recipient_name: 'Dr. Arunav Roy',
        recipient_email: 'commander.bharati@ncpor.gov.in',
        recipient_phone: '+8816-7770-1001',
        recipient_role: 'Station Commander',
        recipient_type: 'STATION_PERSONNEL',
        delivery_status: 'DELIVERED',
        channels: ['IN_APP', 'SMS', 'EMAIL'],
        sent_at: '2026-09-12T01:10:02.000Z',
        delivered_at: '2026-09-12T01:10:06.000Z',
        read_at: null,
        acknowledged_at: null,
        failure_reason: null,
      },
      {
        id: 'REC-001-03',
        notification_id: 'NTF-2026-0001',
        recipient_id: 'PER-HQ-01',
        recipient_name: 'Dr. M. Ravichandran',
        recipient_email: 'director@ncpor.gov.in',
        recipient_phone: '+91-832-2525500',
        recipient_role: 'NCPOR Director',
        recipient_type: 'CENTRAL_OPERATIONS',
        delivery_status: 'DELIVERED',
        channels: ['IN_APP', 'EMAIL'],
        sent_at: '2026-09-12T01:10:02.000Z',
        delivered_at: '2026-09-12T01:10:08.000Z',
        read_at: null,
        acknowledged_at: null,
        failure_reason: null,
      },
    ],
    attempts: [
      {
        id: 'ATT-001-01',
        notification_id: 'NTF-2026-0001',
        recipient_id: 'PER-BH-02',
        channel: 'IN_APP',
        attempt_number: 1,
        attempted_at: '2026-09-12T01:10:02.000Z',
        status: 'SUCCESS',
        provider_name: 'PolarisInAppProvider',
        provider_response: 'Delivered to active WebSocket/SSE session',
        failure_reason: null,
      },
      {
        id: 'ATT-001-02',
        notification_id: 'NTF-2026-0001',
        recipient_id: 'PER-BH-02',
        channel: 'SMS',
        attempt_number: 1,
        attempted_at: '2026-09-12T01:10:03.000Z',
        status: 'SUCCESS',
        provider_name: 'IridiumSatelliteSMSGateway',
        provider_response: 'SBD Packet ID: IRID-8816-7770-ACK',
        failure_reason: null,
      },
      {
        id: 'ATT-001-03',
        notification_id: 'NTF-2026-0001',
        recipient_id: 'PER-BH-02',
        channel: 'EMAIL',
        attempt_number: 1,
        attempted_at: '2026-09-12T01:10:04.000Z',
        status: 'SUCCESS',
        provider_name: 'NCPOR-IridiumEmailGateway',
        provider_response: '250 2.0.0 Message queued for polar relay',
        failure_reason: null,
      },
    ],
  },
  {
    id: 'NTF-2026-0002',
    notification_code: 'NTF-2026-0002',
    source_module: 'WEATHER',
    source_event_id: 'EVT-WX-001',
    notification_type: 'CRITICAL_WEATHER_EMERGENCY',
    priority: 'CRITICAL',
    title: '🔴 Severe Katabatic Gale Warning at Maitri Station',
    message: `CRITICAL WEATHER ALERT\n\nStation: Maitri Station (Schirmacher Oasis)\nCondition: Katabatic Gale\nSeverity: CRITICAL\nDetected At: 2026-09-12 00:45 UTC\nWind Speed: 84.5 km/h | Gusts: 112.0 km/h | Temperature: -28.4°C\n\nFollow the organization's approved emergency procedure. Exterior movement is frozen immediately.`,
    status: 'ACKNOWLEDGED',
    created_at: '2026-09-12T00:45:00.000Z',
    sent_at: '2026-09-12T00:45:03.000Z',
    delivered_at: '2026-09-12T00:45:07.000Z',
    read_at: '2026-09-12T00:46:12.000Z',
    expires_at: null,
    acknowledged_at: '2026-09-12T00:48:30.000Z',
    acknowledged_by: 'Dr. Sunita Kulkarni (Maitri Commander)',
    requires_acknowledgement: true,
    station_id: 'maitri',
    vessel_id: null,
    expedition_id: 'EXP-45-IND',
    metadata: {
      event_type: 'Katabatic Gale',
      max_gust_kmh: 112,
    },
    recipients: [
      {
        id: 'REC-002-01',
        notification_id: 'NTF-2026-0002',
        recipient_id: 'PER-MT-01',
        recipient_name: 'Dr. Sunita Kulkarni',
        recipient_email: 'commander.maitri@ncpor.gov.in',
        recipient_phone: '+8816-7770-2001',
        recipient_role: 'Station Commander',
        recipient_type: 'STATION_PERSONNEL',
        delivery_status: 'ACKNOWLEDGED',
        channels: ['IN_APP', 'SMS', 'EMAIL'],
        sent_at: '2026-09-12T00:45:03.000Z',
        delivered_at: '2026-09-12T00:45:07.000Z',
        read_at: '2026-09-12T00:46:12.000Z',
        acknowledged_at: '2026-09-12T00:48:30.000Z',
        failure_reason: null,
      },
    ],
    attempts: [
      {
        id: 'ATT-002-01',
        notification_id: 'NTF-2026-0002',
        recipient_id: 'PER-MT-01',
        channel: 'SMS',
        attempt_number: 1,
        attempted_at: '2026-09-12T00:45:03.000Z',
        status: 'SUCCESS',
        provider_name: 'IridiumSatelliteSMSGateway',
        provider_response: 'SBD Packet ID: IRID-8816-2001-ACK',
        failure_reason: null,
      },
      {
        id: 'ATT-002-02',
        notification_id: 'NTF-2026-0002',
        recipient_id: 'PER-MT-01',
        channel: 'IN_APP',
        attempt_number: 1,
        attempted_at: '2026-09-12T00:45:03.000Z',
        status: 'SUCCESS',
        provider_name: 'PolarisInAppProvider',
        provider_response: 'Delivered to active station terminal',
        failure_reason: null,
      },
    ],
  },
  {
    id: 'NTF-2026-0003',
    notification_code: 'NTF-2026-0003',
    source_module: 'INVENTORY',
    source_event_id: 'INV-ALERT-001',
    notification_type: 'FOOD_REQUIREMENT',
    priority: 'HIGH',
    title: '🟠 Food Supply Requirement Alert: Bharati Station',
    message: `Food Supply Requirement Alert\n\nExpedition: 45th Indian Antarctic Expedition\nStation: Bharati Station\nCurrent Stock: 4,200 kg\nPredicted Requirement: 9,800 kg (Winter-Over Target)\nAdditional Requirement: 5,600 kg\n\nPlease review the supply requirement.`,
    status: 'DELIVERED',
    created_at: '2026-09-11T14:30:00.000Z',
    sent_at: '2026-09-11T14:30:05.000Z',
    delivered_at: '2026-09-11T14:30:10.000Z',
    read_at: '2026-09-11T15:05:22.000Z',
    expires_at: null,
    acknowledged_at: null,
    acknowledged_by: null,
    requires_acknowledgement: false,
    station_id: 'bharati',
    vessel_id: null,
    expedition_id: 'EXP-45-IND',
    metadata: {
      category: 'Food Provisions',
      shortage_kg: 5600,
    },
    recipients: [
      {
        id: 'REC-003-01',
        notification_id: 'NTF-2026-0003',
        recipient_id: 'PER-HQ-03',
        recipient_name: 'Dr. Vandana Rao',
        recipient_email: 'vandana.rao@ncpor.gov.in',
        recipient_phone: '+91-832-2525532',
        recipient_role: 'Food & Consumables Officer',
        recipient_type: 'FOOD_LOGISTICS_OFFICER',
        delivery_status: 'DELIVERED',
        channels: ['EMAIL', 'IN_APP'],
        sent_at: '2026-09-11T14:30:05.000Z',
        delivered_at: '2026-09-11T14:30:10.000Z',
        read_at: '2026-09-11T15:05:22.000Z',
        acknowledged_at: null,
        failure_reason: null,
      },
    ],
    attempts: [
      {
        id: 'ATT-003-01',
        notification_id: 'NTF-2026-0003',
        recipient_id: 'PER-HQ-03',
        channel: 'EMAIL',
        attempt_number: 1,
        attempted_at: '2026-09-11T14:30:05.000Z',
        status: 'SUCCESS',
        provider_name: 'NCPOR-IridiumEmailGateway',
        provider_response: '250 2.0.0 Message delivered to vandana.rao@ncpor.gov.in',
        failure_reason: null,
      },
      {
        id: 'ATT-003-02',
        notification_id: 'NTF-2026-0003',
        recipient_id: 'PER-HQ-03',
        channel: 'IN_APP',
        attempt_number: 1,
        attempted_at: '2026-09-11T14:30:05.000Z',
        status: 'SUCCESS',
        provider_name: 'PolarisInAppProvider',
        provider_response: 'Stored in In-App notification center',
        failure_reason: null,
      },
    ],
  },
  {
    id: 'NTF-2026-0004',
    notification_code: 'NTF-2026-0004',
    source_module: 'ASSET',
    source_event_id: 'AST-ALERT-002',
    notification_type: 'ASSET_REQUIREMENT',
    priority: 'HIGH',
    title: '🟠 Equipment Requirement Alert: Power Generators at Bharati',
    message: `Equipment Requirement Alert\n\nExpedition: 45th Indian Antarctic Expedition\nStation: Bharati Station\nEquipment: Diesel Generator (250 kVA)\nAvailable: 5\nPredicted Requirement: 8\nAdditional Requirement: 3\n\nPlease review the equipment supply requirement.`,
    status: 'DELIVERED',
    created_at: '2026-09-11T11:20:00.000Z',
    sent_at: '2026-09-11T11:20:04.000Z',
    delivered_at: '2026-09-11T11:20:09.000Z',
    read_at: '2026-09-11T12:00:15.000Z',
    expires_at: null,
    acknowledged_at: null,
    acknowledged_by: null,
    requires_acknowledgement: false,
    station_id: 'bharati',
    vessel_id: null,
    expedition_id: 'EXP-45-IND',
    metadata: {
      equipment_type: 'Diesel Generator',
      deficit: 3,
    },
    recipients: [
      {
        id: 'REC-004-01',
        notification_id: 'NTF-2026-0004',
        recipient_id: 'PER-HQ-04',
        recipient_name: 'Er. Amitav Sen',
        recipient_email: 'amitav.sen@ncpor.gov.in',
        recipient_phone: '+91-832-2525544',
        recipient_role: 'Polar Equipment Specialist',
        recipient_type: 'ASSET_LOGISTICS_OFFICER',
        delivery_status: 'DELIVERED',
        channels: ['EMAIL', 'IN_APP'],
        sent_at: '2026-09-11T11:20:04.000Z',
        delivered_at: '2026-09-11T11:20:09.000Z',
        read_at: '2026-09-11T12:00:15.000Z',
        acknowledged_at: null,
        failure_reason: null,
      },
    ],
    attempts: [
      {
        id: 'ATT-004-01',
        notification_id: 'NTF-2026-0004',
        recipient_id: 'PER-HQ-04',
        channel: 'EMAIL',
        attempt_number: 1,
        attempted_at: '2026-09-11T11:20:04.000Z',
        status: 'SUCCESS',
        provider_name: 'NCPOR-IridiumEmailGateway',
        provider_response: '250 2.0.0 Message delivered to amitav.sen@ncpor.gov.in',
        failure_reason: null,
      },
    ],
  },
  {
    id: 'NTF-2026-0005',
    notification_code: 'NTF-2026-0005',
    source_module: 'SHIPMENT',
    source_event_id: 'SHP-002-DELAY',
    notification_type: 'SHIPMENT_DELAY',
    priority: 'HIGH',
    title: '🟡 Shipment Delay: SHP-2026-002 (MV Vasiliy Golovnin)',
    message: `Shipment Delay\n\nShipment: SHP-2026-002\nVessel: MV Vasiliy Golovnin\nOrigin: Mormugao Port, Goa\nDestination: Bharati Station Anchorage\nPrevious ETA: 2026-03-24 08:00 UTC\nUpdated ETA: 2026-03-27 18:00 UTC\nReason: Multi-year pack ice concentration in Prydz Bay requiring slow icebreaker maneuvering.`,
    status: 'READ',
    created_at: '2026-09-10T09:15:00.000Z',
    sent_at: '2026-09-10T09:15:02.000Z',
    delivered_at: '2026-09-10T09:15:05.000Z',
    read_at: '2026-09-10T09:30:40.000Z',
    expires_at: null,
    acknowledged_at: null,
    acknowledged_by: null,
    requires_acknowledgement: false,
    station_id: 'bharati',
    vessel_id: 'VESSEL-01',
    expedition_id: 'EXP-45-IND',
    metadata: {
      vessel_id: 'VESSEL-01',
      delay_hours: 82,
    },
    recipients: [
      {
        id: 'REC-005-01',
        notification_id: 'NTF-2026-0005',
        recipient_id: 'PER-HQ-05',
        recipient_name: 'Capt. R. Deshmukh',
        recipient_email: 'r.deshmukh@mormugaoport.gov.in',
        recipient_phone: '+91-832-2521122',
        recipient_role: 'Marine Logistics Officer',
        recipient_type: 'LOGISTICS_OFFICER',
        delivery_status: 'READ',
        channels: ['EMAIL', 'IN_APP'],
        sent_at: '2026-09-10T09:15:02.000Z',
        delivered_at: '2026-09-10T09:15:05.000Z',
        read_at: '2026-09-10T09:30:40.000Z',
        acknowledged_at: null,
        failure_reason: null,
      },
    ],
    attempts: [
      {
        id: 'ATT-005-01',
        notification_id: 'NTF-2026-0005',
        recipient_id: 'PER-HQ-05',
        channel: 'EMAIL',
        attempt_number: 1,
        attempted_at: '2026-09-10T09:15:02.000Z',
        status: 'SUCCESS',
        provider_name: 'NCPOR-IridiumEmailGateway',
        provider_response: '250 2.0.0 Message relayed successfully',
        failure_reason: null,
      },
    ],
  },
];
