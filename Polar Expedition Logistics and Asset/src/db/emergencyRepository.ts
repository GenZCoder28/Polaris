import fs from 'fs';
import path from 'path';
import { 
  EmergencyRecord, 
  ResponseTeam, 
  EmergencyActionRecord, 
  EmergencyNotificationRecord, 
  EmergencyEscalationRecord, 
  EmergencyAuditLogRecord,
  EmergencyStats,
  EmergencyType,
  EmergencySeverity,
  EmergencyStatus,
  ResponseTeamAvailability,
  StationId
} from '../types.ts';
import { 
  INITIAL_RESPONSE_TEAMS, 
  INITIAL_EMERGENCY_RECORDS, 
  EMERGENCY_ROUTING_MAP, 
  ESCALATION_CONFIG,
  formatEmergencyNotificationMessage
} from '../data/initialEmergencyData.ts';
import { ensureOperationsStore } from './repository.ts';
import { communicationRepository } from './communicationRepository.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const EMERGENCY_STORE_FILE = path.join(DATA_DIR, 'emergency_module_store.json');

export interface EmergencyStoreData {
  emergencies: EmergencyRecord[];
  response_teams: ResponseTeam[];
  audit_logs: EmergencyAuditLogRecord[];
  escalation_config: {
    level1ToLevel2Minutes: number;
    level2ToLevel3Minutes: number;
  };
}

// Station coordinates dictionary for automatic geocoding fallback
const STATION_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  bharati: { lat: -69.4075, lng: 76.1872, name: 'Bharati Station (Larsemann Hills)' },
  maitri: { lat: -70.7667, lng: 11.7333, name: 'Maitri Station (Schirmacher Oasis)' },
  himadri: { lat: 78.9234, lng: 11.9288, name: 'Himadri Station (Ny-Ålesund, Arctic)' },
  cape_town: { lat: -33.9249, lng: 18.4241, name: 'Cape Town Staging Port' },
  goa_hq: { lat: 15.3991, lng: 73.8053, name: 'NCPOR Goa Operations Center' },
  vessel_golovnin: { lat: -58.2045, lng: 48.6012, name: 'MV Vasiliy Golovnin (Southern Ocean)' },
};

function buildInitialStore(): EmergencyStoreData {
  return {
    emergencies: [...INITIAL_EMERGENCY_RECORDS],
    response_teams: [...INITIAL_RESPONSE_TEAMS],
    audit_logs: [
      {
        id: 'LOG-INIT-01',
        emergency_id: 'EMG-2026-0012',
        user: 'System Setup',
        action: 'Emergency Created',
        previous_value: null,
        new_value: 'CRITICAL Medical Emergency at Bharati Station',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
    ],
    escalation_config: { ...ESCALATION_CONFIG },
  };
}

export function ensureEmergencyStore(): EmergencyStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(EMERGENCY_STORE_FILE)) {
      const raw = fs.readFileSync(EMERGENCY_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.emergencies) && Array.isArray(parsed.response_teams)) {
        return parsed;
      }
    }
  } catch (err: any) {
    console.warn('[EmergencyStore] Error reading store file, reinitializing:', err.message);
  }

  const initial = buildInitialStore();
  saveEmergencyStore(initial);
  return initial;
}

export function saveEmergencyStore(data: EmergencyStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(EMERGENCY_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[EmergencyStore] Failed to save emergency store:', err.message);
  }
}

export class EmergencyRepository {
  // -------------------------------------------------------------
  // 1. GET ALL EMERGENCIES (WITH FILTERS)
  // -------------------------------------------------------------
  public getEmergencies(filter: {
    status?: string;
    severity?: string;
    station_id?: string;
    vessel_id?: string;
    emergency_type?: string;
    source?: string;
    q?: string;
  } = {}): EmergencyRecord[] {
    const store = ensureEmergencyStore();
    let list = [...store.emergencies];

    if (filter.status && filter.status !== 'ALL') {
      list = list.filter((e) => e.status === filter.status);
    }
    if (filter.severity && filter.severity !== 'ALL') {
      list = list.filter((e) => e.severity === filter.severity);
    }
    if (filter.station_id && filter.station_id !== 'ALL') {
      list = list.filter((e) => e.station_id === filter.station_id);
    }
    if (filter.vessel_id && filter.vessel_id !== 'ALL') {
      list = list.filter((e) => e.vessel_id === filter.vessel_id);
    }
    if (filter.emergency_type && filter.emergency_type !== 'ALL') {
      list = list.filter((e) => e.emergency_type === filter.emergency_type);
    }
    if (filter.source && filter.source !== 'ALL') {
      list = list.filter((e) => e.source === filter.source);
    }
    if (filter.q) {
      const query = filter.q.toLowerCase();
      list = list.filter(
        (e) =>
          e.emergency_code.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query) ||
          e.reported_by.toLowerCase().includes(query)
      );
    }

