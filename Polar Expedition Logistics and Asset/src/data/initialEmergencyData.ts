import { 
  ResponseTeam, 
  EmergencyRecord, 
  EmergencyType, 
  EmergencySeverity, 
  EmergencyNotificationRecord,
  EmergencyActionRecord,
  EmergencyEscalationRecord
} from '../types.ts';

/**
 * PREDEFINED EMERGENCY RESPONSE TEAMS
 * Stored in database per station/vessel with availability status and contact info.
 */
export const INITIAL_RESPONSE_TEAMS: ResponseTeam[] = [
  // BHARATI STATION TEAMS
  {
    id: 'RT-BHR-MED',
    name: 'Bharati Medical Response Team',
    station_id: 'bharati',
    vessel_id: null,
    team_type: 'MEDICAL',
    members: [
      { id: 'PRS-02', name: 'Dr. Ananya Sharma', role: 'Chief Medical Officer / Lead', contact: 'VHF Ch 16 / Sat Ext 104' },
      { id: 'PRS-06', name: 'Dr. R. Kulkarni', role: 'Emergency Anaesthetist & Paramedic', contact: 'VHF Ch 16 / MedBay B' },
    ],
    contact_info: 'VHF Ch 16 (Emergency Medical) / Iridium +8816 3144 2001',
    availability_status: 'AVAILABLE',
    active: true,
    backup_team_id: 'RT-BHR-SAF',
  },
  {
    id: 'RT-BHR-SAF',
    name: 'Bharati Polar Safety & Fire Response',
    station_id: 'bharati',
    vessel_id: null,
    team_type: 'FIRE_SAFETY',
    members: [
      { id: 'PRS-07', name: 'Rajesh Nair', role: 'Station Safety Officer / Fire Chief', contact: 'VHF Ch 14 / Safety Bay' },
      { id: 'PRS-08', name: 'Vikas Deshmukh', role: 'SCBA Breathing Apparatus Specialist', contact: 'VHF Ch 14' },
    ],
    contact_info: 'VHF Ch 14 (Station Fire Ops) / Station Siren Alarm 1',
    availability_status: 'AVAILABLE',
    active: true,
    backup_team_id: 'RT-BHR-OPS',
  },
  {
    id: 'RT-BHR-TECH',
    name: 'Bharati Engineering & Power Team',
    station_id: 'bharati',
    vessel_id: null,
    team_type: 'TECHNICAL',
    members: [
      { id: 'PRS-03', name: 'Er. Tenzing Norbu', role: 'Chief Energy & Mechanical Engineer', contact: 'VHF Ch 12 / Power Block' },
      { id: 'PRS-09', name: 'S. Bhattacharya', role: 'Diesel Genset & Automation Engineer', contact: 'VHF Ch 12' },
    ],
    contact_info: 'VHF Ch 12 (Engineering) / Power House Ext 102',
    availability_status: 'AVAILABLE',
    active: true,
    backup_team_id: 'RT-BHR-OPS',
  },
  {
    id: 'RT-BHR-SAR',
    name: 'Bharati Polar Search & Rescue (SAR)',
    station_id: 'bharati',
    vessel_id: null,
    team_type: 'SEARCH_AND_RESCUE',
    members: [
      { id: 'PRS-10', name: 'Subedar M. Thapa', role: 'Mountain & Crevasse Rescue Specialist', contact: 'VHF Ch 16 / Snowcat 1' },
      { id: 'PRS-11', name: 'Vikram Singh', role: 'Polar Vehicle Operator & Field Navigator', contact: 'VHF Ch 16' },
    ],
    contact_info: 'VHF Ch 16 (Polar Emergency) / PistenBully SAR Ext 201',
    availability_status: 'AVAILABLE',
    active: true,
    backup_team_id: 'RT-BHR-SAF',
  },
  {
    id: 'RT-BHR-OPS',
    name: 'Bharati Station Operations Command',
    station_id: 'bharati',
    vessel_id: null,
    team_type: 'OPERATIONS',
    members: [
      { id: 'PRS-12', name: 'Dr. K. Swaminathan', role: 'Station Commander', contact: 'Command Room Ext 101' },
      { id: 'PRS-13', name: 'A. Joseph', role: 'Radio Communications Officer', contact: 'Comms Room' },
    ],
    contact_info: 'VHF Ch 16 & 06 (Station Command) / SatPhone Ext 100',
    availability_status: 'AVAILABLE',
    active: true,
    backup_team_id: null,
  },

  // MAITRI STATION TEAMS
  {
    id: 'RT-MTR-MED',
    name: 'Maitri Medical Response Team',
    station_id: 'maitri',
    vessel_id: null,
    team_type: 'MEDICAL',
    members: [
      { id: 'PRS-14', name: 'Dr. Neha Verma', role: 'Station Medical Officer', contact: 'VHF Ch 16 / MedBay Maitri' },
    ],
    contact_info: 'VHF Ch 16 / Maitri SatPhone +8816 3144 2020',
    availability_status: 'AVAILABLE',
    active: true,
    backup_team_id: 'RT-MTR-OPS',
  },
  {
    id: 'RT-MTR-SAF',
    name: 'Maitri Emergency & Fire Team',
    station_id: 'maitri',
    vessel_id: null,
    team_type: 'FIRE_SAFETY',
    members: [
      { id: 'PRS-15', name: 'Cdr. H. S. Rawat', role: 'Maitri Safety & Maintenance Lead', contact: 'VHF Ch 14' },
    ],
    contact_info: 'VHF Ch 14 / Safety Module',
    availability_status: 'AVAILABLE',
    active: true,
    backup_team_id: 'RT-MTR-OPS',
  },
  {
    id: 'RT-MTR-OPS',
    name: 'Maitri Station Operations Command',
    station_id: 'maitri',
    vessel_id: null,
    team_type: 'OPERATIONS',
    members: [
      { id: 'PRS-16', name: 'Dr. Pradeep Joshi', role: 'Station Commander', contact: 'Maitri Command Room' },
    ],
    contact_info: 'VHF Ch 16 / Comms Room Maitri',
    availability_status: 'AVAILABLE',
    active: true,
    backup_team_id: null,
  },

  // HIMADRI STATION (ARCTIC) TEAMS
  {
    id: 'RT-HMD-SAR',
    name: 'Himadri Arctic Field Safety & Wildlife Team',
    station_id: 'himadri',
    vessel_id: null,
    team_type: 'SEARCH_AND_RESCUE',
    members: [
      { id: 'PRS-17', name: 'Dr. Sunita Rao', role: 'Arctic Expedition Safety Leader', contact: 'Ny-Ålesund Radio' },
    ],
    contact_info: 'VHF Ch 16 (Ny-Ålesund Kings Bay Polar Alert)',
    availability_status: 'AVAILABLE',
    active: true,
    backup_team_id: null,
  },

  // EXPEDITION VESSEL TEAMS
  {
    id: 'RT-VG-MAR',
    name: 'MV Vasiliy Golovnin Maritime Safety Unit',
    station_id: null,
    vessel_id: 'vessel_golovnin',
    team_type: 'OPERATIONS',
    members: [
      { id: 'PRS-04', name: 'Capt. Suresh Menon', role: 'Polar Logistics Convoy Master', contact: 'Bridge Sat Ch 16' },
      { id: 'PRS-18', name: 'Chief Mate Igor Morozov', role: 'Deck Safety Officer', contact: 'Bridge Ch 16' },
    ],
    contact_info: 'INMARSAT-C Bridge 422001923 / VHF Ch 16',
    availability_status: 'AVAILABLE',
    active: true,
    backup_team_id: null,
  },
];

