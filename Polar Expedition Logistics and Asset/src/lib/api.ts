// API client for POLARIS communicating with PostgreSQL backend

let authToken: string | null = null;
let currentActiveRole: string = 'Expedition Manager';
let currentActiveUser: { email: string; name: string } = {
  email: 'manager@ncpor.gov.in',
  name: 'Dr. Rajesh Sharma (Expedition Manager)'
};

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setActiveRole(role: string, name?: string, email?: string) {
  currentActiveRole = role;
  if (name) currentActiveUser.name = name;
  if (email) currentActiveUser.email = email;
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-role': currentActiveRole,
    'x-user-email': currentActiveUser.email,
    'x-user-name': currentActiveUser.name,
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

// -------------------------------------------------------------
// EXPEDITION PLANNING API
// -------------------------------------------------------------

export async function fetchExpeditionDashboardStats() {
  const res = await fetch('/api/expeditions/stats/dashboard', { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch dashboard statistics' }));
    throw new Error(err.error || 'Failed to fetch dashboard statistics');
  }
  return await res.json();
}

export async function fetchExpeditionsApi(params?: Record<string, any>) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
        query.append(key, String(val));
      }
    });
  }
  const url = query.toString() ? `/api/expeditions?${query.toString()}` : '/api/expeditions';
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch expeditions' }));
    throw new Error(err.error || 'Failed to fetch expeditions');
  }
  return await res.json();
}

export async function searchExpeditionsApi(params?: Record<string, any>) {
  const query = new URLSearchParams();
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
        query.append(key, String(val));
      }
    });
  }
  const res = await fetch(`/api/expeditions/search?${query.toString()}`, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to search expeditions' }));
    throw new Error(err.error || 'Failed to search expeditions');
  }
  return await res.json();
}

export async function fetchExpeditionDetailApi(idOrExpId: string | number) {
  const res = await fetch(`/api/expeditions/${encodeURIComponent(idOrExpId)}`, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch expedition detail' }));
    throw new Error(err.error || 'Failed to fetch expedition detail');
  }
  return await res.json();
}

export async function createExpeditionApi(payload: any) {
  const res = await fetch('/api/expeditions', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create expedition');
  }
  return data;
}

