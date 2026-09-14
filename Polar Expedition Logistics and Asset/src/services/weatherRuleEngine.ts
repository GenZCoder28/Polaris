import { 
  WeatherObservation, 
  WeatherForecast, 
  WeatherRule, 
  WeatherEvent, 
  WeatherAlert, 
  WeatherSeverity, 
  WeatherEventType, 
  WeatherRuleOperator, 
  WeatherEnvironmentType,
  Personnel
} from '../types';

/**
 * INITIAL DEFAULT CONFIGURABLE SAFETY RULES
 * Based on approved NCPOR Polar Expedition Safety Manual & Maritime Polar Code.
 */
export const DEFAULT_WEATHER_RULES: WeatherRule[] = [
  // STATION RULES
  {
    id: 'RULE-STN-WIND-WARN',
    name: 'Station High Wind Watch',
    environment_type: 'STATION',
    parameter: 'wind_speed',
    operator: '>=',
    threshold: 50, // km/h
    severity: 'WATCH',
    enabled: true,
    description: 'Wind speeds exceeding 50 km/h require tethered outdoor movement and securing scientific mast arrays.',
  },
  {
    id: 'RULE-STN-WIND-CRIT',
    name: 'Station Severe Storm / Catabatic Gale',
    environment_type: 'STATION',
    parameter: 'wind_speed',
    operator: '>=',
    threshold: 80, // km/h
    severity: 'CRITICAL',
    enabled: true,
    description: 'Catabatic wind storm above 80 km/h triggers immediate station perimeter lockdown and shelter-in-place.',
  },
  {
    id: 'RULE-STN-GUST-CRIT',
    name: 'Station Extreme Wind Gusts',
    environment_type: 'STATION',
    parameter: 'wind_gust',
    operator: '>=',
    threshold: 95, // km/h
    severity: 'CRITICAL',
    enabled: true,
    description: 'Catastrophic wind gusts exceeding 95 km/h capable of damaging antenna radomes and mobile shelters.',
  },
  {
    id: 'RULE-STN-TEMP-WARN',
    name: 'Station Extreme Frostbite Warning',
    environment_type: 'STATION',
    parameter: 'temperature',
    operator: '<=',
    threshold: -35, // Celsius
    severity: 'WARNING',
    enabled: true,
    description: 'Deep freeze below -35°C poses rapid skin frostbite within 5 minutes of exposure.',
  },
  {
    id: 'RULE-STN-TEMP-CRIT',
    name: 'Station Super-Cold Red Alert',
    environment_type: 'STATION',
    parameter: 'temperature',
    operator: '<=',
    threshold: -50, // Celsius
    severity: 'CRITICAL',
    enabled: true,
    description: 'Life-critical deep freeze below -50°C. Diesel fuel gelation hazard and metal embrittlement.',
  },
  {
    id: 'RULE-STN-VIS-CRIT',
    name: 'Station Whiteout / Near-Zero Visibility',
    environment_type: 'STATION',
    parameter: 'visibility',
    operator: '<=',
    threshold: 200, // meters
    severity: 'CRITICAL',
    enabled: true,
    description: 'Whiteout optical disorientation conditions. Total outdoor traverse forbidden.',
  },
  {
    id: 'RULE-STN-COMBINED-BLIZZARD',
    name: 'Polar Whiteout Blizzard (Combined Triple Hazard)',
    environment_type: 'STATION',
    parameter: 'wind_speed',
    operator: '>=',
    threshold: 55,
    severity: 'CRITICAL',
    enabled: true,
    description: 'Combined wind >=55 km/h, visibility <=400m, and temperature <=-25°C forms severe Antarctic Blizzard.',
    combined_conditions: [
      { parameter: 'visibility', operator: '<=', threshold: 400 },
      { parameter: 'temperature', operator: '<=', threshold: -25 },
    ],
  },

  // SHIP / MARINE RULES
  {
    id: 'RULE-SHIP-WAVE-WARN',
    name: 'Vessel Moderate/Rough Sea Swell',
    environment_type: 'SHIP',
    parameter: 'wave_height',
    operator: '>=',
    threshold: 4.0, // meters
    severity: 'WARNING',
    enabled: true,
    description: 'Significant wave height exceeding 4.0m in the Roaring Forties requires container lashing inspections.',
  },
  {
    id: 'RULE-SHIP-WAVE-CRIT',
    name: 'Vessel Dangerous Sea State & Severe Swell',
    environment_type: 'SHIP',
    parameter: 'wave_height',
    operator: '>=',
    threshold: 6.5, // meters
    severity: 'CRITICAL',
    enabled: true,
    description: 'Extreme sea state exceeding 6.5m waves risking cargo shift and green water on weather deck.',
  },
  {
    id: 'RULE-SHIP-WIND-CRIT',
    name: 'Vessel Gale / Storm Force Oceanic Winds',
    environment_type: 'SHIP',
    parameter: 'wind_speed',
    operator: '>=',
    threshold: 75, // km/h
    severity: 'CRITICAL',
    enabled: true,
    description: 'Oceanic gale winds >75 km/h require course deviation and vessel ballast optimization.',
  },
  {
    id: 'RULE-SHIP-FREEZING-SPRAY',
    name: 'Marine Freezing Spray & Structural Icing',
    environment_type: 'SHIP',
    parameter: 'temperature',
    operator: '<=',
    threshold: -2.0,
    severity: 'WARNING',
    enabled: true,
    description: 'Sub-zero temperatures combined with high wind (>45 km/h) cause severe structural superstructure icing.',
    combined_conditions: [
      { parameter: 'wind_speed', operator: '>=', threshold: 45 },
    ],
  },
  {
    id: 'RULE-SHIP-COMBINED-HURRICANE',
    name: 'Southern Ocean Severe Storm Force (Combined)',
    environment_type: 'SHIP',
    parameter: 'wind_speed',
    operator: '>=',
    threshold: 70,
    severity: 'CRITICAL',
    enabled: true,
    description: 'Combined wind >=70 km/h and wave height >=5.5m represents high-risk maritime survival conditions.',
    combined_conditions: [
      { parameter: 'wave_height', operator: '>=', threshold: 5.5 },
    ],
  },
];