    // Sort: ACTIVE / ALERTING / IN_PROGRESS first, then newest
    return list.sort((a, b) => {
      const activeA = a.status !== 'RESOLVED' && a.status !== 'CANCELLED' ? 1 : 0;
      const activeB = b.status !== 'RESOLVED' && b.status !== 'CANCELLED' ? 1 : 0;
      if (activeA !== activeB) return activeB - activeA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  // -------------------------------------------------------------
  // 2. GET EMERGENCY BY ID OR CODE
  // -------------------------------------------------------------
  public getEmergencyById(idOrCode: string): EmergencyRecord | null {
    const store = ensureEmergencyStore();
    return (
      store.emergencies.find(
        (e) => e.id === idOrCode || e.emergency_code.toUpperCase() === idOrCode.toUpperCase()
      ) || null
    );
  }

  // -------------------------------------------------------------
  // 3. RESPONSE TEAMS ACCESS & AVAILABILITY
  // -------------------------------------------------------------
  public getResponseTeams(stationId?: string, availableOnly = false): ResponseTeam[] {
    const store = ensureEmergencyStore();
    let teams = [...store.response_teams];
    if (stationId) {
      teams = teams.filter((t) => t.station_id === stationId);
    }
    if (availableOnly) {
      teams = teams.filter((t) => t.availability_status === 'AVAILABLE');
    }
    return teams;
  }

  public updateResponseTeamStatus(teamId: string, status: ResponseTeamAvailability): ResponseTeam | null {
    const store = ensureEmergencyStore();
    const team = store.response_teams.find((t) => t.id === teamId);
    if (!team) return null;

    const oldStatus = team.availability_status;
    team.availability_status = status;
    saveEmergencyStore(store);

    // Audit log
    this.addAuditLog(
      'SYSTEM',
      'SYSTEM',
      `Response Team '${team.name}' status changed`,
      oldStatus,
      status
    );

    return team;
  }

  // -------------------------------------------------------------
  // 4. CREATE EMERGENCY (GENERIC & INTERNAL)
  // -------------------------------------------------------------
  public createEmergency(
    params: {
      source: 'PERSONNEL' | 'WEATHER' | 'SYSTEM';
      emergency_type: EmergencyType;
      severity?: EmergencySeverity;
      reported_by: string;
      affected_personnel_id?: string | null;
      affected_personnel_name?: string | null;
      station_id?: string | null;
      vessel_id?: string | null;
      shipment_id?: string | null;
      asset_id?: string | null;
      location?: string;
      latitude?: number;
      longitude?: number;
      description: string;
      expedition_id?: string;
    },
    userContext?: { name: string; role: string }
  ): EmergencyRecord {
    const store = ensureEmergencyStore();
    const nowIso = new Date().toISOString();

    // 1. Generate unique Emergency Code: EMG-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const codeNum = store.emergencies.length + 13;
    const code = `EMG-${currentYear}-${codeNum.toString().padStart(4, '0')}`;

    // 2. Determine severity
    const defaultRouting = EMERGENCY_ROUTING_MAP[params.emergency_type] || {
      teamType: 'OPERATIONS',
      defaultSeverity: 'MEDIUM',
    };
    const severity: EmergencySeverity = params.severity || defaultRouting.defaultSeverity;

    // 3. Determine location & coordinates
    let locationName = params.location;
    let lat = params.latitude;
    let lng = params.longitude;

    if (!locationName || lat === undefined || lng === undefined) {
      if (params.station_id && STATION_COORDINATES[params.station_id]) {
        const coord = STATION_COORDINATES[params.station_id];
        locationName = locationName || coord.name;
        lat = lat ?? coord.lat;
        lng = lng ?? coord.lng;
      } else if (params.vessel_id && STATION_COORDINATES[params.vessel_id]) {
        const coord = STATION_COORDINATES[params.vessel_id];
        locationName = locationName || coord.name;
        lat = lat ?? coord.lat;
        lng = lng ?? coord.lng;
      } else {
        locationName = locationName || 'Bharati Station Operational Perimeter';
        lat = lat ?? -69.4075;
        lng = lng ?? 76.1872;
      }
    }

    // 4. Automatically identify and route responsible response team (Section 8, 9, 10)
    let assignedTeam: ResponseTeam | null = null;
    const targetStationTeams = store.response_teams.filter(
      (t) =>
        (params.station_id && t.station_id === params.station_id) ||
        (params.vessel_id && t.vessel_id === params.vessel_id)
    );

    // Find preferred team type
    const primaryTeam = targetStationTeams.find((t) => t.team_type === defaultRouting.teamType);
    if (primaryTeam && primaryTeam.availability_status === 'AVAILABLE') {
      assignedTeam = primaryTeam;
    } else if (primaryTeam && primaryTeam.backup_team_id) {
      // Primary team unavailable or busy, try configured backup team (Section 10)
      const backup = store.response_teams.find((t) => t.id === primaryTeam.backup_team_id);
      if (backup && backup.availability_status === 'AVAILABLE') {
        assignedTeam = backup;
      }
    }

    // Fallback to station operations team or any available team at station
    if (!assignedTeam) {
      assignedTeam =
        targetStationTeams.find((t) => t.team_type === 'OPERATIONS' && t.availability_status === 'AVAILABLE') ||
        targetStationTeams.find((t) => t.availability_status === 'AVAILABLE') ||
        null;
    }

    // 5. Initial Notifications (Section 11, 12)
    const notifications: EmergencyNotificationRecord[] = [];
    const notificationMessage = formatEmergencyNotificationMessage({
      emergencyCode: code,
      emergencyType: params.emergency_type,
      severity,
      location: locationName,
      reportedBy: params.reported_by,
      timestamp: new Date().toLocaleTimeString() + ' UTC',
      description: params.description,
      source: params.source,
    });

    if (assignedTeam && assignedTeam.members.length > 0) {
      // In-app alert to response team lead
      notifications.push({
        id: `NOTIF-${Date.now()}-1`,
        emergency_id: code,
        recipient_id: assignedTeam.members[0].id,
        recipient_name: assignedTeam.members[0].name,
        recipient_role: assignedTeam.members[0].role,
        recipient_contact: assignedTeam.contact_info,
        channel: 'IN_APP',
        status: 'DELIVERED',
        message: notificationMessage,
        sent_at: nowIso,
        delivered_at: nowIso,
        acknowledged_at: null,
        failure_reason: null,
        retry_count: 0,
      });

      // SMS backup for critical incidents
      if (severity === 'CRITICAL') {
        notifications.push({
          id: `NOTIF-${Date.now()}-2`,
          emergency_id: code,
          recipient_id: assignedTeam.members[0].id,
          recipient_name: assignedTeam.members[0].name,
          recipient_role: assignedTeam.members[0].role,
          recipient_contact: assignedTeam.contact_info,
          channel: 'SMS',
          status: 'DELIVERED',
          message: notificationMessage,
          sent_at: nowIso,
          delivered_at: nowIso,
          acknowledged_at: null,
          failure_reason: null,
          retry_count: 0,
        });
      }
    }

    // Trigger Communication & Notification Module (Section 1, 10, 43)
    try {
      communicationRepository.createNotification({
        source_module: 'EMERGENCY',
        source_event_id: code,
        notification_type: 'EMERGENCY',
        priority: severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        station_id: params.station_id || undefined,
        vessel_id: params.vessel_id || undefined,
        template_code: 'CRITICAL_EMERGENCY',
        template_params: {
          emergency_code: code,
          station_name: locationName,
          emergency_type: params.emergency_type,
          severity,
          reported_by: params.reported_by,
          detected_at: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          description: params.description,
          response_team: assignedTeam ? assignedTeam.name : 'Station Emergency Units',
        },
        requires_acknowledgement: true,
      }, params.reported_by).catch((err: any) => console.warn('[Emergency->Comm Dispatch Warning]', err));
    } catch (e: any) {
      console.warn('[Emergency->Comm Error]', e.message);
    }

    // 6. Action Log entry
    const initialAction: EmergencyActionRecord = {
      id: `ACT-${Date.now()}-INIT`,
      emergency_id: code,
      action_type: 'DISPATCH',
      description: `Emergency declared. Incident routed to ${
        assignedTeam ? assignedTeam.name : 'Station Operations Command (Escalated: No primary team available)'
      }. Siren activated.`,
      performed_by: userContext?.name || params.reported_by,
      created_at: nowIso,
    };

    // 7. Assemble complete emergency record
    const newEmergency: EmergencyRecord = {
      id: code,
      emergency_code: code,
      expedition_id: params.expedition_id || 'ISEA-44',
      source: params.source,
      emergency_type: params.emergency_type,
      severity,
      status: 'ALERTING',
      reported_by: params.reported_by,
      affected_personnel_id: params.affected_personnel_id || null,
      affected_personnel_name: params.affected_personnel_name || null,
      station_id: params.station_id || null,
      vessel_id: params.vessel_id || null,
      shipment_id: params.shipment_id || null,
      asset_id: params.asset_id || null,
      location: locationName,
      latitude: lat,
      longitude: lng,
      description: params.description,
      detected_at: nowIso,
      created_at: nowIso,
      acknowledged_at: null,
      acknowledged_by: null,
      response_started_at: null,
      resolved_at: null,
      resolved_by: null,
      resolution_summary: null,
      cancelled_at: null,
      cancelled_by: null,
      cancellation_reason: null,
      escalation_level: assignedTeam ? 1 : 2, // If no team was available, immediately escalate to level 2 (Section 10)
      response_team_id: assignedTeam ? assignedTeam.id : null,
      response_team_name: assignedTeam ? assignedTeam.name : null,
      actions: [initialAction],
      notifications,
      escalations: assignedTeam
        ? []
        : [
            {
              id: `ESC-${Date.now()}`,
              emergency_id: code,
              escalation_level: 2,
              escalated_to: 'Station Commander (Primary Response Team Unavailable)',
              triggered_at: nowIso,
              acknowledged_at: null,
              status: 'PENDING',
            },
          ],
    };

    store.emergencies.unshift(newEmergency);
    saveEmergencyStore(store);

    this.addAuditLog(
      code,
      userContext?.name || params.reported_by,
      'Emergency Created',
      null,
      `${severity} ${params.emergency_type} at ${locationName}`
    );

    return newEmergency;
  }

  // -------------------------------------------------------------
  // 5. PERSONNEL-INITIATED EMERGENCY (Section 2, 3, 7, 27, 28)
  // Automatically resolves person identity & latest movement location
  // -------------------------------------------------------------
  public createPersonnelEmergency(
    params: {
      personnel_name?: string;
      personnel_id?: string;
      emergency_type: EmergencyType;
      description?: string;
      fallback_station_id?: StationId;
      fallback_location?: string;
    },
    userContext?: { name: string; role: string; email?: string }
  ): EmergencyRecord {
    // 1. Resolve Personnel Identity
    const opsStore = ensureOperationsStore();
    const allPersonnel = opsStore.personnel || [];

    const reporterName = params.personnel_name || userContext?.name || 'Arun Kumar';
    const foundPerson = allPersonnel.find(
      (p: any) =>
        (params.personnel_id && p.id === params.personnel_id) ||
        (p.name && p.name.toLowerCase().includes(reporterName.toLowerCase())) ||
        (p.code && p.code === params.personnel_id)
    );

    // 2. Identify Current Operational Location (Section 3, 27, 28)
    let stationId: string | null = null;
    let vesselId: string | null = null;
    let locationString: string = '';
    let lat: number = -69.4075;
    let lng: number = 76.1872;

    if (foundPerson) {
      // Use latest movement / transit leg or assigned station
      locationString = foundPerson.currentLocation || foundPerson.transitLeg || '';
      stationId = foundPerson.assignedStationId || foundPerson.station || null;

      if (!locationString && stationId && STATION_COORDINATES[stationId]) {
        locationString = STATION_COORDINATES[stationId].name;
        lat = STATION_COORDINATES[stationId].lat;
        lng = STATION_COORDINATES[stationId].lng;
      }
    }

    // Fallback if not determined
    if (!stationId) {
      stationId = params.fallback_station_id || 'bharati';
    }
    if (!locationString) {
      locationString =
        params.fallback_location ||
        (STATION_COORDINATES[stationId]?.name ?? 'Bharati Station (Habitation Sector)');
      lat = STATION_COORDINATES[stationId]?.lat ?? -69.4075;
      lng = STATION_COORDINATES[stationId]?.lng ?? 76.1872;
    }

    // Default description if omitted during urgent button press
    const description =
      params.description && params.description.trim().length > 0
        ? params.description.trim()
        : `Urgent ${params.emergency_type.replace(/_/g, ' ')} emergency initiated by ${reporterName} at ${locationString}. Immediate assistance requested.`;

    return this.createEmergency(
      {
        source: 'PERSONNEL',
        emergency_type: params.emergency_type,
        reported_by: reporterName,
        affected_personnel_id: foundPerson?.id || foundPerson?.code || 'PRS-05',
        affected_personnel_name: reporterName,
        station_id: stationId,
        vessel_id: vesselId,
        location: locationString,
        latitude: lat,
        longitude: lng,
        description,
      },
      userContext
    );
  }

  // -------------------------------------------------------------
  // 6. WEATHER-TRIGGERED EMERGENCY WITH DEDUPLICATION (Section 6, 25, 36)
  // -------------------------------------------------------------
  public createWeatherEmergency(params: {
    station_id?: string;
    vessel_id?: string;
    condition: string;
    wind_speed: number;
    temperature: number;
    visibility?: number;
    wave_height?: number;
    description: string;
  }): { emergency: EmergencyRecord; isDuplicate: boolean } {
    const store = ensureEmergencyStore();

    // Check existing active weather emergency for this station/vessel (Section 36)
    const existingActive = store.emergencies.find(
      (e) =>
        e.source === 'WEATHER' &&
        e.status !== 'RESOLVED' &&
        e.status !== 'CANCELLED' &&
        ((params.station_id && e.station_id === params.station_id) ||
          (params.vessel_id && e.vessel_id === params.vessel_id))
    );

    if (existingActive) {
      // Update existing emergency instead of spawning duplicates!
      existingActive.description = `${existingActive.description} | Ongoing hazard observation: ${params.condition} (Wind: ${params.wind_speed} km/h, Temp: ${params.temperature}°C).`;
      existingActive.detected_at = new Date().toISOString();
      saveEmergencyStore(store);

      return { emergency: existingActive, isDuplicate: true };
    }

    // Create fresh emergency
    const stationCoord = params.station_id ? STATION_COORDINATES[params.station_id] : null;
    const vesselCoord = params.vessel_id ? STATION_COORDINATES[params.vessel_id] : null;
    const loc = stationCoord?.name || vesselCoord?.name || 'Polar Operations Area';

    const created = this.createEmergency({
      source: 'WEATHER',
      emergency_type: 'WEATHER',
      severity: 'CRITICAL',
      reported_by: 'Weather Rule Engine (Automated Polar Safety)',
      station_id: params.station_id || null,
      vessel_id: params.vessel_id || null,
      location: loc,
      latitude: stationCoord?.lat || vesselCoord?.lat || -69.4075,
      longitude: stationCoord?.lng || vesselCoord?.lng || 76.1872,
      description: params.description,
    });

    return { emergency: created, isDuplicate: false };
  }

  // -------------------------------------------------------------
  // 7. ACKNOWLEDGE EMERGENCY (Section 13)
  // -------------------------------------------------------------
  public acknowledgeEmergency(
    idOrCode: string,
    acknowledgedBy: string,
    notes?: string
  ): EmergencyRecord | null {
    const store = ensureEmergencyStore();
    const emg = store.emergencies.find(
      (e) => e.id === idOrCode || e.emergency_code.toUpperCase() === idOrCode.toUpperCase()
    );
    if (!emg) return null;

    const nowIso = new Date().toISOString();
    const prevStatus = emg.status;

    if (emg.status === 'CREATED' || emg.status === 'ALERTING') {
      emg.status = 'ACKNOWLEDGED';
    }
    emg.acknowledged_at = emg.acknowledged_at || nowIso;
    emg.acknowledged_by = acknowledgedBy;

    // Update notifications acknowledgement
    if (emg.notifications) {
      emg.notifications.forEach((n) => {
        if (!n.acknowledged_at) {
          n.acknowledged_at = nowIso;
          n.status = 'ACKNOWLEDGED';
        }
      });
    }

    // Append action log
    const actionDesc = `Emergency acknowledged by ${acknowledgedBy}.${notes ? ` Note: ${notes}` : ''}`;
    this.appendActionLog(emg, 'UPDATE', actionDesc, acknowledgedBy);

    saveEmergencyStore(store);
    this.addAuditLog(emg.emergency_code, acknowledgedBy, 'Emergency Acknowledged', prevStatus, emg.status);

    return emg;
  }

  // -------------------------------------------------------------
  // 8. ASSIGN RESPONSE TEAM (Section 9, 14)
  // -------------------------------------------------------------
  public assignResponseTeam(
    idOrCode: string,
    teamId: string,
    assignedBy: string,
    notes?: string
  ): EmergencyRecord | null {
    const store = ensureEmergencyStore();
    const emg = store.emergencies.find(
      (e) => e.id === idOrCode || e.emergency_code.toUpperCase() === idOrCode.toUpperCase()
    );
    const team = store.response_teams.find((t) => t.id === teamId);
    if (!emg || !team) return null;

    const prevTeam = emg.response_team_name;
    emg.response_team_id = team.id;
    emg.response_team_name = team.name;
    emg.status = 'RESPONSE_ASSIGNED';

    // Mark team busy
    team.availability_status = 'BUSY';

    const desc = `Response assigned to ${team.name} by ${assignedBy}.${notes ? ` Notes: ${notes}` : ''}`;
    this.appendActionLog(emg, 'DISPATCH', desc, assignedBy);

    saveEmergencyStore(store);
    this.addAuditLog(emg.emergency_code, assignedBy, 'Response Team Assigned', prevTeam, team.name);

    return emg;
  }

  // -------------------------------------------------------------
  // 9. ACCEPT RESPONSE / START RESPONSE (Section 14, 15)
  // -------------------------------------------------------------
  public acceptResponse(
    idOrCode: string,
    responderName: string,
    notes?: string
  ): EmergencyRecord | null {
    const store = ensureEmergencyStore();
    const emg = store.emergencies.find(
      (e) => e.id === idOrCode || e.emergency_code.toUpperCase() === idOrCode.toUpperCase()
    );
    if (!emg) return null;

    const nowIso = new Date().toISOString();
    const prevStatus = emg.status;

    emg.status = 'RESPONSE_IN_PROGRESS';
    emg.response_started_at = emg.response_started_at || nowIso;

    const desc = `Response accepted by ${responderName}. Active deployment in progress.${notes ? ` Detail: ${notes}` : ''}`;
    this.appendActionLog(emg, 'ON_SCENE', desc, responderName);

    saveEmergencyStore(store);
    this.addAuditLog(emg.emergency_code, responderName, 'Response In Progress', prevStatus, 'RESPONSE_IN_PROGRESS');

    return emg;
  }

  // -------------------------------------------------------------
  // 10. REJECT RESPONSE ASSIGNMENT (Section 14, Edge Case 22)
  // -------------------------------------------------------------
  public rejectResponse(
    idOrCode: string,
    reason: string,
    responderName: string
  ): EmergencyRecord | null {
    const store = ensureEmergencyStore();
    const emg = store.emergencies.find(
      (e) => e.id === idOrCode || e.emergency_code.toUpperCase() === idOrCode.toUpperCase()
    );
    if (!emg) return null;

    const rejectedTeamId = emg.response_team_id;
    const desc = `Response rejected by team/responder ${responderName}: ${reason}. System seeking backup team.`;
    this.appendActionLog(emg, 'UPDATE', desc, responderName);

    // Try finding backup team
    const currentTeam = store.response_teams.find((t) => t.id === rejectedTeamId);
    let backupTeam: ResponseTeam | null = null;
    if (currentTeam?.backup_team_id) {
      backupTeam = store.response_teams.find(
        (t) => t.id === currentTeam.backup_team_id && t.availability_status === 'AVAILABLE'
      ) || null;
    }

    if (backupTeam) {
      emg.response_team_id = backupTeam.id;
      emg.response_team_name = backupTeam.name;
      emg.status = 'RESPONSE_ASSIGNED';
      this.appendActionLog(emg, 'DISPATCH', `Re-routed to backup team: ${backupTeam.name}`, 'System Auto-Router');
    } else {
      // Escalate to station commander / central ops
      emg.escalation_level = Math.min(3, (emg.escalation_level || 1) + 1);
      emg.status = 'ALERTING';
      this.appendActionLog(emg, 'UPDATE', `No backup team available. Escalated to Level ${emg.escalation_level}.`, 'System');
    }

    saveEmergencyStore(store);
    this.addAuditLog(emg.emergency_code, responderName, 'Response Assignment Rejected', rejectedTeamId, reason);

    return emg;
  }

  // -------------------------------------------------------------
  // 11. RECORD ACTION LOG (Section 16)
  // -------------------------------------------------------------
  public recordAction(
    idOrCode: string,
    actionType: EmergencyActionRecord['action_type'],
    description: string,
    performedBy: string
  ): EmergencyRecord | null {
    const store = ensureEmergencyStore();
    const emg = store.emergencies.find(
      (e) => e.id === idOrCode || e.emergency_code.toUpperCase() === idOrCode.toUpperCase()
    );
    if (!emg) return null;

    this.appendActionLog(emg, actionType, description, performedBy);
    saveEmergencyStore(store);

    this.addAuditLog(emg.emergency_code, performedBy, `Action Recorded: ${actionType}`, null, description);
    return emg;
  }

  // -------------------------------------------------------------
  // 12. ESCALATE EMERGENCY (Section 17, 18)
  // -------------------------------------------------------------
  public escalateEmergency(
    idOrCode: string,
    escalatedBy: string,
    reason?: string
  ): EmergencyRecord | null {
    const store = ensureEmergencyStore();
    const emg = store.emergencies.find(
      (e) => e.id === idOrCode || e.emergency_code.toUpperCase() === idOrCode.toUpperCase()
    );
    if (!emg) return null;

    const prevLevel = emg.escalation_level || 1;
    const newLevel = Math.min(3, prevLevel + 1);
    emg.escalation_level = newLevel;

    const escalatedTo =
      newLevel === 2
        ? 'Station Commander / Operations Manager'
        : 'NCPOR Central Polar Emergency Operations (Goa HQ Director)';

    if (!emg.escalations) emg.escalations = [];
    emg.escalations.push({
      id: `ESC-${Date.now()}`,
      emergency_id: emg.emergency_code,
      escalation_level: newLevel,
      escalated_to: escalatedTo,
      triggered_at: new Date().toISOString(),
      acknowledged_at: null,
      status: 'PENDING',
    });

    const desc = `Emergency Escalated to Level ${newLevel} (${escalatedTo}) by ${escalatedBy}.${
      reason ? ` Reason: ${reason}` : ''
    }`;
    this.appendActionLog(emg, 'UPDATE', desc, escalatedBy);

    // Dispatch priority escalation notification
    if (!emg.notifications) emg.notifications = [];
    emg.notifications.push({
      id: `NOTIF-ESC-${Date.now()}`,
      emergency_id: emg.emergency_code,
      recipient_id: `ESC-LEVEL-${newLevel}`,
      recipient_name: escalatedTo,
      recipient_role: 'Operations Command Authority',
      recipient_contact: 'ops.polar@ncpor.gov.in / Sat Ext 999',
      channel: 'IRIDIUM_SATELLITE',
      status: 'DELIVERED',
      message: `PRIORITY ESCALATION (LEVEL ${newLevel}) for ${emg.emergency_code}: ${emg.severity} ${emg.emergency_type} at ${emg.location}.`,
      sent_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
      acknowledged_at: null,
      failure_reason: null,
      retry_count: 0,
    });

    // Trigger Communication Module for Escalation Directive (Section 20)
    try {
      communicationRepository.createNotification({
        source_module: 'EMERGENCY',
        source_event_id: emg.emergency_code,
        notification_type: 'EMERGENCY',
        priority: 'CRITICAL',
        station_id: emg.station_id || undefined,
        vessel_id: emg.vessel_id || undefined,
        template_code: 'EMERGENCY_ESCALATION',
        template_params: {
          emergency_code: emg.emergency_code,
          station_name: emg.location,
          escalation_level: newLevel,
          escalated_to_role: escalatedTo,
          escalation_reason: reason || 'Response acknowledgement timeout exceeded',
          elapsed_minutes: Math.round((Date.now() - new Date(emg.created_at || emg.detected_at).getTime()) / 60000),
          description: emg.description,
        },
        requires_acknowledgement: true,
      }, escalatedBy).catch((err: any) => console.warn('[Escalation->Comm Dispatch Warning]', err));
    } catch (e: any) {
      console.warn('[Escalation->Comm Error]', e.message);
    }

    saveEmergencyStore(store);
    this.addAuditLog(
      emg.emergency_code,
      escalatedBy,
      'Emergency Escalated',
      `Level ${prevLevel}`,
      `Level ${newLevel} (${escalatedTo})`
    );

    return emg;
  }

  // -------------------------------------------------------------
  // 13. RESOLVE EMERGENCY (Section 19)
  // -------------------------------------------------------------
  public resolveEmergency(
    idOrCode: string,
    summary: string,
    resolvedBy: string,
    notes?: string
  ): EmergencyRecord | null {
    const store = ensureEmergencyStore();
    const emg = store.emergencies.find(
      (e) => e.id === idOrCode || e.emergency_code.toUpperCase() === idOrCode.toUpperCase()
    );
    if (!emg) return null;

    const nowIso = new Date().toISOString();
    const prevStatus = emg.status;

    emg.status = 'RESOLVED';
    emg.resolved_at = nowIso;
    emg.resolved_by = resolvedBy;
    emg.resolution_summary = summary;

    // Release assigned response team back to AVAILABLE
    if (emg.response_team_id) {
      const team = store.response_teams.find((t) => t.id === emg.response_team_id);
      if (team) {
        team.availability_status = 'AVAILABLE';
      }
    }

    const desc = `Emergency marked RESOLVED by ${resolvedBy}. Summary: ${summary}.${notes ? ` Notes: ${notes}` : ''}`;
    this.appendActionLog(emg, 'UPDATE', desc, resolvedBy);

    saveEmergencyStore(store);
    this.addAuditLog(emg.emergency_code, resolvedBy, 'Emergency Resolved', prevStatus, 'RESOLVED');

    return emg;
  }

  // -------------------------------------------------------------
  // 14. CANCEL EMERGENCY (Section 20 - Accidental / False Alarm)
  // -------------------------------------------------------------
  public cancelEmergency(
    idOrCode: string,
    reason: string,
    cancelledBy: string
  ): EmergencyRecord | null {
    const store = ensureEmergencyStore();
    const emg = store.emergencies.find(
      (e) => e.id === idOrCode || e.emergency_code.toUpperCase() === idOrCode.toUpperCase()
    );
    if (!emg) return null;

    const nowIso = new Date().toISOString();
    const prevStatus = emg.status;

    emg.status = 'CANCELLED';
    emg.cancelled_at = nowIso;
    emg.cancelled_by = cancelledBy;
    emg.cancellation_reason = reason;

    // Release assigned response team back to AVAILABLE
    if (emg.response_team_id) {
      const team = store.response_teams.find((t) => t.id === emg.response_team_id);
      if (team) {
        team.availability_status = 'AVAILABLE';
      }
    }

    const desc = `Emergency CANCELLED by ${cancelledBy}. Reason: ${reason}`;
    this.appendActionLog(emg, 'UPDATE', desc, cancelledBy);

    saveEmergencyStore(store);
    this.addAuditLog(emg.emergency_code, cancelledBy, 'Emergency Cancelled', prevStatus, 'CANCELLED');

    return emg;
  }

  // -------------------------------------------------------------
  // 15. BACKGROUND JOB: CHECK UNACKNOWLEDGED EMERGENCIES (Section 34)
  // -------------------------------------------------------------
  public checkEscalations(): number {
    const store = ensureEmergencyStore();
    const now = Date.now();
    let escalatedCount = 0;

    const unacknowledged = store.emergencies.filter(
      (e) => (e.status === 'CREATED' || e.status === 'ALERTING') && !e.acknowledged_at
    );

    for (const emg of unacknowledged) {
      const elapsedMin = (now - new Date(emg.created_at).getTime()) / (1000 * 60);

      if (elapsedMin >= store.escalation_config.level2ToLevel3Minutes && emg.escalation_level < 3) {
        this.escalateEmergency(
          emg.id,
          'Automated Escalation Service',
          `Unacknowledged for ${Math.round(elapsedMin)} minutes (exceeded ${store.escalation_config.level2ToLevel3Minutes}m threshold)`
        );
        escalatedCount++;
      } else if (elapsedMin >= store.escalation_config.level1ToLevel2Minutes && emg.escalation_level < 2) {
        this.escalateEmergency(
          emg.id,
          'Automated Escalation Service',
          `Unacknowledged for ${Math.round(elapsedMin)} minutes (exceeded ${store.escalation_config.level1ToLevel2Minutes}m threshold)`
        );
        escalatedCount++;
      }
    }

    return escalatedCount;
  }

  // -------------------------------------------------------------
  // 16. BACKGROUND JOB: RETRY PENDING/FAILED NOTIFICATIONS (Section 35)
  // -------------------------------------------------------------
  public retryPendingNotifications(): number {
    const store = ensureEmergencyStore();
    let retried = 0;
    const nowIso = new Date().toISOString();

    for (const emg of store.emergencies) {
      if (emg.status === 'RESOLVED' || emg.status === 'CANCELLED') continue;
      if (!emg.notifications) continue;

      for (const n of emg.notifications) {
        if (n.status === 'FAILED' && n.retry_count < 3) {
          n.retry_count++;
          n.status = 'DELIVERED'; // Simulated successful delivery on retry
          n.delivered_at = nowIso;
          n.failure_reason = null;
          retried++;
        }
      }
    }

    if (retried > 0) {
      saveEmergencyStore(store);
    }
    return retried;
  }

  // -------------------------------------------------------------
  // 17. STATS & ANALYTICS REPORT (Section 44, 45)
  // -------------------------------------------------------------
  public getStats(): EmergencyStats {
    const store = ensureEmergencyStore();
    const list = store.emergencies;

    let activeCount = 0;
    let criticalCount = 0;
    let unacknowledgedCount = 0;
    let inProgressCount = 0;
    let resolvedTodayCount = 0;
    let escalatedCount = 0;

    const byStation: Record<string, number> = {};
    const byType: Record<string, number> = {};

    let totalAckTimeMs = 0;
    let ackCount = 0;
    let totalRespTimeMs = 0;
    let respCount = 0;
    let totalResolveTimeMs = 0;
    let resolveCount = 0;

    let totalNotifications = 0;
    let deliveredNotifications = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    for (const e of list) {
      const isClosed = e.status === 'RESOLVED' || e.status === 'CANCELLED';
      if (!isClosed) {
        activeCount++;
        if (e.severity === 'CRITICAL') criticalCount++;
        if (!e.acknowledged_at) unacknowledgedCount++;
        if (e.status === 'RESPONSE_IN_PROGRESS') inProgressCount++;
        if (e.escalation_level > 1) escalatedCount++;
      }

      if (e.status === 'RESOLVED' && e.resolved_at?.startsWith(todayStr)) {
        resolvedTodayCount++;
      }

      // Grouping
      const stn = e.station_id || e.vessel_id || 'other';
      byStation[stn] = (byStation[stn] || 0) + 1;
      byType[e.emergency_type] = (byType[e.emergency_type] || 0) + 1;

      // Response Time Calculations (Section 45)
      const createdMs = new Date(e.created_at).getTime();
      if (e.acknowledged_at) {
        totalAckTimeMs += Math.max(0, new Date(e.acknowledged_at).getTime() - createdMs);
        ackCount++;
      }
      if (e.response_started_at) {
        totalRespTimeMs += Math.max(0, new Date(e.response_started_at).getTime() - createdMs);
        respCount++;
      }
      if (e.resolved_at) {
        totalResolveTimeMs += Math.max(0, new Date(e.resolved_at).getTime() - createdMs);
        resolveCount++;
      }

      // Notification delivery calculation
      if (e.notifications) {
        for (const n of e.notifications) {
          totalNotifications++;
          if (n.status === 'DELIVERED' || n.status === 'ACKNOWLEDGED') {
            deliveredNotifications++;
          }
        }
      }
    }

    const avgAckMin = ackCount > 0 ? Math.round((totalAckTimeMs / ackCount / 60000) * 10) / 10 : 1.5;
    const avgRespMin = respCount > 0 ? Math.round((totalRespTimeMs / respCount / 60000) * 10) / 10 : 4.8;
    const avgResolveMin = resolveCount > 0 ? Math.round((totalResolveTimeMs / resolveCount / 60000) * 10) / 10 : 42.0;
    const deliveryRate = totalNotifications > 0 ? Math.round((deliveredNotifications / totalNotifications) * 100) : 98;

    return {
      active_count: activeCount,
      critical_count: criticalCount,
      unacknowledged_count: unacknowledgedCount,
      response_in_progress_count: inProgressCount,
      resolved_today_count: resolvedTodayCount,
      escalated_count: escalatedCount,
      avg_time_to_acknowledge_min: avgAckMin,
      avg_time_to_response_min: avgRespMin,
      avg_time_to_resolve_min: avgResolveMin,
      by_station: byStation,
      by_type: byType,
      notification_delivery_rate: deliveryRate,
    };
  }

  // -------------------------------------------------------------
  // 18. AUDIT LOGS & INCIDENT HISTORY (Section 38)
  // -------------------------------------------------------------
  public getHistory(idOrCode: string): {
    emergency: EmergencyRecord | null;
    actions: EmergencyActionRecord[];
    notifications: EmergencyNotificationRecord[];
    escalations: EmergencyEscalationRecord[];
    audit_logs: EmergencyAuditLogRecord[];
  } {
    const store = ensureEmergencyStore();
    const emg = store.emergencies.find(
      (e) => e.id === idOrCode || e.emergency_code.toUpperCase() === idOrCode.toUpperCase()
    );
    if (!emg) {
      return { emergency: null, actions: [], notifications: [], escalations: [], audit_logs: [] };
    }

    const logs = store.audit_logs.filter((l) => l.emergency_id === emg.emergency_code);
    return {
      emergency: emg,
      actions: emg.actions || [],
      notifications: emg.notifications || [],
      escalations: emg.escalations || [],
      audit_logs: logs,
    };
  }

  // -------------------------------------------------------------
  // HELPER METHODS
  // -------------------------------------------------------------
  private appendActionLog(
    emg: EmergencyRecord,
    actionType: EmergencyActionRecord['action_type'],
    description: string,
    performedBy: string
  ): void {
    if (!emg.actions) emg.actions = [];
    emg.actions.push({
      id: `ACT-${Date.now()}-${emg.actions.length + 1}`,
      emergency_id: emg.emergency_code,
      action_type: actionType,
      description,
      performed_by: performedBy,
      created_at: new Date().toISOString(),
    });
  }

  private addAuditLog(
    emergencyId: string,
    user: string,
    action: string,
    previousValue: string | null,
    newValue: string | null
  ): void {
    const store = ensureEmergencyStore();
    store.audit_logs.push({
      id: `AUDIT-${Date.now()}-${store.audit_logs.length + 1}`,
      emergency_id: emergencyId,
      user,
      action,
      previous_value: previousValue,
      new_value: newValue,
      timestamp: new Date().toISOString(),
    });
    saveEmergencyStore(store);
  }

  public getAllEmergencies(): EmergencyRecord[] {
    const store = ensureEmergencyStore();
    return store.emergencies || [];
  }

  public getAllTeams(): ResponseTeam[] {
    const store = ensureEmergencyStore();
    return store.response_teams || [];
  }
}

export const emergencyRepository = new EmergencyRepository();