export async function updateExpeditionApi(idOrExpId: string | number, updates: any) {
  const res = await fetch(`/api/expeditions/${encodeURIComponent(idOrExpId)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update expedition');
  }
  return data;
}

export async function deleteExpeditionApi(idOrExpId: string | number) {
  const res = await fetch(`/api/expeditions/${encodeURIComponent(idOrExpId)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete expedition');
  }
  return data;
}

export async function fetchExpeditionAuditLogsApi(idOrExpId: string | number) {
  const res = await fetch(`/api/expeditions/${encodeURIComponent(idOrExpId)}/audit-logs`, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch audit logs' }));
    throw new Error(err.error || 'Failed to fetch audit logs');
  }
  return await res.json();
}

export async function fetchMissionsApi() {
  const res = await fetch('/api/missions', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch missions');
  return await res.json();
}

export async function createMissionApi(mission: any) {
  const res = await fetch('/api/missions', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(mission),
  });
  if (!res.ok) throw new Error('Failed to create mission');
  return await res.json();
}

export async function updateMissionApi(code: string, mission: any) {
  const res = await fetch(`/api/missions/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(mission),
  });
  if (!res.ok) throw new Error('Failed to update mission');
  return await res.json();
}

export async function fetchCargoApi() {
  const res = await fetch('/api/cargo', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch cargo');
  return await res.json();
}

export async function updateCargoApi(rfid: string, updates: any) {
  const res = await fetch(`/api/cargo/${encodeURIComponent(rfid)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update cargo');
  return await res.json();
}

export async function fetchInventoryApi() {
  const res = await fetch('/api/inventory', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return await res.json();
}

export async function adjustInventoryStockApi(code: string, delta: number) {
  const res = await fetch(`/api/inventory/${encodeURIComponent(code)}/stock`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) throw new Error('Failed to adjust stock');
  return await res.json();
}

export async function fetchAssetsApi() {
  const res = await fetch('/api/assets', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch assets');
  return await res.json();
}

export async function updateAssetStatusApi(code: string, status: string, vibrationIndex?: number) {
  const res = await fetch(`/api/assets/${encodeURIComponent(code)}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status, vibrationIndex }),
  });
  if (!res.ok) throw new Error('Failed to update asset');
  return await res.json();
}

export async function fetchPersonnelApi() {
  const res = await fetch('/api/personnel', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch personnel');
  return await res.json();
}

export async function fetchEmergenciesApi() {
  const res = await fetch('/api/emergencies', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch emergencies');
  return await res.json();
}

export async function createEmergencyApi(emergency: any) {
  const res = await fetch('/api/emergencies', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(emergency),
  });
  if (!res.ok) throw new Error('Failed to record emergency');
  return await res.json();
}

export async function updateEmergencyApi(code: string, updates: any) {
  const res = await fetch(`/api/emergencies/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update emergency');
  return await res.json();
}

export async function syncUserApi(user: { uid: string; email: string; displayName?: string | null }) {
  const res = await fetch('/api/auth/sync', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error('Failed to sync user');
  return await res.json();
}

// -------------------------------------------------------------
// 12. REPORTING & ANALYTICS API CLIENT
// -------------------------------------------------------------

function buildReportQuery(params?: Record<string, any>): string {
  if (!params || typeof params !== 'object') return '';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
      query.append(key, String(val));
    }
  });
  const qStr = query.toString();
  return qStr ? `?${qStr}` : '';
}

export async function fetchReportingDashboardApi(filters?: any) {
  const res = await fetch(`/api/reports/dashboard${buildReportQuery(filters)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch dashboard KPIs');
  return await res.json();
}

export async function fetchReportingExpeditionsApi(filters?: any) {
  const res = await fetch(`/api/reports/expeditions${buildReportQuery(filters)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch expeditions report');
  return await res.json();
}

export async function fetchReportingPersonnelApi(filters?: any) {
  const res = await fetch(`/api/reports/personnel${buildReportQuery(filters)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch personnel report');
  return await res.json();
}

export async function fetchReportingCargoApi(filters?: any) {
  const res = await fetch(`/api/reports/cargo${buildReportQuery(filters)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch cargo report');
  return await res.json();
}

export async function fetchReportingContainersApi(filters?: any) {
  const res = await fetch(`/api/reports/containers${buildReportQuery(filters)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch containers report');
  return await res.json();
}

export async function fetchReportingShipmentsApi(filters?: any) {
  const res = await fetch(`/api/reports/shipments${buildReportQuery(filters)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch shipments report');
  return await res.json();
}

export async function fetchReportingInventoryApi(filters?: any) {
  const res = await fetch(`/api/reports/inventory${buildReportQuery(filters)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch inventory report');
  return await res.json();
}

export async function fetchReportingAssetsApi(filters?: any) {
  const res = await fetch(`/api/reports/assets${buildReportQuery(filters)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch assets report');
  return await res.json();
}

export async function fetchReportingWeatherApi(filters?: any) {
  const res = await fetch(`/api/reports/weather${buildReportQuery(filters)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch weather report');
  return await res.json();
}

export async function fetchReportingEmergenciesApi(filters?: any) {
  const res = await fetch(`/api/reports/emergencies${buildReportQuery(filters)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch emergency report');
  return await res.json();
}

export async function fetchReportingCommunicationsApi() {
  const res = await fetch('/api/reports/communications', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch communication report');
  return await res.json();
}

export async function fetchReportingExpeditionDeepApi(id: string) {
  const res = await fetch(`/api/reports/expedition/${encodeURIComponent(id)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch expedition deep dossier');
  return await res.json();
}

export async function searchReportingGlobalApi(q: string) {
  const res = await fetch(`/api/reports/search?q=${encodeURIComponent(q)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to perform reporting search');
  return await res.json();
}

export async function fetchReportingKpiDefinitionsApi() {
  const res = await fetch('/api/reports/kpi-definitions', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch KPI definitions');
  return await res.json();
}

export async function fetchReportingAuditLogsApi() {
  const res = await fetch('/api/reports/audit-logs', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch reporting audit logs');
  return await res.json();
}

export function getExportUrl(format: 'csv' | 'excel' | 'pdf', reportType: string, filters?: any): string {
  const query = new URLSearchParams();
  query.append('reportType', reportType);
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        query.append(k, String(v));
      }
    });
  }
  return `/api/reports/export/${format}?${query.toString()}`;
}