/**
 * ROUTING CONFIGURATION: Emergency Type -> Preferred Response Team Type
 */
export const EMERGENCY_ROUTING_MAP: Record<EmergencyType, { teamType: ResponseTeam['team_type']; defaultSeverity: EmergencySeverity }> = {
  MEDICAL: { teamType: 'MEDICAL', defaultSeverity: 'CRITICAL' },
  FIRE: { teamType: 'FIRE_SAFETY', defaultSeverity: 'CRITICAL' },
  VEHICLE_ACCIDENT: { teamType: 'SEARCH_AND_RESCUE', defaultSeverity: 'HIGH' },
  EQUIPMENT_FAILURE: { teamType: 'TECHNICAL', defaultSeverity: 'HIGH' },
  WEATHER: { teamType: 'OPERATIONS', defaultSeverity: 'CRITICAL' },
  MISSING_PERSON: { teamType: 'SEARCH_AND_RESCUE', defaultSeverity: 'CRITICAL' },
  SAFETY: { teamType: 'FIRE_SAFETY', defaultSeverity: 'HIGH' },
  COMMUNICATION: { teamType: 'TECHNICAL', defaultSeverity: 'MEDIUM' },
  OTHER: { teamType: 'OPERATIONS', defaultSeverity: 'MEDIUM' },
};

/**
 * CONFIGURABLE ESCALATION TIMINGS (Minutes)
 */
export const ESCALATION_CONFIG = {
  level1ToLevel2Minutes: 2, // If unacknowledged within 2 minutes -> Escalate to Station Commander
  level2ToLevel3Minutes: 5, // If still unacknowledged within 5 minutes -> Escalate to NCPOR Goa Central Command
};

