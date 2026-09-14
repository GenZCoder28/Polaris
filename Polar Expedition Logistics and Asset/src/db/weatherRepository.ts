import fs from 'fs';
import path from 'path';
import { db } from './index.ts';
import { 
  weatherObservations as weatherObsTable, 
  weatherForecasts as weatherFctTable, 
  weatherRules as weatherRulesTable, 
  weatherEvents as weatherEventsTable, 
  weatherAlerts as weatherAlertsTable, 
  weatherAuditLogs as weatherAuditTable 
} from './schema.ts';
import { 
  WeatherObservation, 
  WeatherForecast, 
  WeatherRule, 
  WeatherEvent, 
  WeatherAlert, 
  WeatherAuditLog, 
  StationWeatherConfig,
  WeatherOverviewResponse,
  WeatherSeverity
} from '../types.ts';
import { DEFAULT_WEATHER_RULES, weatherRuleEngine } from '../services/weatherRuleEngine.ts';
import { weatherService } from '../services/weatherService.ts';
import { INITIAL_PERSONNEL } from '../data/initialData.ts';
import { emergencyRepository } from './emergencyRepository.ts';
import { communicationRepository } from './communicationRepository.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'weather_store.json');

// Predefined Indian Polar Research Stations with coordinates & operational monitoring radius
export const INITIAL_STATION_CONFIGS: StationWeatherConfig[] = [
  {
    station_id: 'bharati',
    name: 'Bharati Station (Larsemann Hills)',
    latitude: -69.4075,
    longitude: 76.1872,
    operational_radius_km: 25,
  },
  {
    station_id: 'maitri',
    name: 'Maitri Station (Schirmacher Oasis)',
    latitude: -70.7667,
    longitude: 11.7333,
    operational_radius_km: 50,
  },
  {
    station_id: 'himadri',
    name: 'Himadri Station (Ny-Ålesund, Arctic)',
    latitude: 78.9236,
    longitude: 11.9331,
    operational_radius_km: 15,
  },
];

export const INITIAL_VESSEL_CONFIGS = [
  {
    id: 'vessel_golovnin',
    name: 'MV Vasiliy Golovnin (Expedition Flagship)',
    latitude: -52.4,
    longitude: 28.6,
    currentLeg: 'Southern Ocean Roaring Forties transit leg toward Prydz Bay',
    destination: 'Bharati Station Fast-Ice (Prydz Bay)',
    associatedContainers: ['CNT-1023', 'CNT-1024', 'CNT-1025', 'CNT-1026'],
  },
  {
    id: 'vessel_polar_transport',
    name: 'Polar Transporter II',
    latitude: -34.8,
    longitude: 19.5,
    currentLeg: 'South Atlantic Departure Leg from Cape Town',
    destination: 'Maitri Station Shelf Mooring',
    associatedContainers: ['CNT-1027', 'CNT-1028'],
  }
];

interface WeatherStoreState {
  stations: StationWeatherConfig[];
  vessels: typeof INITIAL_VESSEL_CONFIGS;
  rules: WeatherRule[];
  observations: WeatherObservation[];
  forecasts: Record<string, WeatherForecast>;
  events: WeatherEvent[];
  alerts: WeatherAlert[];
  auditLogs: WeatherAuditLog[];
  lastBackgroundRun: string;
}

function getInitialStore(): WeatherStoreState {
  return {
    stations: [...INITIAL_STATION_CONFIGS],
    vessels: [...INITIAL_VESSEL_CONFIGS],
    rules: [...DEFAULT_WEATHER_RULES],
    observations: [],
    forecasts: {},
    events: [],
    alerts: [],
    auditLogs: [
      {
        id: 1,
        action: 'SYSTEM_INITIALIZATION',
        details: 'Weather & Environmental Monitoring module initialized with Open-Meteo Polar API and Rule-Based Risk Engine.',
        timestamp: new Date().toISOString(),
        user_email: 'system.weather@ncpor.res.in',
      }
    ],
    lastBackgroundRun: new Date().toISOString(),
  };
}

class WeatherRepository {
  private memoryStore: WeatherStoreState = getInitialStore();

  constructor() {
    this.initStore();
  }