export interface RuleEvaluationResult {
  rule: WeatherRule;
  matched: boolean;
  actualValue: number;
  triggeringDescription: string;
}

export interface EngineExecutionOutput {
  targetId: string;
  targetName: string;
  environmentType: WeatherEnvironmentType;
  evaluatedSeverity: WeatherSeverity;
  activeEventsCreated: WeatherEvent[];
  activeEventsUpdated: WeatherEvent[];
  alertsGenerated: WeatherAlert[];
  matchedRules: WeatherRule[];
}

/**
 * WeatherRiskRuleEngine
 * Pure rule-based deterministic evaluation engine.
 * No generative AI or external LLM dependencies.
 */
export class WeatherRiskRuleEngine {
  private rules: WeatherRule[] = [...DEFAULT_WEATHER_RULES];

  public getRules(): WeatherRule[] {
    return this.rules;
  }

  public setRules(rules: WeatherRule[]): void {
    this.rules = rules;
  }

  public addOrUpdateRule(rule: WeatherRule): void {
    const idx = this.rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      this.rules[idx] = { ...this.rules[idx], ...rule, updated_at: new Date().toISOString() };
    } else {
      this.rules.push({ ...rule, created_at: new Date().toISOString() });
    }
  }

  public deleteRule(ruleId: string): boolean {
    const initialLen = this.rules.length;
    this.rules = this.rules.filter((r) => r.id !== ruleId);
    return this.rules.length < initialLen;
  }

  /**
   * Helper to evaluate a mathematical comparison operator
   */
  private evaluateOperator(actual: number, operator: WeatherRuleOperator, threshold: number): boolean {
    switch (operator) {
      case '>': return actual > threshold;
      case '>=': return actual >= threshold;
      case '<': return actual < threshold;
      case '<=': return actual <= threshold;
      case '==': return actual === threshold;
      case '!=': return actual !== threshold;
      default: return false;
    }
  }

  /**
   * Extract parameter value from a weather observation or forecast item
   */
  private getParamValue(data: Partial<WeatherObservation>, param: string): number | null {
    switch ((param || '').toLowerCase()) {
      case 'wind_speed': return data.wind_speed ?? null;
      case 'wind_gust': return data.wind_gust ?? null;
      case 'temperature': return data.temperature ?? null;
      case 'apparent_temperature': return data.apparent_temperature ?? null;
      case 'visibility': return data.visibility ?? null;
      case 'pressure': return data.pressure ?? null;
      case 'wave_height': return data.wave_height ?? null;
      case 'wave_period': return data.wave_period ?? null;
      case 'snow': return data.snow ?? null;
      case 'precipitation': return data.precipitation ?? null;
      default: return null;
    }
  }

  /**
   * Evaluate a single rule against weather parameters
   */
  public testRuleAgainstObservation(rule: WeatherRule, obs: WeatherObservation): RuleEvaluationResult {
    if (!rule.enabled || rule.environment_type !== (obs.station_id ? 'STATION' : 'SHIP')) {
      return { rule, matched: false, actualValue: 0, triggeringDescription: 'Rule disabled or environment mismatch' };
    }

    const primaryVal = this.getParamValue(obs, rule.parameter);
    if (primaryVal === null) {
      return { rule, matched: false, actualValue: 0, triggeringDescription: `Parameter '${rule.parameter}' not available in observation` };
    }

    const primaryPass = this.evaluateOperator(primaryVal, rule.operator, rule.threshold);
    if (!primaryPass) {
      return { rule, matched: false, actualValue: primaryVal, triggeringDescription: 'Primary condition not met' };
    }

    // Check combined conditions if configured
    if (rule.combined_conditions && rule.combined_conditions.length > 0) {
      for (const cond of rule.combined_conditions) {
        const cVal = this.getParamValue(obs, cond.parameter);
        if (cVal === null || !this.evaluateOperator(cVal, cond.operator, cond.threshold)) {
          return {
            rule,
            matched: false,
            actualValue: primaryVal,
            triggeringDescription: `Combined condition failed: ${cond.parameter} ${cond.operator} ${cond.threshold} (actual: ${cVal})`,
          };
        }
      }
    }

    const desc = `${rule.name}: ${rule.parameter} ${rule.operator} ${rule.threshold} (Actual: ${primaryVal}${rule.combined_conditions?.length ? ' + Combined conditions verified' : ''})`;
    return { rule, matched: true, actualValue: primaryVal, triggeringDescription: desc };
  }

  /**
   * Determine the severe event type from a matched rule
   */
  private determineEventType(rule: WeatherRule): WeatherEventType {
    const p = (rule.parameter || '').toLowerCase();
    if (rule.id.includes('BLIZZARD') || p === 'snow') return 'HEAVY_SNOW';
    if (p === 'wind_speed' || p === 'wind_gust') return 'HIGH_WIND';
    if (p === 'temperature' && rule.threshold < 0) return 'EXTREME_COLD';
    if (p === 'visibility') return 'LOW_VISIBILITY';
    if (p === 'wave_height' || p === 'wave_period') return 'MARINE_HAZARD';
    if (rule.id.includes('FREEZING_SPRAY')) return 'FREEZING_SPRAY';
    return 'SEVERE_WEATHER';
  }

  /**
   * Generate Standard Operational Instruction from Approved SOP Templates (NO LLM!)
   */
  private getOperationalInstruction(
    eventType: WeatherEventType, 
    severity: WeatherSeverity, 
    envType: WeatherEnvironmentType
  ): string {
    if (envType === 'STATION') {
      if (severity === 'CRITICAL') {
        return 'SOP-NCPOR-STN-01: Initiate IMMEDIATE STATION LOCKDOWN. Outdoor transit prohibited. Muster all personnel in main accommodation hub. Engage auxiliary generator fuel pre-heaters and secure exterior air dampers.';
      }
      if (severity === 'WARNING') {
        return 'SOP-NCPOR-STN-02: Issue TETHERED TRAVEL DIRECTIVE. All personnel venturing outside must carry VHF radios, GPS beacons, and Dräger survival blankets. Check diesel day-tank fuel levels.';
      }
      return 'SOP-NCPOR-STN-03: Exercise standard polar vigilance. Monitor wind telemetry and secure loose external cargo pallets.';
    } else {
      // SHIP
      if (severity === 'CRITICAL') {
        return 'SOP-NCPOR-MAR-01: HEAVY WEATHER MARITIME PROTOCOL. Secure weather deck access. Re-inspect container twist-locks and lashing wires. Adjust ship heading and speed to reduce roll and pitch.';
      }
      if (severity === 'WARNING') {
        return 'SOP-NCPOR-MAR-02: Check cargo hold bilge wells. Activate hull anti-icing heaters. Post extra watchkeeping officer on bridge.';
      }
      return 'SOP-NCPOR-MAR-03: Regular Southern Ocean voyage watch. Log hourly wave heights and barometer drops.';
    }
  }

  /**
   * Generate Predefined Emergency Alert Message (NO LLM!)
   */
  private generateTemplatedAlertMessage(
    event: WeatherEvent, 
    obs: WeatherObservation, 
    recipient: Personnel
  ): string {
    const isStation = event.environment_type === 'STATION';
    const locationName = event.target_name;

    return `[NCPOR POLAR COMMAND | ${event.severity} WEATHER ALERT]
TO: ${recipient.name} (${recipient.role})
LOCATION: ${locationName}
EVENT: ${event.event_type.replace(/_/g, ' ')} (${event.severity})
DETECTED AT: ${new Date(event.detected_at).toUTCString()}
CURRENT TELEMETRY:
- Temp: ${obs.temperature}°C (Wind Chill: ${obs.apparent_temperature ?? obs.temperature}°C)
- Wind: ${obs.wind_speed} km/h (Gusts: ${obs.wind_gust} km/h)
- Visibility: ${obs.visibility} m | Pressure: ${obs.pressure} hPa
${!isStation && obs.wave_height ? `- Wave Height: ${obs.wave_height}m (${obs.sea_state || 'Rough'})\n` : ''}
TRIGGER CONDITIONS:
${event.triggering_conditions}

MANDATORY DIRECTIVE:
${event.operational_instruction}

ACTION: Acknowledge this alert immediately in the POLARIS terminal or via Iridium satellite radio.`;
  }

  /**
   * Main Rule Engine Execution across an entity (Station or Vessel)
   */
  public evaluateEntity(
    targetId: string,
    targetName: string,
    envType: WeatherEnvironmentType,
    obs: WeatherObservation,
    forecast: WeatherForecast,
    activeEvents: WeatherEvent[],
    personnelList: Personnel[],
    expeditionId: string = 'ISEA-44'
  ): EngineExecutionOutput {
    const applicableRules = this.rules.filter(
      (r) => r.enabled && r.environment_type === envType
    );

    const matchedResults: RuleEvaluationResult[] = [];

    // 1. Evaluate Current Observation against all rules
    for (const rule of applicableRules) {
      const res = this.testRuleAgainstObservation(rule, obs);
      if (res.matched) {
        matchedResults.push(res);
      }
    }

    // 2. Evaluate Forecast for Early Warning (lookahead 6-12 hours)
    let forecastEarlyWarningRule: WeatherRule | null = null;
    let forecastEarlyWarningHour: number | null = null;

    if (forecast && forecast.hourly && forecast.hourly.length > 0) {
      // Look at next 1 to 8 hours
      const nextHours = forecast.hourly.slice(1, 9);
      for (let i = 0; i < nextHours.length; i++) {
        const fh = nextHours[i];
        // Create mock observation for testing
        const pseudoObs: WeatherObservation = {
          ...obs,
          wind_speed: fh.wind_speed,
          wind_gust: fh.wind_gust,
          temperature: fh.temperature,
          apparent_temperature: fh.apparent_temperature,
          visibility: fh.visibility,
          pressure: fh.pressure,
          wave_height: fh.wave_height ?? obs.wave_height,
        };

        for (const rule of applicableRules) {
          if (rule.severity === 'CRITICAL' || rule.severity === 'WARNING') {
            const res = this.testRuleAgainstObservation(rule, pseudoObs);
            if (res.matched) {
              forecastEarlyWarningRule = rule;
              forecastEarlyWarningHour = i + 1;
              break;
            }
          }
        }
        if (forecastEarlyWarningRule) break;
      }
    }

    // Determine highest current severity
    let evaluatedSeverity: WeatherSeverity = 'NORMAL';
    if (matchedResults.some((m) => m.rule.severity === 'CRITICAL')) {
      evaluatedSeverity = 'CRITICAL';
    } else if (matchedResults.some((m) => m.rule.severity === 'WARNING')) {
      evaluatedSeverity = 'WARNING';
    } else if (matchedResults.some((m) => m.rule.severity === 'WATCH')) {
      evaluatedSeverity = 'WATCH';
    } else if (forecastEarlyWarningRule) {
      evaluatedSeverity = forecastEarlyWarningRule.severity === 'CRITICAL' ? 'WARNING' : 'WATCH';
    }

    const eventsCreated: WeatherEvent[] = [];
    const eventsUpdated: WeatherEvent[] = [];
    const alertsGenerated: WeatherAlert[] = [];

    // Deduplication check: Is there already an active event on this target?
    const existingActiveEvent = activeEvents.find(
      (e) => (e.station_id === targetId || e.vessel_id === targetId) && e.status !== 'RESOLVED'
    );

    if (matchedResults.length > 0) {
      // Pick highest priority matched rule
      const primaryMatch = matchedResults.sort((a, b) => {
        const order: Record<WeatherSeverity, number> = { CRITICAL: 3, WARNING: 2, WATCH: 1, NORMAL: 0 };
        return order[b.rule.severity] - order[a.rule.severity];
      })[0];

      const eventType = this.determineEventType(primaryMatch.rule);
      const instruction = this.getOperationalInstruction(eventType, primaryMatch.rule.severity, envType);
      const conditionSummary = matchedResults.map((m) => m.triggeringDescription).join('; ');

      if (existingActiveEvent) {
        // Event already exists: Update and monitor (avoid duplicate spam)
        const updatedEvent: WeatherEvent = {
          ...existingActiveEvent,
          severity: primaryMatch.rule.severity,
          triggering_conditions: conditionSummary,
          status: 'MONITORED',
          operational_instruction: instruction,
        };
        eventsUpdated.push(updatedEvent);
      } else {
        // Create new Weather Event
        const newEvent: WeatherEvent = {
          id: `WEVT-${envType === 'STATION' ? 'STN' : 'SHP'}-${Date.now().toString().slice(-6)}`,
          event_type: eventType,
          severity: primaryMatch.rule.severity,
          environment_type: envType,
          station_id: envType === 'STATION' ? targetId : null,
          vessel_id: envType === 'SHIP' ? targetId : null,
          expedition_id: expeditionId,
          target_name: targetName,
          detected_at: new Date().toISOString(),
          start_time: new Date().toISOString(),
          expected_end_time: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
          latitude: obs.latitude,
          longitude: obs.longitude,
          description: `${primaryMatch.rule.name} detected at ${targetName}. ${primaryMatch.rule.description}`,
          triggering_conditions: conditionSummary,
          status: 'DETECTED',
          is_early_warning: false,
          operational_instruction: instruction,
        };
        eventsCreated.push(newEvent);

        // Emergency Conversion: Only conditions meeting CRITICAL criteria generate automated emergency alerts
        if (newEvent.severity === 'CRITICAL' || newEvent.severity === 'WARNING') {
          // Identify affected personnel
          const relevantPersonnel = personnelList.filter((p) => {
            if (envType === 'STATION') {
              return p.assignedStationId === targetId;
            } else {
              // Ship personnel: assigned to vessel or in transit
              const loc = (p.currentLocation || '').toLowerCase();
              return loc.includes('vessel') || loc.includes('transit');
            }
          });

          // Dispatch alerts to relevant personnel
          for (const person of relevantPersonnel.slice(0, 5)) {
            const message = this.generateTemplatedAlertMessage(newEvent, obs, person);
            const alert: WeatherAlert = {
              id: `WALT-${Date.now().toString().slice(-6)}-${person.id}`,
              event_id: newEvent.id,
              severity: newEvent.severity,
              environment_type: envType,
              target_id: targetId,
              target_name: targetName,
              recipient_id: person.id,
              recipient_role: person.role,
              recipient_name: person.name,
              recipient_contact: person.emergencyContact,
              message,
              channel: 'IN_APP',
              status: 'DELIVERED',
              delivered_time: new Date().toISOString(),
              escalation_contact: 'Station Operations Commander / Central Emergency Team (+91-832-2525515)',
              is_escalated: false,
              created_at: new Date().toISOString(),
            };
            alertsGenerated.push(alert);
          }
        }
      }
    } else if (forecastEarlyWarningRule && forecastEarlyWarningHour !== null) {
      // Forecast Early Warning
      if (!existingActiveEvent) {
        const earlyEvent: WeatherEvent = {
          id: `WEVT-EARLY-${Date.now().toString().slice(-6)}`,
          event_type: this.determineEventType(forecastEarlyWarningRule),
          severity: 'WATCH',
          environment_type: envType,
          station_id: envType === 'STATION' ? targetId : null,
          vessel_id: envType === 'SHIP' ? targetId : null,
          expedition_id: expeditionId,
          target_name: targetName,
          detected_at: new Date().toISOString(),
          start_time: new Date(Date.now() + forecastEarlyWarningHour * 3600 * 1000).toISOString(),
          expected_end_time: new Date(Date.now() + (forecastEarlyWarningHour + 12) * 3600 * 1000).toISOString(),
          latitude: obs.latitude,
          longitude: obs.longitude,
          description: `EARLY WEATHER WARNING: Severe weather is forecast near ${targetName} within the next ${forecastEarlyWarningHour} hours (${forecastEarlyWarningRule.name}).`,
          triggering_conditions: `Numerical forecast model indicates parameter '${forecastEarlyWarningRule.parameter}' will breach threshold in +${forecastEarlyWarningHour}h`,
          status: 'DETECTED',
          is_early_warning: true,
          operational_instruction: `Prepare ${targetName} infrastructure before arrival of storm front in ${forecastEarlyWarningHour} hours. Secure outdoor gear and check backup generators.`,
        };
        eventsCreated.push(earlyEvent);
      }
    } else if (existingActiveEvent && existingActiveEvent.status !== 'RESOLVED') {
      // Weather conditions have normalized: mark CONDITIONS_IMPROVE or RESOLVE
      eventsUpdated.push({
        ...existingActiveEvent,
        status: 'CONDITIONS_IMPROVE',
        operational_instruction: 'Telemetry indicates ambient conditions have returned beneath warning thresholds. Stand down alert once station inspection is concluded.',
      });
    }

    return {
      targetId,
      targetName,
      environmentType: envType,
      evaluatedSeverity,
      activeEventsCreated: eventsCreated,
      activeEventsUpdated: eventsUpdated,
      alertsGenerated,
      matchedRules: matchedResults.map((m) => m.rule),
    };
  }
}

export const weatherRuleEngine = new WeatherRiskRuleEngine();