/**
 * PREDEFINED SECURE NOTIFICATION TEMPLATES (Strictly Non-LLM)
 */
export function formatEmergencyNotificationMessage(params: {
  emergencyCode: string;
  emergencyType: EmergencyType;
  severity: EmergencySeverity;
  location: string;
  reportedBy: string;
  timestamp: string;
  description: string;
  source: 'PERSONNEL' | 'WEATHER' | 'SYSTEM';
}): string {
  if (params.source === 'WEATHER') {
    return `CRITICAL WEATHER EMERGENCY
Emergency ID: ${params.emergencyCode}
Type: Weather Hazard Alert
Location: ${params.location}
Severity: ${params.severity}
Detected: ${params.timestamp}
Details: ${params.description}
SOP DIRECTIVE: Perimeter lockdown activated. Stand by for Station Commander instructions. Follow the organization's approved emergency procedure.`;
  }

  return `CRITICAL EMERGENCY ALERT
Emergency ID: ${params.emergencyCode}
Type: ${params.emergencyType.replace(/_/g, ' ')} Emergency
Severity: ${params.severity}
Location: ${params.location}
Reported By: ${params.reportedBy}
Time: ${params.timestamp}
Situation: ${params.description}
ACTION REQUIRED: Please respond and acknowledge immediately according to station emergency procedure.`;
}

/**
 * SEEDED INITIAL EMERGENCIES (Realistic live Antarctic scenario)
 */