  private initStore(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryStore = {
          ...getInitialStore(),
          ...parsed,
          stations: parsed.stations?.length ? parsed.stations : INITIAL_STATION_CONFIGS,
          vessels: parsed.vessels?.length ? parsed.vessels : INITIAL_VESSEL_CONFIGS,
          rules: parsed.rules?.length ? parsed.rules : DEFAULT_WEATHER_RULES,
        };
      } else {
        this.saveStore();
      }
    } catch (err) {
      console.warn('[WeatherRepository] Error reading store from disk, using initial state:', err);
      this.memoryStore = getInitialStore();
    }

    // Sync rules into rule engine
    weatherRuleEngine.setRules(this.memoryStore.rules);
  }

  private saveStore(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.memoryStore, null, 2));
    } catch (err) {
      console.warn('[WeatherRepository] Error writing store to disk:', err);
    }
  }

  public logAudit(action: string, details: string, userEmail: string = 'officer.logistics@ncpor.res.in'): void {
    const log: WeatherAuditLog = {
      id: Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
      user_email: userEmail,
    };
    this.memoryStore.auditLogs.unshift(log);
    if (this.memoryStore.auditLogs.length > 500) {
      this.memoryStore.auditLogs = this.memoryStore.auditLogs.slice(0, 500);
    }
    this.saveStore();

    if (db) {
      db.insert(weatherAuditTable)
        .values({
          action: log.action,
          details: log.details,
          userEmail: log.user_email,
          timestamp: log.timestamp,
        })
        .catch((e) => console.warn('[WeatherRepository] Audit log pg insert notice:', e.message));
    }
  }

  // ==========================================
  // STATION & RADIUS CONFIGURATION
  // ==========================================
  public getStations(): StationWeatherConfig[] {
    return this.memoryStore.stations;
  }

  public updateStationRadius(stationId: string, radiusKm: number): StationWeatherConfig | null {
    const station = this.memoryStore.stations.find((s) => s.station_id === stationId);
    if (!station) return null;
    station.operational_radius_km = radiusKm;
    this.saveStore();
    this.logAudit('STATION_RADIUS_UPDATED', `Operational monitoring radius for ${station.name} set to ${radiusKm} km.`);
    return station;
  }

  // ==========================================
  // VESSEL TRACKING & COORDINATES
  // ==========================================
  public getVessels() {
    return this.memoryStore.vessels;
  }

  public updateVesselPosition(vesselId: string, lat: number, lng: number, leg?: string) {
    const vessel = this.memoryStore.vessels.find((v) => v.id === vesselId);
    if (!vessel) return null;
    vessel.latitude = lat;
    vessel.longitude = lng;
    if (leg) vessel.currentLeg = leg;
    this.saveStore();
    this.logAudit('VESSEL_POSITION_UPDATED', `${vessel.name} GPS position updated to Lat: ${lat}, Lng: ${lng}.`);
    return vessel;
  }

  // ==========================================
  // RULES ENGINE CONFIGURATION (CRUD)
  // ==========================================
  public getRules(): WeatherRule[] {
    return this.memoryStore.rules;
  }

  public addRule(rule: WeatherRule): WeatherRule {
    const newRule: WeatherRule = {
      ...rule,
      id: rule.id || `RULE-${rule.environment_type}-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.memoryStore.rules.push(newRule);
    weatherRuleEngine.setRules(this.memoryStore.rules);
    this.saveStore();
    this.logAudit('RULE_CREATED', `Created safety rule: ${newRule.name} (${newRule.environment_type}, ${newRule.severity})`);
    return newRule;
  }

  public updateRule(ruleId: string, updates: Partial<WeatherRule>): WeatherRule | null {
    const idx = this.memoryStore.rules.findIndex((r) => r.id === ruleId);
    if (idx === -1) return null;
    this.memoryStore.rules[idx] = {
      ...this.memoryStore.rules[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    weatherRuleEngine.setRules(this.memoryStore.rules);
    this.saveStore();
    this.logAudit('RULE_UPDATED', `Updated safety rule: ${this.memoryStore.rules[idx].name}`);
    return this.memoryStore.rules[idx];
  }

  public deleteRule(ruleId: string): boolean {
    const rule = this.memoryStore.rules.find((r) => r.id === ruleId);
    if (!rule) return false;
    this.memoryStore.rules = this.memoryStore.rules.filter((r) => r.id !== ruleId);
    weatherRuleEngine.setRules(this.memoryStore.rules);
    this.saveStore();
    this.logAudit('RULE_DELETED', `Deleted safety rule: ${rule.name}`);
    return true;
  }

  // ==========================================
  // LIVE OBSERVATIONS & FORECASTS SYNC
  // ==========================================
  public async syncAllWeather(): Promise<void> {
    const personnel = INITIAL_PERSONNEL;

    // 1. Sync Stations
    for (const stn of this.memoryStore.stations) {
      try {
        const { observation, forecast } = await weatherService.getStationWeather(stn);
        this.saveObservation(observation);
        this.memoryStore.forecasts[`station_${stn.station_id}`] = forecast;

        // Run Rule Engine
        const engineResult = weatherRuleEngine.evaluateEntity(
          stn.station_id,
          stn.name,
          'STATION',
          observation,
          forecast,
          this.memoryStore.events,
          personnel
        );

        this.applyEngineResults(engineResult);
      } catch (err: any) {
        this.logAudit('WEATHER_FETCH_FAILED', `Failed to sync weather for station ${stn.name}: ${err.message}`);
      }
    }

    // 2. Sync Vessels
    for (const v of this.memoryStore.vessels) {
      try {
        const { observation, forecast } = await weatherService.getVesselWeather(v);
        this.saveObservation(observation);
        this.memoryStore.forecasts[`vessel_${v.id}`] = forecast;

        // Run Rule Engine
        const engineResult = weatherRuleEngine.evaluateEntity(
          v.id,
          v.name,
          'SHIP',
          observation,
          forecast,
          this.memoryStore.events,
          personnel
        );

        this.applyEngineResults(engineResult);
      } catch (err: any) {
        this.logAudit('WEATHER_FETCH_FAILED', `Failed to sync weather for vessel ${v.name}: ${err.message}`);
      }
    }

    this.memoryStore.lastBackgroundRun = new Date().toISOString();
    this.saveStore();
  }

  private saveObservation(obs: WeatherObservation): void {
    // Keep max 2000 historical observations
    this.memoryStore.observations.unshift(obs);
    if (this.memoryStore.observations.length > 2000) {
      this.memoryStore.observations = this.memoryStore.observations.slice(0, 2000);
    }
  }

  private applyEngineResults(engineResult: ReturnType<typeof weatherRuleEngine.evaluateEntity>): void {
    // Add newly created events
    for (const ev of engineResult.activeEventsCreated) {
      this.memoryStore.events.unshift(ev);
      this.logAudit(
        'WEATHER_EVENT_DETECTED',
        `New ${ev.severity} event '${ev.event_type}' at ${ev.target_name}. Directive: ${ev.operational_instruction}`
      );

      // Section 6 & 25: Trigger Emergency module for CRITICAL weather hazards
      if (ev.severity === 'CRITICAL') {
        try {
          emergencyRepository.createWeatherEmergency({
            station_id: ev.station_id || undefined,
            vessel_id: ev.vessel_id || undefined,
            condition: ev.event_type,
            wind_speed: 75,
            temperature: -35,
            description: `${ev.event_type} at ${ev.target_name}: ${ev.operational_instruction}`,
          });
        } catch (err: any) {
          console.warn('[Weather->Emergency Integration Notice]', err.message);
        }
      } else if (ev.severity === 'WARNING') {
        // Section 11: Weather Warning routed to Communication Module (not full emergency)
        try {
          communicationRepository.createNotification({
            source_module: 'WEATHER',
            source_event_id: ev.id,
            notification_type: 'WEATHER_WARNING',
            priority: 'HIGH',
            station_id: ev.station_id || undefined,
            vessel_id: ev.vessel_id || undefined,
            template_code: 'WEATHER_WARNING',
            template_params: {
              station_name: ev.target_name,
              weather_condition: ev.event_type,
              severity: ev.severity,
              wind_speed: 65,
              visibility: 3.5,
              detected_at: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
              operational_instruction: ev.operational_instruction,
            },
            requires_acknowledgement: false,
          }).catch((err: any) => console.warn('[Weather->Comm Warning Notice]', err.message));
        } catch (err: any) {
          console.warn('[Weather->Comm Error]', err.message);
        }
      }
    }

    // Update existing monitored events
    for (const updated of engineResult.activeEventsUpdated) {
      const idx = this.memoryStore.events.findIndex((e) => e.id === updated.id);
      if (idx !== -1) {
        this.memoryStore.events[idx] = updated;
      }
    }

    // Add generated alerts
    for (const al of engineResult.alertsGenerated) {
      this.memoryStore.alerts.unshift(al);
      this.logAudit(
        'ALERT_DISPATCHED',
        `Dispatched ${al.severity} alert to ${al.recipient_name} (${al.recipient_role}) for ${al.target_name}`
      );
    }
  }

  // ==========================================
  // GET OVERVIEW DASHBOARD DATA
  // ==========================================
  public async getOverview(): Promise<WeatherOverviewResponse> {
    // If no observations yet, perform initial sync
    if (this.memoryStore.observations.length === 0) {
      await this.syncAllWeather();
    }

    const stationItems = this.memoryStore.stations.map((stn) => {
      const obs = this.memoryStore.observations.find((o) => o.station_id === stn.station_id) || {
        id: `OBS-${stn.station_id}-DFT`,
        source: 'NCPOR Polar Telemetry',
        latitude: stn.latitude,
        longitude: stn.longitude,
        station_id: stn.station_id,
        observed_at: new Date().toISOString(),
        temperature: -24.0,
        apparent_temperature: -36.0,
        wind_speed: 42,
        wind_direction: 120,
        wind_gust: 58,
        precipitation: 0,
        snow: 1,
        visibility: 950,
        pressure: 986,
        weather_condition: 'Polar Overcast',
        is_stale: false,
      };

      const forecast = this.memoryStore.forecasts[`station_${stn.station_id}`] || {
        location: stn.name,
        station_id: stn.station_id,
        source: 'NCPOR Polar Telemetry',
        retrieved_at: new Date().toISOString(),
        hourly: [],
        is_stale: false,
      };

      const activeEvents = this.memoryStore.events.filter(
        (e) => e.station_id === stn.station_id && e.status !== 'RESOLVED'
      );

      let severity: WeatherSeverity = 'NORMAL';
      if (activeEvents.some((e) => e.severity === 'CRITICAL')) severity = 'CRITICAL';
      else if (activeEvents.some((e) => e.severity === 'WARNING')) severity = 'WARNING';
      else if (activeEvents.some((e) => e.severity === 'WATCH')) severity = 'WATCH';

      return {
        station_id: stn.station_id,
        name: stn.name,
        latitude: stn.latitude,
        longitude: stn.longitude,
        radius_km: stn.operational_radius_km,
        current: obs,
        forecast,
        severity,
        active_events: activeEvents,
      };
    });

    const vesselItems = this.memoryStore.vessels.map((v) => {
      const obs = this.memoryStore.observations.find((o) => o.vessel_id === v.id) || {
        id: `OBS-${v.id}-DFT`,
        source: 'NCPOR Marine Telemetry',
        latitude: v.latitude,
        longitude: v.longitude,
        vessel_id: v.id,
        observed_at: new Date().toISOString(),
        temperature: -2.0,
        apparent_temperature: -10.0,
        wind_speed: 52,
        wind_direction: 260,
        wind_gust: 72,
        precipitation: 0.8,
        snow: 0.4,
        visibility: 2200,
        pressure: 990,
        wave_height: 4.6,
        wave_period: 8.5,
        sea_state: 'Rough (4.0-6.0m)',
        weather_condition: 'Rough Seas & High Swell',
        is_stale: false,
      };

      const forecast = this.memoryStore.forecasts[`vessel_${v.id}`] || {
        location: v.name,
        vessel_id: v.id,
        source: 'NCPOR Marine Telemetry',
        retrieved_at: new Date().toISOString(),
        hourly: [],
        is_stale: false,
      };

      const activeEvents = this.memoryStore.events.filter(
        (e) => e.vessel_id === v.id && e.status !== 'RESOLVED'
      );

      let severity: WeatherSeverity = 'NORMAL';
      if (activeEvents.some((e) => e.severity === 'CRITICAL')) severity = 'CRITICAL';
      else if (activeEvents.some((e) => e.severity === 'WARNING')) severity = 'WARNING';
      else if (activeEvents.some((e) => e.severity === 'WATCH')) severity = 'WATCH';

      return {
        vessel_id: v.id,
        name: v.name,
        latitude: v.latitude,
        longitude: v.longitude,
        current: obs,
        forecast,
        severity,
        active_events: activeEvents,
        associated_containers: v.associatedContainers,
      };
    });

    // Check if data is stale (> 45 minutes since last sync)
    const lastSyncMs = new Date(weatherService.apiStatus.lastSync).getTime();
    const isStale = Date.now() - lastSyncMs > 45 * 60 * 1000;

    return {
      stations: stationItems,
      vessels: vesselItems,
      active_events: this.memoryStore.events.filter((e) => e.status !== 'RESOLVED'),
      active_alerts: this.memoryStore.alerts,
      system_status: {
        provider: weatherService.name,
        last_sync: weatherService.apiStatus.lastSync,
        is_stale: isStale,
        last_api_error: weatherService.apiStatus.lastApiError,
        sync_interval_minutes: 15,
      },
    };
  }

  // ==========================================
  // EVENTS LIFECYCLE MANAGEMENT
  // ==========================================
  public getEvents(filters?: { status?: string; severity?: string; target_id?: string }): WeatherEvent[] {
    let list = [...this.memoryStore.events];
    if (filters?.status) {
      list = list.filter((e) => e.status === filters.status);
    }
    if (filters?.severity) {
      list = list.filter((e) => e.severity === filters.severity);
    }
    if (filters?.target_id) {
      list = list.filter((e) => e.station_id === filters.target_id || e.vessel_id === filters.target_id);
    }
    return list;
  }

  public getEventById(eventId: string): WeatherEvent | null {
    return this.memoryStore.events.find((e) => e.id === eventId) || null;
  }

  public updateEventStatus(
    eventId: string,
    newStatus: WeatherEvent['status'],
    resolvedBy?: string
  ): WeatherEvent | null {
    const ev = this.memoryStore.events.find((e) => e.id === eventId);
    if (!ev) return null;

    ev.status = newStatus;
    if (newStatus === 'RESOLVED') {
      ev.resolved_at = new Date().toISOString();
      ev.resolved_by = resolvedBy || 'Station Commander';
    }
    this.saveStore();
    this.logAudit('WEATHER_EVENT_STATUS_CHANGED', `Event ${ev.id} status changed to ${newStatus}${resolvedBy ? ` by ${resolvedBy}` : ''}`);
    return ev;
  }

  // ==========================================
  // ALERTS & ACKNOWLEDGEMENTS
  // ==========================================
  public getAlerts(): WeatherAlert[] {
    return this.memoryStore.alerts;
  }

  public acknowledgeAlert(alertId: string, acknowledgedBy: string): WeatherAlert | null {
    const alert = this.memoryStore.alerts.find((a) => a.id === alertId);
    if (!alert) return null;

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledged_time = new Date().toISOString();
    alert.acknowledged_by = acknowledgedBy;
    this.saveStore();
    this.logAudit('ALERT_ACKNOWLEDGED', `Alert ${alert.id} for ${alert.target_name} acknowledged by ${acknowledgedBy}`);
    return alert;
  }

  public escalateAlert(alertId: string): WeatherAlert | null {
    const alert = this.memoryStore.alerts.find((a) => a.id === alertId);
    if (!alert) return null;

    alert.is_escalated = true;
    alert.escalated_time = new Date().toISOString();
    this.saveStore();
    this.logAudit('ALERT_ESCALATED', `Alert ${alert.id} unacknowledged; escalated to ${alert.escalation_contact}`);
    return alert;
  }

  // ==========================================
  // HISTORICAL ARCHIVE & AUDIT LOGS
  // ==========================================
  public getHistory(filters?: { target_id?: string; event_type?: string; severity?: string; limit?: number }) {
    let obs = [...this.memoryStore.observations];
    let evts = [...this.memoryStore.events];

    if (filters?.target_id) {
      obs = obs.filter((o) => o.station_id === filters.target_id || o.vessel_id === filters.target_id);
      evts = evts.filter((e) => e.station_id === filters.target_id || e.vessel_id === filters.target_id);
    }
    if (filters?.severity) {
      evts = evts.filter((e) => e.severity === filters.severity);
    }

    const limit = filters?.limit || 100;
    return {
      observations: obs.slice(0, limit),
      events: evts.slice(0, limit),
      totalObservations: this.memoryStore.observations.length,
      totalEvents: this.memoryStore.events.length,
    };
  }

  public getAuditLogs(): WeatherAuditLog[] {
    return this.memoryStore.auditLogs;
  }

  public getAllEvents(): WeatherEvent[] {
    return this.memoryStore.events || [];
  }
}

export const weatherRepository = new WeatherRepository();
