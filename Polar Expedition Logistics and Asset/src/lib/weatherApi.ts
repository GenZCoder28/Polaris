import { 
  WeatherOverviewResponse, 
  WeatherObservation, 
  WeatherForecast, 
  WeatherRule, 
  WeatherEvent, 
  WeatherAlert, 
  WeatherAuditLog,
  StationWeatherConfig
} from '../types.ts';

const BASE_URL = '/api/weather';

export async function fetchWeatherOverviewApi(): Promise<WeatherOverviewResponse> {
  const res = await fetch(`${BASE_URL}/overview`);
  if (!res.ok) throw new Error(`Failed to fetch weather overview: ${res.statusText}`);
  return res.json();
}

export async function syncWeatherNowApi(): Promise<{ message: string; overview: WeatherOverviewResponse }> {
  const res = await fetch(`${BASE_URL}/sync`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger live weather sync: ${res.statusText}`);
  return res.json();
}

export async function fetchStationCurrentWeatherApi(stationId: string): Promise<WeatherObservation> {
  const res = await fetch(`${BASE_URL}/current/stations/${stationId}`);
  if (!res.ok) throw new Error(`Failed to fetch station weather: ${res.statusText}`);
  return res.json();
}

export async function fetchVesselCurrentWeatherApi(vesselId: string): Promise<WeatherObservation> {
  const res = await fetch(`${BASE_URL}/current/vessels/${vesselId}`);
  if (!res.ok) throw new Error(`Failed to fetch vessel weather: ${res.statusText}`);
  return res.json();
}

export async function fetchStationForecastApi(stationId: string): Promise<WeatherForecast> {
  const res = await fetch(`${BASE_URL}/forecast/stations/${stationId}`);
  if (!res.ok) throw new Error(`Failed to fetch station forecast: ${res.statusText}`);
  return res.json();
}

export async function fetchVesselForecastApi(vesselId: string): Promise<WeatherForecast> {
  const res = await fetch(`${BASE_URL}/forecast/vessels/${vesselId}`);
  if (!res.ok) throw new Error(`Failed to fetch vessel forecast: ${res.statusText}`);
  return res.json();
}

export async function fetchWeatherEventsApi(filters?: { status?: string; severity?: string; target_id?: string }): Promise<WeatherEvent[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.severity) params.set('severity', filters.severity);
  if (filters?.target_id) params.set('target_id', filters.target_id);

  const res = await fetch(`${BASE_URL}/events?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch weather events: ${res.statusText}`);
  return res.json();
}

export async function updateWeatherEventStatusApi(
  eventId: string,
  status: WeatherEvent['status'],
  resolvedBy?: string
): Promise<WeatherEvent> {
  const res = await fetch(`${BASE_URL}/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, resolvedBy }),
  });
  if (!res.ok) throw new Error(`Failed to update weather event: ${res.statusText}`);
  return res.json();
}

export async function fetchWeatherAlertsApi(): Promise<WeatherAlert[]> {
  const res = await fetch(`${BASE_URL}/alerts`);
  if (!res.ok) throw new Error(`Failed to fetch weather alerts: ${res.statusText}`);
  return res.json();
}

export async function acknowledgeWeatherAlertApi(alertId: string, acknowledgedBy: string): Promise<WeatherAlert> {
  const res = await fetch(`${BASE_URL}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acknowledgedBy }),
  });
  if (!res.ok) throw new Error(`Failed to acknowledge alert: ${res.statusText}`);
  return res.json();
}

export async function escalateWeatherAlertApi(alertId: string): Promise<WeatherAlert> {
  const res = await fetch(`${BASE_URL}/alerts/${alertId}/escalate`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to escalate alert: ${res.statusText}`);
  return res.json();
}

export async function fetchWeatherRulesApi(): Promise<WeatherRule[]> {
  const res = await fetch(`${BASE_URL}/rules`);
  if (!res.ok) throw new Error(`Failed to fetch weather rules: ${res.statusText}`);
  return res.json();
}

export async function createWeatherRuleApi(rule: Omit<WeatherRule, 'id'>): Promise<WeatherRule> {
  const res = await fetch(`${BASE_URL}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error(`Failed to create weather rule: ${res.statusText}`);
  return res.json();
}

export async function updateWeatherRuleApi(ruleId: string, updates: Partial<WeatherRule>): Promise<WeatherRule> {
  const res = await fetch(`${BASE_URL}/rules/${ruleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update weather rule: ${res.statusText}`);
  return res.json();
}

export async function deleteWeatherRuleApi(ruleId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/rules/${ruleId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete weather rule: ${res.statusText}`);
  return res.json();
}

export async function updateStationRadiusApi(stationId: string, radiusKm: number): Promise<StationWeatherConfig> {
  const res = await fetch(`${BASE_URL}/stations/${stationId}/radius`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ radiusKm }),
  });
  if (!res.ok) throw new Error(`Failed to update station radius: ${res.statusText}`);
  return res.json();
}

export async function fetchWeatherHistoryApi(filters?: { target_id?: string; severity?: string }): Promise<{
  observations: WeatherObservation[];
  events: WeatherEvent[];
  totalObservations: number;
  totalEvents: number;
}> {
  const params = new URLSearchParams();
  if (filters?.target_id) params.set('target_id', filters.target_id);
  if (filters?.severity) params.set('severity', filters.severity);

  const res = await fetch(`${BASE_URL}/history?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch weather history: ${res.statusText}`);
  return res.json();
}

export async function fetchWeatherAuditLogsApi(): Promise<WeatherAuditLog[]> {
  const res = await fetch(`${BASE_URL}/audit-logs`);
  if (!res.ok) throw new Error(`Failed to fetch weather audit logs: ${res.statusText}`);
  return res.json();
}

export async function runWeatherRuleCheckApi(): Promise<{ message: string; results: any }> {
  const res = await fetch(`${BASE_URL}/check`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to run weather risk check: ${res.statusText}`);
  return res.json();
}