export const INITIAL_EMERGENCY_RECORDS: EmergencyRecord[] = [
  {
    id: 'EMG-2026-0012',
    emergency_code: 'EMG-2026-0012',
    expedition_id: 'ISEA-44',
    source: 'PERSONNEL',
    emergency_type: 'MEDICAL',
    severity: 'CRITICAL',
    status: 'RESPONSE_IN_PROGRESS',
    reported_by: 'Arun Kumar (Senior Field Geologist)',
    affected_personnel_id: 'PRS-05',
    affected_personnel_name: 'Arun Kumar',
    station_id: 'bharati',
    vessel_id: null,
    shipment_id: null,
    asset_id: null,
    location: 'Bharati Station (Habitation Pod 3)',
    latitude: -69.4075,
    longitude: 76.1872,
    description: 'Acute lower limb trauma and frostbite sustained during severe wind gust while returning from coastal telemetry array.',
    detected_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    acknowledged_at: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    acknowledged_by: 'Dr. Ananya Sharma',
    response_started_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    resolved_at: null,
    resolved_by: null,
    resolution_summary: null,
    cancelled_at: null,
    cancelled_by: null,
    cancellation_reason: null,
    escalation_level: 1,
    response_team_id: 'RT-BHR-MED',
    response_team_name: 'Bharati Medical Response Team',
    actions: [
      {
        id: 'ACT-001',
        emergency_id: 'EMG-2026-0012',
        action_type: 'DISPATCH',
        description: 'Bharati Medical Response Team alerted via VHF Ch 16 and in-app siren. Stretcher team dispatched.',
        performed_by: 'Station Comms Officer',
        created_at: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      },
      {
        id: 'ACT-002',
        emergency_id: 'EMG-2026-0012',
        action_type: 'ON_SCENE',
        description: 'Medical team arrived at Pod 3. Arun stabilized with splint and thermal re-warming blanket.',
        performed_by: 'Dr. Ananya Sharma',
        created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
      {
        id: 'ACT-003',
        emergency_id: 'EMG-2026-0012',
        action_type: 'TREATMENT',
        description: 'Transferred to Medical Bay B. Telemedicine link established with AIIMS New Delhi for orthopedic consultation.',
        performed_by: 'Dr. R. Kulkarni',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ],
    notifications: [
      {
        id: 'NOTIF-001',
        emergency_id: 'EMG-2026-0012',
        recipient_id: 'PRS-02',
        recipient_name: 'Dr. Ananya Sharma',
        recipient_role: 'Chief Medical Officer',
        recipient_contact: 'dr.ananya@ncpor.gov.in / VHF Ch 16',
        channel: 'IN_APP',
        status: 'ACKNOWLEDGED',
        message: 'CRITICAL EMERGENCY EMG-2026-0012: Medical trauma reported at Bharati Station for Arun Kumar.',
        sent_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        delivered_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        acknowledged_at: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
        failure_reason: null,
        retry_count: 0,
      },
      {
        id: 'NOTIF-002',
        emergency_id: 'EMG-2026-0012',
        recipient_id: 'PRS-12',
        recipient_name: 'Dr. K. Swaminathan',
        recipient_role: 'Station Commander',
        recipient_contact: '+91 94230 55001 / commander@ncpor.gov.in',
        channel: 'SMS',
        status: 'DELIVERED',
        message: 'CRITICAL EMERGENCY EMG-2026-0012: Medical response in progress at Bharati Station.',
        sent_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        delivered_at: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
        acknowledged_at: null,
        failure_reason: null,
        retry_count: 0,
      },
    ],
  },
  {
    id: 'EMG-2026-0013',
    emergency_code: 'EMG-2026-0013',
    expedition_id: 'ISEA-44',
    source: 'WEATHER',
    emergency_type: 'WEATHER',
    severity: 'CRITICAL',
    status: 'ALERTING',
    reported_by: 'Weather Rule Engine (Automated Polar Safety)',
    affected_personnel_id: null,
    affected_personnel_name: null,
    station_id: 'maitri',
    vessel_id: null,
    shipment_id: null,
    asset_id: null,
    location: 'Maitri Station (Schirmacher Oasis)',
    latitude: -70.7667,
    longitude: 11.7333,
    description: 'Catabatic storm gale detected with sustained wind speeds exceeding 84 km/h and wind chill factor -52°C.',
    detected_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    acknowledged_at: null,
    acknowledged_by: null,
    response_started_at: null,
    resolved_at: null,
    resolved_by: null,
    resolution_summary: null,
    cancelled_at: null,
    cancelled_by: null,
    cancellation_reason: null,
    escalation_level: 1,
    response_team_id: 'RT-MTR-OPS',
    response_team_name: 'Maitri Station Operations Command',
    actions: [
      {
        id: 'ACT-004',
        emergency_id: 'EMG-2026-0013',
        action_type: 'DISPATCH',
        description: 'Automated SOP-POL-04 outdoor transit ban broadcast to all Maitri handheld radios.',
        performed_by: 'Automated Polar Safety Engine',
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
    ],
    notifications: [
      {
        id: 'NOTIF-003',
        emergency_id: 'EMG-2026-0013',
        recipient_id: 'PRS-16',
        recipient_name: 'Dr. Pradeep Joshi',
        recipient_role: 'Station Commander',
        recipient_contact: 'commander.maitri@ncpor.gov.in / VHF Ch 16',
        channel: 'IN_APP',
        status: 'DELIVERED',
        message: 'CRITICAL WEATHER EMERGENCY EMG-2026-0013 at Maitri Station. Catabatic winds >84 km/h.',
        sent_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        delivered_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        acknowledged_at: null,
        failure_reason: null,
        retry_count: 0,
      },
    ],
  },
  {
    id: 'EMG-2026-0010',
    emergency_code: 'EMG-2026-0010',
    expedition_id: 'ISEA-44',
    source: 'SYSTEM',
    emergency_type: 'EQUIPMENT_FAILURE',
    severity: 'HIGH',
    status: 'RESOLVED',
    reported_by: 'Asset Health Telemetry System',
    affected_personnel_id: null,
    affected_personnel_name: null,
    station_id: 'bharati',
    vessel_id: null,
    shipment_id: null,
    asset_id: 'AST-BHR-GEN-02',
    location: 'Bharati Station (Auxiliary Power House)',
    latitude: -69.4075,
    longitude: 76.1872,
    description: 'Secondary Generator coolant pressure loss causing rapid cylinder head overheat (>98°C).',
    detected_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    acknowledged_at: new Date(Date.now() - 178 * 60 * 1000).toISOString(),
    acknowledged_by: 'Er. Tenzing Norbu',
    response_started_at: new Date(Date.now() - 175 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    resolved_by: 'Er. Tenzing Norbu',
    resolution_summary: 'Coolant hose clamp re-torqued and synthetic polar glycol topped up. Load transfer tested successfully at 100% rated output.',
    cancelled_at: null,
    cancelled_by: null,
    cancellation_reason: null,
    escalation_level: 1,
    response_team_id: 'RT-BHR-TECH',
    response_team_name: 'Bharati Engineering & Power Team',
    actions: [
      {
        id: 'ACT-005',
        emergency_id: 'EMG-2026-0010',
        action_type: 'ON_SCENE',
        description: 'Engineering team switched station load to Primary Genset 01.',
        performed_by: 'Er. Tenzing Norbu',
        created_at: new Date(Date.now() - 175 * 60 * 1000).toISOString(),
      },
      {
        id: 'ACT-006',
        emergency_id: 'EMG-2026-0010',
        action_type: 'CONTAINMENT',
        description: 'Coolant leak isolated. Replacement Arctic seal fitted.',
        performed_by: 'S. Bhattacharya',
        created_at: new Date(Date.now() - 145 * 60 * 1000).toISOString(),
      },
    ],
    notifications: [],
  },
];
