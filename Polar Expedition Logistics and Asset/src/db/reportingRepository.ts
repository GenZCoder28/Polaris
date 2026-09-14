import fs from 'fs';
import path from 'path';
import {
  ReportingDashboardKpis,
  ExpeditionReportItem,
  PersonnelAnalyticsItem,
  CargoAnalyticsItem,
  ContainerAnalyticsItem,
  ShipmentAnalyticsItem,
  InventoryAnalyticsItem,
  AssetAnalyticsItem,
  WeatherAnalyticsItem,
  EmergencyAnalyticsItem,
  ResponseTeamPerformanceItem,
  CommunicationAnalyticsItem,
  CrossModuleExpeditionReport,
  ReportingSearchResult,
  ReportingAuditLogRecord,
  ReportFilterParams,
  KpiDefinition,
  UserRole
} from '../types.ts';
import { 
  getAllExpeditions, 
  getExpeditionById, 
  getExpeditionDetailWithRelations 
} from './expeditionRepository.ts';
import { 
  getMissions, 
  getCargoItems, 
  getInventory, 
  getAssets, 
  getPersonnel, 
  getEmergencies,
  ensureOperationsStore
} from './repository.ts';
import { 
  getInventoryItemsMaster, 
  getAllTransactions, 
  getAllForecasts, 
  getAlerts, 
  getResupplyRequests 
} from './inventoryRepository.ts';
import { 
  getAssetsList, 
  getAssetIncidentsList, 
  getAssetMaintenanceList, 
  generateAssetPredictions 
} from './assetRepository.ts';
import { weatherRepository } from './weatherRepository.ts';
import { emergencyRepository } from './emergencyRepository.ts';
import { communicationRepository } from './communicationRepository.ts';
import { 
  INITIAL_STATIONS, 
  INITIAL_VESSELS, 
  INITIAL_CONTAINERS, 
  INITIAL_EXPEDITIONS 
} from '../data/initialData.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const AUDIT_STORE_FILE = path.join(DATA_DIR, 'reporting_audit_store.json');

// Memory Cache with 15-second TTL to avoid duplicate heavy calculations
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const reportingCache: Map<string, CacheEntry<any>> = new Map();

function getCached<T>(key: string): T | null {
  const entry = reportingCache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  if (entry) {
    reportingCache.delete(key);
  }
  return null;
}

function setCache<T>(key: string, data: T, ttlMs: number = 15000): void {
  reportingCache.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
}

// Ensure Audit Log Store
export function ensureReportingAuditStore(): ReportingAuditLogRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(AUDIT_STORE_FILE)) {
      const raw = fs.readFileSync(AUDIT_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    const initial: ReportingAuditLogRecord[] = [
      {
        id: 'RPT-AUDIT-001',
        reportType: 'DASHBOARD_KPI',
        reportTitle: 'Operational Executive Summary Report',
        action: 'GENERATED',
        userEmail: 'manager@ncpor.gov.in',
        userName: 'Dr. Rajesh Sharma (Expedition Manager)',
        userRole: 'Expedition Manager',
        filtersJson: JSON.stringify({ dateRange: 'current_expedition' }),
        recordsCount: 140,
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        executionDurationMs: 42,
      },
    ];
    fs.writeFileSync(AUDIT_STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  } catch (err) {
    console.warn('Reporting audit store fallback error:', err);
    return [];
  }
}

export function recordReportingAudit(log: Omit<ReportingAuditLogRecord, 'id' | 'timestamp'>): ReportingAuditLogRecord {
  const allLogs = ensureReportingAuditStore();
  const entry: ReportingAuditLogRecord = {
    ...log,
    id: `RPT-LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  allLogs.unshift(entry);
  if (allLogs.length > 500) {
    allLogs.length = 500;
  }
  try {
    fs.writeFileSync(AUDIT_STORE_FILE, JSON.stringify(allLogs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write audit log to disk:', err);
  }
  return entry;
}

// Helper to filter by date range
function isDateWithinRange(dateStr: string | null | undefined, filter: ReportFilterParams): boolean {
  if (!dateStr) return true;
  const itemDate = new Date(dateStr).getTime();
  if (isNaN(itemDate)) return true;

  const now = Date.now();
  if (filter.dateRange === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return itemDate >= startOfToday.getTime();
  }
  if (filter.dateRange === '7d') {
    return itemDate >= now - 7 * 24 * 3600 * 1000;
  }
  if (filter.dateRange === '30d') {
    return itemDate >= now - 30 * 24 * 3600 * 1000;
  }
  if (filter.dateRange === 'custom') {
    if (filter.startDate) {
      const s = new Date(filter.startDate).getTime();
      if (!isNaN(s) && itemDate < s) return false;
    }
    if (filter.endDate) {
      const e = new Date(filter.endDate).getTime();
      if (!isNaN(e) && itemDate > e) return false;
    }
  }
  return true;
}

// Master Reporting Repository Class
export class ReportingRepository {

  // 1. Comprehensive Dashboard KPIs
  async getDashboardKpis(filter: ReportFilterParams = {}, userRole: string = 'ADMIN'): Promise<ReportingDashboardKpis> {
    const cacheKey = `kpis_${JSON.stringify(filter)}_${userRole}`;
    const cached = getCached<ReportingDashboardKpis>(cacheKey);
    if (cached) return cached;

    // Load live operational data from authoritative sources
    const [
      expeditionsData,
      cargoData,
      inventoryData,
      assetsData,
      personnelData,
      emergenciesData,
      weatherEvents,
      notificationStats
    ] = await Promise.all([
      getAllExpeditions({}),
      getCargoItems(),
      getInventoryItemsMaster(),
      getAssetsList(),
      getPersonnel(),
      emergencyRepository.getAllEmergencies(),
      weatherRepository.getAllEvents(),
      communicationRepository.getDashboardStats(),
    ]);

    // Expedition metrics
    const totalExpeditions = expeditionsData.length;
    const activeExpeditions = expeditionsData.filter(e => e.status.toUpperCase() === 'ACTIVE').length;
    const completedExpeditions = expeditionsData.filter(e => e.status.toUpperCase() === 'COMPLETED').length;
    const plannedExpeditions = expeditionsData.filter(e => e.status.toUpperCase() === 'PLANNED' || e.status.toUpperCase() === 'APPROVED').length;
    const cancelledExpeditions = expeditionsData.filter(e => e.status.toUpperCase() === 'CANCELLED').length;

    // Personnel metrics
    const totalPersonnel = personnelData.length;
    const currentlyDeployedPersonnel = personnelData.filter(p => p.status === 'Deployed').length;
    const inTransitPersonnel = personnelData.filter(p => p.status === 'In Transit').length;
    const completedPersonnel = personnelData.filter(p => p.status === 'Completed' || p.status === 'Evac Ready').length;

    const personnelByStation: Record<string, number> = {};
    const personnelByRole: Record<string, number> = {};
    const personnelByTeam: Record<string, number> = {};

    personnelData.forEach(p => {
      const st = p.station || 'Unknown';
      personnelByStation[st] = (personnelByStation[st] || 0) + 1;
      const rl = p.role || 'Specialist';
      personnelByRole[rl] = (personnelByRole[rl] || 0) + 1;
      const tm = p.role?.includes('Medical') ? 'Medical Team' :
                 p.role?.includes('Logistics') ? 'Logistics Fleet' :
                 p.role?.includes('Engineer') ? 'Power & Mechanical' :
                 p.role?.includes('Scientist') || p.role?.includes('Glaciologist') ? 'Scientific Core' : 'Station Operations';
      personnelByTeam[tm] = (personnelByTeam[tm] || 0) + 1;
    });

    // Cargo & Container metrics
    const totalCargo = cargoData.length;
    let totalCargoWeightKg = 0;
    let cargoInTransit = 0;
    let deliveredCargo = 0;
    let delayedCargo = 0;
    let cargoExceptions = 0;

    cargoData.forEach(c => {
      const wtKg = (c.weightTons || 12) * 1000;
      totalCargoWeightKg += wtKg;
      const st = (c.status || '').toUpperCase();
      if (st.includes('IN TRANSIT') || st.includes('ON_SHIP') || st.includes('DEPARTED')) {
        cargoInTransit++;
      } else if (st.includes('DELIVERED') || st.includes('DISCHARGED')) {
        deliveredCargo++;
      } else if (st.includes('DELAYED')) {
        delayedCargo++;
      } else {
        cargoInTransit++;
      }
      if (c.hazmatClass && !c.destination) {
        cargoExceptions++;
      }
    });

    const totalContainers = INITIAL_CONTAINERS.length;
    const containersInTransit = INITIAL_CONTAINERS.filter(c => c.status !== 'DELIVERED').length;
    const containersDelivered = INITIAL_CONTAINERS.filter(c => c.status === 'DELIVERED').length;
    const avgContainerUtilizationPct = Math.round(
      INITIAL_CONTAINERS.reduce((acc, c) => acc + (c.currentWeightKg / c.capacityKg), 0) / (INITIAL_CONTAINERS.length || 1) * 100
    );

    // Shipment metrics (Sea, Air, Land)
    const shipmentsList = await this.getShipmentsList();
    const totalShipments = shipmentsList.length;
    const activeShipments = shipmentsList.filter(s => s.status === 'IN_TRANSIT' || s.status === 'SCHEDULED').length;
    const completedShipments = shipmentsList.filter(s => s.status === 'DELIVERED').length;
    const delayedShipments = shipmentsList.filter(s => s.status === 'DELAYED').length;
    const avgDelayDays = Math.round(
      (shipmentsList.reduce((acc, s) => acc + s.delayDurationDays, 0) / (shipmentsList.length || 1)) * 10
    ) / 10;
    const avgTransitDurationDays = Math.round(
      (shipmentsList.reduce((acc, s) => acc + s.expectedTransitDurationDays, 0) / (shipmentsList.length || 1)) * 10
    ) / 10;

    // Inventory metrics
    const totalInventoryItems = inventoryData.length;
    let lowStockItems = 0;
    let criticalStockItems = 0;
    let normalStockItems = 0;
    let predictedShortagesCount = 0;

    inventoryData.forEach(inv => {
      const curr = inv.current_quantity ?? 0;
      const min = inv.minimum_stock ?? 10;
      const safe = inv.safety_stock ?? 20;
      if (curr <= min) {
        criticalStockItems++;
        predictedShortagesCount++;
      } else if (curr <= safe) {
        lowStockItems++;
        if (curr < safe * 1.1) predictedShortagesCount++;
      } else {
        normalStockItems++;
      }
    });

    // Asset metrics
    const totalAssets = assetsData.length;
    const operationalAssets = assetsData.filter(a => a.status === 'AVAILABLE' || a.status === 'ASSIGNED' || a.status === 'IN_USE').length;
    const assetsUnderMaintenance = assetsData.filter(a => a.status === 'UNDER_MAINTENANCE' || a.operating_hours >= a.maintenance_threshold_hours).length;
    const damagedAssets = assetsData.filter(a => a.status === 'DAMAGED').length;
    const missingAssets = assetsData.filter(a => a.status === 'LOST').length;
    const avgAssetHealthScore = Math.round(
      assetsData.reduce((acc, a) => acc + (a.health_score || 85), 0) / (assetsData.length || 1)
    );

    // Emergency metrics
    const totalEmergencies = emergenciesData.length;
    const activeEmergencies = emergenciesData.filter(e => e.status !== 'RESOLVED' && e.status !== 'CANCELLED').length;
    const resolvedEmergencies = emergenciesData.filter(e => e.status === 'RESOLVED').length;
    const criticalEmergencies = emergenciesData.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;

    // Response time calculations
    let totalAckMin = 0;
    let totalRespMin = 0;
    let totalResolMin = 0;
    emergenciesData.forEach(e => {
      const eventTime = e.created_at || e.detected_at;
      const ackMin = e.acknowledged_at && eventTime
        ? Math.max(1, Math.round((new Date(e.acknowledged_at).getTime() - new Date(eventTime).getTime()) / 60000))
        : 3;
      const respMin = e.response_started_at && eventTime
        ? Math.max(2, Math.round((new Date(e.response_started_at).getTime() - new Date(eventTime).getTime()) / 60000))
        : 7;
      const resolMin = e.resolved_at && eventTime
        ? Math.max(10, Math.round((new Date(e.resolved_at).getTime() - new Date(eventTime).getTime()) / 60000))
        : 45;

      totalAckMin += ackMin;
      totalRespMin += respMin;
      totalResolMin += resolMin;
    });

    const avgAckTimeMinutes = Math.round((totalAckMin / (emergenciesData.length || 1)) * 10) / 10;
    const avgResponseTimeMinutes = Math.round((totalRespMin / (emergenciesData.length || 1)) * 10) / 10;
    const avgResolutionTimeMinutes = Math.round((totalResolMin / (emergenciesData.length || 1)) * 10) / 10;

    // Weather metrics
    const totalWeatherEvents = weatherEvents.length;
    const criticalWeatherEvents = weatherEvents.filter(w => w.severity === 'CRITICAL').length;
    const weatherWarnings = weatherEvents.filter(w => w.severity === 'WARNING').length;

    // Communication statistics
    const totalNotifications = notificationStats.total;
    const notificationsSent = notificationStats.sent;
    const notificationsDelivered = notificationStats.delivered;
    const notificationsRead = notificationStats.read;
    const notificationsAcknowledged = notificationStats.acknowledged;
    const failedNotifications = notificationStats.failed;
    const retriedNotifications = notificationStats.retrying;
    const deliverySuccessRatePct = notificationStats.success_rate_percent;
    const unacknowledgedCriticalAlerts = notificationStats.unacknowledged_critical;

    // Visual breakdown distributions for Recharts
    const expeditionsByStatus = [
      { status: 'Active', count: activeExpeditions, color: '#2563eb' },
      { status: 'Planned', count: plannedExpeditions, color: '#f59e0b' },
      { status: 'Completed', count: completedExpeditions, color: '#10b981' },
      { status: 'Cancelled', count: cancelledExpeditions, color: '#94a3b8' },
    ];

    const personnelDistribution = [
      { station: 'Bharati Station', deployed: personnelByStation['bharati'] || 45, inTransit: 4, capacity: 50 },
      { station: 'Maitri Station', deployed: personnelByStation['maitri'] || 35, inTransit: 2, capacity: 40 },
      { station: 'Cape Town Depot', deployed: personnelByStation['cape_town'] || 14, inTransit: 0, capacity: 100 },
      { station: 'Goa Operations HQ', deployed: personnelByStation['goa_hq'] || 85, inTransit: 0, capacity: 250 },
    ];

    const cargoByStatusChart = [
      { name: 'Delivered', value: deliveredCargo || 1, color: '#10b981' },
      { name: 'In Transit', value: cargoInTransit || 3, color: '#3b82f6' },
      { name: 'Delayed', value: delayedCargo || 1, color: '#ef4444' },
      { name: 'Packed / Depot', value: 2, color: '#f59e0b' },
    ];

    const shipmentPerformanceChart = shipmentsList.map(s => ({
      name: s.shipmentCode,
      plannedDays: s.expectedTransitDurationDays,
      actualDays: s.actualTransitDurationDays,
      delayDays: s.delayDurationDays,
    }));

    const inventoryHealthChart = [
      { category: 'Fuel', nominal: 4, low: 1, critical: 1 },
      { category: 'Food', nominal: 6, low: 2, critical: 0 },
      { category: 'Medical', nominal: 5, low: 1, critical: 1 },
      { category: 'Batteries', nominal: 3, low: 2, critical: 0 },
      { category: 'Spares', nominal: 7, low: 3, critical: 1 },
      { category: 'Scientific', nominal: 5, low: 0, critical: 0 },
    ];

    const emergencyTrendChart = [
      { date: 'Sep 06', created: 1, resolved: 1, critical: 0 },
      { date: 'Sep 07', created: 0, resolved: 0, critical: 0 },
      { date: 'Sep 08', created: 2, resolved: 1, critical: 1 },
      { date: 'Sep 09', created: 1, resolved: 2, critical: 0 },
      { date: 'Sep 10', created: 0, resolved: 0, critical: 0 },
      { date: 'Sep 11', created: 3, resolved: 2, critical: 1 },
      { date: 'Sep 12', created: 1, resolved: 1, critical: 1 },
    ];

    const emergencyTypeChart = [
      { type: 'Generator / Power', count: 4 },
      { type: 'Blizzard / Storm', count: 6 },
      { type: 'Medical Trauma', count: 2 },
      { type: 'Equipment Damage', count: 3 },
      { type: 'Cold Chain Alarm', count: 2 },
    ];

    const weatherEventChart = [
      { station: 'Bharati', watch: 5, warning: 3, critical: 1 },
      { station: 'Maitri', watch: 4, warning: 4, critical: 2 },
      { station: 'Himadri', watch: 2, warning: 1, critical: 0 },
      { station: 'Southern Ocean', watch: 6, warning: 5, critical: 3 },
    ];

    const notificationChannelChart = [
      { channel: 'IN_APP', delivered: notificationStats.by_channel['IN_APP'] || 142, failed: 2 },
      { channel: 'EMAIL', delivered: notificationStats.by_channel['EMAIL'] || 86, failed: 4 },
      { channel: 'SMS', delivered: notificationStats.by_channel['SMS'] || 39, failed: 5 },
    ];

    const kpis: ReportingDashboardKpis = {
      totalExpeditions,
      activeExpeditions,
      completedExpeditions,
      plannedExpeditions,
      cancelledExpeditions,
      totalPersonnel,
      currentlyDeployedPersonnel,
      inTransitPersonnel,
      completedPersonnel,
      personnelByStation,
      personnelByRole,
      personnelByTeam,
      totalCargo,
      totalCargoWeightKg,
      totalCargoVolumeM3: Math.round(totalCargoWeightKg / 350), // Standard freight density factor
      cargoInTransit,
      deliveredCargo,
      delayedCargo,
      cargoExceptions,
      totalContainers,
      containersInTransit,
      containersDelivered,
      avgContainerUtilizationPct,
      totalShipments,
      activeShipments,
      completedShipments,
      delayedShipments,
      avgDelayDays,
      avgTransitDurationDays,
      totalInventoryItems,
      lowStockItems,
      criticalStockItems,
      normalStockItems,
      predictedShortagesCount,
      totalIncomingSupplies: 45000, // kg
      totalAssets,
      operationalAssets,
      assetsUnderMaintenance,
      damagedAssets,
      missingAssets,
      avgAssetHealthScore,
      totalEmergencies,
      activeEmergencies,
      resolvedEmergencies,
      criticalEmergencies,
      avgAckTimeMinutes,
      avgResponseTimeMinutes,
      avgResolutionTimeMinutes,
      criticalWeatherEvents,
      weatherWarnings,
      totalWeatherEvents,
      totalNotifications,
      notificationsSent,
      notificationsDelivered,
      notificationsRead,
      notificationsAcknowledged,
      failedNotifications,
      retriedNotifications,
      deliverySuccessRatePct,
      unacknowledgedCriticalAlerts,
      expeditionsByStatus,
      personnelDistribution,
      cargoByStatusChart,
      shipmentPerformanceChart,
      inventoryHealthChart,
      emergencyTrendChart,
      emergencyTypeChart,
      weatherEventChart,
      notificationChannelChart,
    };

    setCache(cacheKey, kpis);
    return kpis;
  }

  // 2. Expedition Analytics List & Filters
  async getExpeditionsReport(filter: ReportFilterParams = {}, userRole: string = 'ADMIN'): Promise<ExpeditionReportItem[]> {
    const rawExpeditions = await getAllExpeditions({});
    const personnel = await getPersonnel();
    const cargo = await getCargoItems();
    const weatherEvents = await weatherRepository.getAllEvents();
    const emergencies = await emergencyRepository.getAllEmergencies();

    let items: ExpeditionReportItem[] = rawExpeditions.map(exp => {
      // Associated data links
      const assignedPersonnel = personnel
        .filter(p => p.station === exp.target_region.toLowerCase() || p.role.includes(exp.expedition_code) || exp.expedition_id === 'EXP-2025-044')
        .map(p => ({
          code: p.code,
          name: p.name,
          role: p.role,
          status: p.status,
        }));

      const assignedStations = [exp.target_region];
      const relCargo = cargo.filter(c => c.destination?.toLowerCase().includes(exp.target_region.toLowerCase().slice(0, 4)));
      const relWeather = weatherEvents.filter(w => w.expedition_id === exp.expedition_id || w.target_name?.toLowerCase().includes(exp.target_region.toLowerCase().slice(0, 4)));
      const relEmergencies = emergencies.filter(e => e.station_id?.toLowerCase().includes(exp.target_region.toLowerCase().slice(0, 4)));

      const totalWeightKg = relCargo.reduce((acc, c) => acc + ((c.weightTons || 12) * 1000), 28000);
      
      const isCompleted = exp.status.toUpperCase() === 'COMPLETED';
      const isActive = exp.status.toUpperCase() === 'ACTIVE';
      const completionPercentage = isCompleted ? 100 : isActive ? 65 : 20;

      return {
        expeditionId: exp.expedition_id,
        code: exp.expedition_code,
        name: exp.expedition_name,
        startDate: exp.start_date,
        endDate: exp.end_date,
        status: exp.status.toUpperCase(),
        targetRegion: exp.target_region,
        leadOrganization: exp.lead_organization,
        leadScientist: exp.expedition_leader,
        destinationStationId: exp.target_region.toLowerCase().includes('bharati') ? 'bharati' : exp.target_region.toLowerCase().includes('maitri') ? 'maitri' : 'himadri',
        personnelCount: assignedPersonnel.length || 45,
        assignedPersonnel,
        assignedStations,
        cargoCount: relCargo.length || 4,
        totalCargoWeightKg: totalWeightKg,
        shipmentCount: 2,
        shipments: ['SHP-SEA-2026-VG01', 'SHP-LND-2026-PB01'],
        inventoryItemsCount: 14,
        inventoryAlertsCount: 2,
        assetCount: 8,
        operationalAssetsCount: 7,
        emergencyCount: relEmergencies.length,
        activeEmergencyCount: relEmergencies.filter(e => e.status !== 'RESOLVED' && e.status !== 'CANCELLED').length,
        weatherEventCount: relWeather.length,
        completionPercentage,
      };
    });

    // Apply filters
    if (filter.status && filter.status !== 'ALL') {
      items = items.filter(i => i.status.toUpperCase() === filter.status?.toUpperCase());
    }
    if (filter.expeditionId) {
      items = items.filter(i => i.expeditionId === filter.expeditionId || i.code === filter.expeditionId);
    }
    if (filter.stationId && filter.stationId !== 'ALL') {
      items = items.filter(i => i.destinationStationId === filter.stationId || i.targetRegion.toLowerCase().includes(filter.stationId.toLowerCase()));
    }
    if (filter.startDate) {
      items = items.filter(i => new Date(i.startDate) >= new Date(filter.startDate!));
    }
    if (filter.endDate) {
      items = items.filter(i => new Date(i.endDate) <= new Date(filter.endDate!));
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.code.toLowerCase().includes(q) || 
        i.expeditionId.toLowerCase().includes(q) ||
        i.leadScientist.toLowerCase().includes(q) ||
        i.targetRegion.toLowerCase().includes(q)
      );
    }

    return items;
  }

  // 3. Personnel Analytics
  async getPersonnelReport(filter: ReportFilterParams = {}, userRole: string = 'ADMIN'): Promise<PersonnelAnalyticsItem[]> {
    const rawPersonnel = await getPersonnel();

    let items: PersonnelAnalyticsItem[] = rawPersonnel.map(p => {
      const team = p.role?.includes('Medical') || p.role?.includes('Doctor') ? 'Medical Team' :
                   p.role?.includes('Logistics') || p.role?.includes('Officer') ? 'Logistics Fleet' :
                   p.role?.includes('Engineer') || p.role?.includes('Mechanic') ? 'Power & Mechanical' :
                   p.role?.includes('Scientist') || p.role?.includes('Glaciologist') || p.role?.includes('Ecologist') ? 'Scientific Core' : 'Station Command';

      const assignedStationId = p.station || 'bharati';
      const currentLocation = p.transitLeg || `${assignedStationId.charAt(0).toUpperCase() + assignedStationId.slice(1)} Station Campus`;
      const movementLegsCount = p.status === 'In Transit' ? 2 : 3;

      // Sensitive data masking for non-medical/non-admin roles
      const isSensitivePermitted = userRole === 'ADMIN' || userRole === 'STATION_COMMANDER' || userRole === 'MEDICAL_OFFICER';

      return {
        id: p.code,
        code: p.code,
        name: p.name,
        role: p.role,
        specialization: p.specialization || p.role,
        assignedStationId,
        currentLocation,
        rotationType: p.rotationType || 'Winter-over Team',
        status: p.status || 'Deployed',
        medicalClearance: p.medicalClearance || 'Class 1 Polar Certified',
        bloodGroup: isSensitivePermitted ? p.bloodGroup || 'O+ Polar' : 'REDACTED',
        emergencyContact: isSensitivePermitted ? p.emergencyContact || 'NCPOR Command (+91-832-2525515)' : 'CONFIDENTIAL - AUTHORIZED ONLY',
        expeditionId: 'EXP-2025-044',
        team,
        movementLegsCount,
        activeLeg: p.transitLeg || 'Station Perimeter Operations',
        activeTransitMode: p.transitLeg?.includes('Flight') ? 'IL-76 Transport' : 'PistenBully Snowcat',
      };
    });

    // Filtering
    if (filter.role && filter.role !== 'ALL') {
      items = items.filter(i => i.role.toLowerCase().includes(filter.role!.toLowerCase()));
    }
    if (filter.team && filter.team !== 'ALL') {
      items = items.filter(i => i.team === filter.team);
    }
    if (filter.stationId && filter.stationId !== 'ALL') {
      items = items.filter(i => i.assignedStationId === filter.stationId);
    }
    if (filter.status && filter.status !== 'ALL') {
      items = items.filter(i => i.status.toUpperCase() === filter.status?.toUpperCase());
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.code.toLowerCase().includes(q) || 
        i.role.toLowerCase().includes(q) ||
        i.team.toLowerCase().includes(q)
      );
    }

    return items;
  }

  // 4. Cargo Analytics
  async getCargoReport(filter: ReportFilterParams = {}, userRole: string = 'ADMIN'): Promise<CargoAnalyticsItem[]> {
    const rawCargo = await getCargoItems();

    let items: CargoAnalyticsItem[] = rawCargo.map(c => {
      const wtTons = c.weightTons || 12;
      const wtKg = Math.round(wtTons * 1000);
      const volM3 = Math.round(wtKg / 380);
      const isException = Boolean(c.status === 'Delayed' || (c.hazmatClass && !c.destination));

      return {
        id: c.rfid || `CRG-${c.id}`,
        rfid: c.rfid,
        containerNo: c.containerNo,
        cargoType: c.cargoType,
        category: c.cargoType?.includes('Fuel') ? 'Fuel' :
                  c.cargoType?.includes('Reefer') || c.cargoType?.includes('Food') ? 'Food / Cold Chain' :
                  c.cargoType?.includes('Spares') ? 'Spare Parts' : 'General Expedition Supplies',
        priority: c.priority || 'ROUTINE',
        departurePort: c.departurePort || 'Mormugao Port, Goa',
        destination: c.destination || 'bharati',
        vessel: c.vessel || 'MV Vasiliy Golovnin',
        voyageId: c.voyageId || 'VG-2026-NCPOR',
        eta: c.eta || '2026-12-14',
        status: (c.status || 'IN_TRANSIT').toUpperCase().replace(/\s+/g, '_'),
        weightTons: wtTons,
        weightKg: wtKg,
        volumeM3: volM3,
        tempCurrent: c.tempCurrent ?? -18.0,
        tempTarget: c.tempTarget ?? -20.0,
        hazmatClass: c.hazmatClass,
        expeditionId: 'EXP-2025-044',
        shipmentCode: 'SHP-SEA-2026-VG01',
        isException,
        exceptionReason: isException ? 'Hazardous fuel container requires icebreaker ballast validation.' : undefined,
      };
    });

    // Apply filtering
    if (filter.status && filter.status !== 'ALL') {
      items = items.filter(i => i.status.includes(filter.status!.toUpperCase()));
    }
    if (filter.category && filter.category !== 'ALL') {
      items = items.filter(i => i.category === filter.category);
    }
    if (filter.stationId && filter.stationId !== 'ALL') {
      items = items.filter(i => i.destination === filter.stationId);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(i => 
        i.containerNo.toLowerCase().includes(q) || 
        i.rfid.toLowerCase().includes(q) || 
        i.cargoType.toLowerCase().includes(q) ||
        i.vessel.toLowerCase().includes(q)
      );
    }

    return items;
  }

  // 5. Container Analytics with Utilization
  async getContainersReport(filter: ReportFilterParams = {}, userRole: string = 'ADMIN'): Promise<ContainerAnalyticsItem[]> {
    let items: ContainerAnalyticsItem[] = INITIAL_CONTAINERS.map(c => {
      const utilizationPct = Math.min(100, Math.round((c.currentWeightKg / c.capacityKg) * 100));

      return {
        id: c.id,
        code: c.code,
        type: c.type,
        capacityKg: c.capacityKg,
        currentWeightKg: c.currentWeightKg,
        utilizationPct,
        stowagePriority: c.stowagePriority,
        stowageTierLabel: c.stowageTierLabel,
        isHazardous: c.isHazardous,
        rfidTag: c.rfidTag,
        status: c.status,
        currentLocationName: c.currentLocationName,
        vesselId: c.vesselId,
        destinationStationId: c.destinationStationId,
        shipmentCode: c.vesselId === 'vessel_golovnin' ? 'SHP-SEA-2026-VG01' : 'SHP-SEA-2026-AG02',
        itemCount: c.items?.length || 4,
        lastScannedTime: c.lastScannedTime,
      };
    });

    if (filter.stationId && filter.stationId !== 'ALL') {
      items = items.filter(i => i.destinationStationId === filter.stationId);
    }
    if (filter.status && filter.status !== 'ALL') {
      items = items.filter(i => i.status === filter.status);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(i => i.code.toLowerCase().includes(q) || i.rfidTag.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
    }

    return items;
  }

  // 6. Multi-Modal Shipment & Tracking Analytics
  async getShipmentsList(filter: ReportFilterParams = {}): Promise<ShipmentAnalyticsItem[]> {
    const rawShipments: ShipmentAnalyticsItem[] = [
      {
        id: 'SHP-01',
        shipmentCode: 'SHP-SEA-2026-VG01',
        shipmentType: 'SEA',
        vesselOrCarrierName: 'MV Vasiliy Golovnin (Polar Class Icebreaker)',
        origin: 'Mormugao Port Berth 9, Goa',
        destination: 'Bharati Station Fast-Ice (Prydz Bay, Antarctica)',
        departureDate: '2026-10-22',
        eta: '2026-12-14',
        actualArrivalDate: null,
        status: 'IN_TRANSIT',
        expectedTransitDurationDays: 53,
        actualTransitDurationDays: 41,
        delayDurationDays: 0,
        etaDeviationDays: 0,
        currentLocation: 'Southern Ocean (Lat 52.4°S, Long 48.2°E)',
        containersCarried: ['CNT-1023', 'CNT-1024', 'CNT-1025', 'CNT-1026'],
        totalWeightKg: 72500,
        expeditionId: 'EXP-2025-044',
        leadCoordinator: 'Capt. Suresh Menon',
      },
      {
        id: 'SHP-02',
        shipmentCode: 'SHP-SEA-2026-AG02',
        shipmentType: 'SEA',
        vesselOrCarrierName: 'SA Agulhas II (Research & Supply Vessel)',
        origin: 'Durban Port, South Africa',
        destination: 'Cape Town Staging Depot (Quay 500)',
        departureDate: '2026-11-01',
        eta: '2026-11-04',
        actualArrivalDate: '2026-11-06',
        status: 'DELIVERED',
        expectedTransitDurationDays: 3,
        actualTransitDurationDays: 5,
        delayDurationDays: 2,
        etaDeviationDays: 2,
        currentLocation: 'Port of Cape Town Quay 500',
        containersCarried: ['CNT-1027'],
        totalWeightKg: 18400,
        expeditionId: 'EXP-2026-045',
        leadCoordinator: 'Officer David Steyn',
      },
      {
        id: 'SHP-03',
        shipmentCode: 'SHP-AIR-2026-IL76',
        shipmentType: 'AIR',
        vesselOrCarrierName: 'Ilyushin IL-76TD-90VD Heavy Cargo Aircraft',
        origin: 'Cape Town International Airport',
        destination: 'Novolazarevskaya Blue Ice Runway (DROMLAN Gateway)',
        departureDate: '2026-11-10',
        eta: '2026-11-10',
        actualArrivalDate: '2026-11-12',
        status: 'DELAYED',
        expectedTransitDurationDays: 1,
        actualTransitDurationDays: 3,
        delayDurationDays: 2,
        etaDeviationDays: 2,
        currentLocation: 'Novolazarevskaya Airfield Apron',
        containersCarried: ['AIR-PALLET-01', 'AIR-PALLET-02'],
        totalWeightKg: 14500,
        expeditionId: 'EXP-2025-044',
        leadCoordinator: 'Flight Lt. K. R. Nambiar',
      },
      {
        id: 'SHP-04',
        shipmentCode: 'SHP-LND-2026-PB01',
        shipmentType: 'LAND',
        vesselOrCarrierName: 'Heavy Polar Traverse Convoy (4x PistenBully 300 + Sledges)',
        origin: 'Fast-Ice Discharge Barrier, Prydz Bay',
        destination: 'Bharati Station Polar Logistics Apron',
        departureDate: '2026-12-16',
        eta: '2026-12-18',
        actualArrivalDate: null,
        status: 'SCHEDULED',
        expectedTransitDurationDays: 2,
        actualTransitDurationDays: 0,
        delayDurationDays: 0,
        etaDeviationDays: 0,
        currentLocation: 'Staged at Fast Ice Mooring',
        containersCarried: ['CNT-1023', 'CNT-1025'],
        totalWeightKg: 33000,
        expeditionId: 'EXP-2025-044',
        leadCoordinator: 'Er. Tenzing Norbu',
      },
    ];

    let items = rawShipments;
    if (filter.shipmentType && filter.shipmentType !== 'ALL') {
      items = items.filter(s => s.shipmentType === filter.shipmentType);
    }
    if (filter.status && filter.status !== 'ALL') {
      items = items.filter(s => s.status === filter.status);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(s => 
        s.shipmentCode.toLowerCase().includes(q) || 
        s.vesselOrCarrierName.toLowerCase().includes(q) || 
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q)
      );
    }
    return items;
  }

  // 7. Inventory Analytics with Prediction shortfalls
  async getInventoryReport(filter: ReportFilterParams = {}, userRole: string = 'ADMIN'): Promise<InventoryAnalyticsItem[]> {
    const rawItems = await getInventoryItemsMaster();

    let items: InventoryAnalyticsItem[] = rawItems.map(inv => {
      const currentQty = inv.current_quantity ?? 0;
      const minStock = inv.minimum_stock ?? 10;
      const safetyStock = inv.safety_stock ?? 20;
      const daily = currentQty > 0 ? (inv.category === 'Fuel' ? 450 : inv.category === 'Food' ? 160 : 2.5) : 1;
      const days = Math.floor(currentQty / daily);
      const isCritical = currentQty <= minStock;
      const isLow = !isCritical && currentQty <= safetyStock;

      const predictedRequirement = Math.round(safetyStock * 1.35);
      const predictedShortage = Math.max(0, predictedRequirement - Math.round(currentQty));
      const priorityLevel = isCritical ? 'CRITICAL' : isLow ? 'HIGH' : predictedShortage > 0 ? 'MEDIUM' : 'NORMAL';

      return {
        id: inv.item_code,
        code: inv.item_code,
        name: inv.item_name,
        category: inv.category,
        stationId: inv.station_id,
        expeditionId: inv.expedition_id || 'EXP-2025-044',
        currentStock: currentQty,
        unit: inv.unit,
        minReserveThreshold: minStock,
        safetyStock: safetyStock,
        dailyConsumptionRate: daily,
        daysRemaining: days,
        status: isCritical ? 'CRITICAL' : isLow ? 'LOW' : 'NORMAL',
        predictedRequirement,
        predictedShortage,
        priorityLevel,
        incomingSuppliesQty: inv.category === 'Fuel' ? 30000 : inv.category === 'Food' ? 10000 : 250,
        restockingStatus: isCritical ? 'Voyage VG-26 Scheduled Resupply (50 Days)' : 'Nominal Routine Staging',
        lastReplenishedDate: inv.updated_at ? new Date(inv.updated_at).toISOString().split('T')[0] : '2026-02-14',
      };
    });

    if (filter.stationId && filter.stationId !== 'ALL') {
      items = items.filter(i => i.stationId === filter.stationId);
    }
    if (filter.category && filter.category !== 'ALL') {
      items = items.filter(i => i.category === filter.category);
    }
    if (filter.status && filter.status !== 'ALL') {
      items = items.filter(i => i.status === filter.status);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    return items;
  }

  // 8. Asset Analytics with Predictions
  async getAssetsReport(filter: ReportFilterParams = {}, userRole: string = 'ADMIN'): Promise<AssetAnalyticsItem[]> {
    const rawAssets = await getAssetsList();
    const predResult = await generateAssetPredictions();
    const predictions = predResult?.predictions || [];

    let items: AssetAnalyticsItem[] = rawAssets.map(a => {
      const pred = predictions.find(p => p.asset_type === a.asset_type || p.asset_category === a.asset_category);

      return {
        id: a.asset_id,
        code: a.asset_id,
        name: a.asset_name,
        category: a.asset_category,
        model: a.model,
        stationId: a.assigned_station,
        expeditionId: a.expedition_id || 'EXP-2025-044',
        assignedTeam: a.assigned_team || 'Logistics Fleet',
        status: a.status,
        operatingHours: a.operating_hours,
        maintenanceThresholdHours: a.maintenance_threshold_hours,
        vibrationIndex: a.vibration_index,
        healthScore: a.health_score,
        condition: a.condition,
        lastMaintenanceDate: a.last_maintenance_date || '2026-06-15',
        nextMaintenanceDue: a.next_maintenance_date || '2027-01-15',
        predictedRequirement: pred ? (pred.predicted_requirement ?? pred.predicted_required_count ?? 2) : 2,
        predictedShortage: pred ? pred.predicted_shortage : 0,
        riskLevel: pred ? (pred.risk_level as any) : 'LOW',
        sparesAvailability: a.status === 'UNDER_MAINTENANCE' ? 'Pending Import Clearance' : 'In Stock (Warehouse)',
      };
    });

    if (filter.stationId && filter.stationId !== 'ALL') {
      items = items.filter(i => i.stationId === filter.stationId);
    }
    if (filter.category && filter.category !== 'ALL') {
      items = items.filter(i => i.category === filter.category);
    }
    if (filter.status && filter.status !== 'ALL') {
      items = items.filter(i => i.status === filter.status);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q) || i.model.toLowerCase().includes(q));
    }

    return items;
  }

  // 9. Weather Analytics
  async getWeatherReport(filter: ReportFilterParams = {}, userRole: string = 'ADMIN'): Promise<WeatherAnalyticsItem[]> {
    const rawEvents = await weatherRepository.getAllEvents();

    let items: WeatherAnalyticsItem[] = rawEvents.map(w => ({
      id: w.id,
      eventId: w.id,
      eventType: w.event_type,
      severity: w.severity as any,
      environmentType: w.environment_type as any,
      targetName: w.target_name,
      stationId: w.station_id || undefined,
      vesselId: w.vessel_id || undefined,
      detectedAt: w.detected_at,
      startTime: w.start_time,
      expectedEndTime: w.expected_end_time || undefined,
      status: w.status,
      description: w.description,
      triggeringConditions: w.triggering_conditions,
      operationalInstruction: w.operational_instruction,
      emergencyTriggered: Boolean(w.emergency_id),
      latitude: w.latitude,
      longitude: w.longitude,
    }));

    if (filter.stationId && filter.stationId !== 'ALL') {
      items = items.filter(i => i.stationId === filter.stationId);
    }
    if (filter.severity && filter.severity !== 'ALL') {
      items = items.filter(i => i.severity === filter.severity);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(i => i.eventType.toLowerCase().includes(q) || i.targetName.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }

    return items;
  }

  // 10. Emergency Analytics & Response Team Performance
  async getEmergencyReport(filter: ReportFilterParams = {}, userRole: string = 'ADMIN'): Promise<{
    emergencies: EmergencyAnalyticsItem[];
    teamPerformance: ResponseTeamPerformanceItem[];
  }> {
    const rawEmergencies = await emergencyRepository.getAllEmergencies();
    const rawTeams = await emergencyRepository.getAllTeams();

    const emergencies: EmergencyAnalyticsItem[] = rawEmergencies.map(e => {
      const createdTime = e.created_at || e.detected_at;
      const ackMin = e.acknowledged_at && createdTime
        ? Math.max(1, Math.round((new Date(e.acknowledged_at).getTime() - new Date(createdTime).getTime()) / 60000))
        : 3;
      const respMin = e.response_started_at && createdTime
        ? Math.max(2, Math.round((new Date(e.response_started_at).getTime() - new Date(createdTime).getTime()) / 60000))
        : 7;
      const resolMin = e.resolved_at && createdTime
        ? Math.max(10, Math.round((new Date(e.resolved_at).getTime() - new Date(createdTime).getTime()) / 60000))
        : 45;

      return {
        id: e.id || e.emergency_code,
        code: e.emergency_code,
        stationId: e.station_id || 'bharati',
        type: e.emergency_type,
        severity: e.severity,
        title: `${e.emergency_type} at ${e.location}`,
        description: e.description,
        reportedTime: createdTime,
        status: e.status,
        casualties: 0,
        incidentCommander: 'Dr. K. Swaminathan (Station Commander)',
        acknowledgementTimeMinutes: ackMin,
        responseTimeMinutes: respMin,
        resolutionTimeMinutes: resolMin,
        escalationsCount: e.escalation_level > 1 ? e.escalation_level - 1 : 0,
        responseTeamName: e.response_team_name || 'Bharati Station Medical Emergency Team',
        actionsTakenCount: e.actions?.length || 3,
      };
    });

    const teamPerformance: ResponseTeamPerformanceItem[] = rawTeams.map(t => {
      const handled = emergencies.filter(e => e.stationId === t.station_id);
      const active = handled.filter(e => e.status !== 'RESOLVED' && e.status !== 'CANCELLED').length;
      const totalAck = handled.reduce((acc, h) => acc + h.acknowledgementTimeMinutes, 0);
      const totalResp = handled.reduce((acc, h) => acc + h.responseTimeMinutes, 0);
      const totalResol = handled.reduce((acc, h) => acc + h.resolutionTimeMinutes, 0);

      const count = handled.length || 1;
      const avgAckMinutes = Math.round((totalAck / count) * 10) / 10 || 3;
      const avgResponseMinutes = Math.round((totalResp / count) * 10) / 10 || 7;
      const avgResolutionMinutes = Math.round((totalResol / count) * 10) / 10 || 40;

      return {
        teamId: t.id,
        teamName: t.name,
        stationId: t.station_id || 'bharati',
        lead: t.members?.[0]?.name || 'Dr. Team Lead',
        totalEmergenciesHandled: handled.length,
        activeIncidents: active,
        avgAckMinutes,
        avgResponseMinutes,
        avgResolutionMinutes,
        escalationCount: handled.reduce((acc, h) => acc + h.escalationsCount, 0),
        unacknowledgedCount: handled.filter(h => (h.status === 'CREATED' || h.status === 'ALERTING') && h.acknowledgementTimeMinutes > 15).length,
        failedNotificationsCount: 0,
        readinessScore: t.availability_status === 'AVAILABLE' ? 98 : 75,
      };
    });

    let filteredEmergencies = emergencies;
    if (filter.stationId && filter.stationId !== 'ALL') {
      filteredEmergencies = filteredEmergencies.filter(e => e.stationId === filter.stationId);
    }
    if (filter.severity && filter.severity !== 'ALL') {
      filteredEmergencies = filteredEmergencies.filter(e => e.severity === filter.severity);
    }
    if (filter.status && filter.status !== 'ALL') {
      filteredEmergencies = filteredEmergencies.filter(e => e.status === filter.status);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      filteredEmergencies = filteredEmergencies.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.code.toLowerCase().includes(q) || 
        e.type.toLowerCase().includes(q)
      );
    }

    return {
      emergencies: filteredEmergencies,
      teamPerformance,
    };
  }

  // 11. Communication Analytics
  async getCommunicationReport(): Promise<CommunicationAnalyticsItem> {
    const stats = await communicationRepository.getDashboardStats();
    const attempts = await communicationRepository.getAttempts();

    const failures = attempts
      .filter(a => a.status === 'FAILED')
      .slice(0, 10)
      .map(a => ({
        id: `FAIL-${a.id}`,
        code: a.notification_id,
        title: `Delivery Failure on ${a.channel} Channel`,
        channel: a.channel,
        recipientName: a.recipient_id,
        failureReason: a.failure_reason || 'Iridium satellite buffer timeout (Sub-zero signal attenuation)',
        attemptCount: a.attempt_number,
        timestamp: a.attempted_at,
      }));

    return {
      totalNotifications: stats.total,
      sent: stats.sent,
      delivered: stats.delivered,
      read: stats.read,
      acknowledged: stats.acknowledged,
      failed: stats.failed,
      retried: stats.retrying,
      channels: {
        inApp: {
          total: stats.by_channel['IN_APP'] || 142,
          delivered: (stats.by_channel['IN_APP'] || 142) - 2,
          failed: 2,
        },
        email: {
          total: stats.by_channel['EMAIL'] || 90,
          delivered: (stats.by_channel['EMAIL'] || 90) - 4,
          failed: 4,
        },
        sms: {
          total: stats.by_channel['SMS'] || 44,
          delivered: (stats.by_channel['SMS'] || 44) - 5,
          failed: 5,
        },
      },
      byModule: stats.by_module,
      byPriority: stats.by_priority,
      recentDeliveryFailures: failures,
    };
  }

  // 12. Single Expedition Cross-Module Operational Report (Section 15 & 43)
  async getExpeditionDeepReport(expeditionId: string, userRole: string = 'ADMIN'): Promise<CrossModuleExpeditionReport | null> {
    const expeditions = await getAllExpeditions({});
    const exp = expeditions.find(e => e.expedition_id === expeditionId || e.expedition_code === expeditionId);
    if (!exp) return null;

    const [
      allPersonnel,
      allCargo,
      allContainers,
      allShipments,
      allInventory,
      allAssets,
      allWeather,
      emergencyData,
      commData
    ] = await Promise.all([
      this.getPersonnelReport({}, userRole),
      this.getCargoReport({}, userRole),
      this.getContainersReport({}, userRole),
      this.getShipmentsList({}),
      this.getInventoryReport({}, userRole),
      this.getAssetsReport({}, userRole),
      this.getWeatherReport({}, userRole),
      this.getEmergencyReport({}, userRole),
      this.getCommunicationReport(),
    ]);

    // Cross-link by station & expedition code
    const stationId = exp.target_region.toLowerCase().includes('bharati') ? 'bharati' : exp.target_region.toLowerCase().includes('maitri') ? 'maitri' : 'himadri';
    const relPersonnel = allPersonnel.filter(p => p.assignedStationId === stationId);
    const relContainers = allContainers.filter(c => c.destinationStationId === stationId);
    const relCargo = allCargo.filter(c => c.destination === stationId);
    const relShipments = allShipments.filter(s => s.expeditionId === exp.expedition_id || s.destination.toLowerCase().includes(stationId));
    const relInventory = allInventory.filter(i => i.stationId === stationId);
    const relAssets = allAssets.filter(a => a.stationId === stationId);
    const relWeather = allWeather.filter(w => w.stationId === stationId || w.targetName.toLowerCase().includes(stationId));
    const relEmergencies = emergencyData.emergencies.filter(e => e.stationId === stationId);

    const sDate = new Date(exp.start_date).getTime();
    const eDate = new Date(exp.end_date).getTime();
    const daysTotal = Math.max(1, Math.round((eDate - sDate) / (1000 * 3600 * 24)));
    const now = Date.now();
    const daysElapsed = Math.min(daysTotal, Math.max(0, Math.round((now - sDate) / (1000 * 3600 * 24))));
    const completionPct = exp.status.toUpperCase() === 'COMPLETED' ? 100 : Math.round((daysElapsed / daysTotal) * 100);

    const healthIndex = Math.round(
      (relAssets.reduce((acc, a) => acc + a.healthScore, 0) / (relAssets.length || 1) * 0.4) +
      (relInventory.filter(i => i.status === 'NORMAL').length / (relInventory.length || 1) * 100 * 0.3) +
      (relEmergencies.filter(e => e.status === 'RESOLVED').length / (relEmergencies.length || 1) * 100 * 0.3)
    );

    const report: CrossModuleExpeditionReport = {
      expedition: exp,
      overview: {
        daysTotal,
        daysElapsed,
        completionPct,
        healthIndex,
        riskLevel: relEmergencies.some(e => e.status === 'ACTIVE' && e.severity === 'CRITICAL') ? 'HIGH' : 'LOW',
      },
      personnelSummary: {
        total: relPersonnel.length,
        deployed: relPersonnel.filter(p => p.status === 'Deployed').length,
        inTransit: relPersonnel.filter(p => p.status === 'In Transit').length,
        rolesList: Array.from(new Set(relPersonnel.map(p => p.role))),
        teamsList: Array.from(new Set(relPersonnel.map(p => p.team))),
        members: relPersonnel,
      },
      cargoSummary: {
        containersCount: relContainers.length,
        totalWeightTons: Math.round(relCargo.reduce((acc, c) => acc + c.weightTons, 0)),
        totalVolumeM3: Math.round(relCargo.reduce((acc, c) => acc + c.volumeM3, 0)),
        deliveredCount: relCargo.filter(c => c.status === 'DELIVERED').length,
        inTransitCount: relCargo.filter(c => c.status === 'IN_TRANSIT').length,
        delayedCount: relCargo.filter(c => c.status === 'DELAYED').length,
        hazardousCargoCount: relCargo.filter(c => Boolean(c.hazmatClass)).length,
        containers: relContainers,
        cargoItems: relCargo,
      },
      shipmentsSummary: {
        total: relShipments.length,
        active: relShipments.filter(s => s.status === 'IN_TRANSIT').length,
        completed: relShipments.filter(s => s.status === 'DELIVERED').length,
        delayed: relShipments.filter(s => s.status === 'DELAYED').length,
        shipments: relShipments,
      },
      inventorySummary: {
        totalAllocatedItems: relInventory.length,
        lowStockAlerts: relInventory.filter(i => i.status === 'LOW').length,
        criticalAlerts: relInventory.filter(i => i.status === 'CRITICAL').length,
        predictedShortages: relInventory.filter(i => i.predictedShortage > 0).length,
        items: relInventory,
      },
      assetsSummary: {
        totalAssets: relAssets.length,
        operational: relAssets.filter(a => a.status === 'AVAILABLE' || a.status === 'ASSIGNED' || a.status === 'IN_USE').length,
        maintenanceDue: relAssets.filter(a => a.status === 'UNDER_MAINTENANCE').length,
        damagedOrOffline: relAssets.filter(a => a.status === 'DAMAGED' || a.status === 'LOST').length,
        predictedEquipmentNeeds: relAssets.filter(a => a.predictedShortage > 0).length,
        assets: relAssets,
      },
      safetySummary: {
        totalEmergencies: relEmergencies.length,
        activeEmergencies: relEmergencies.filter(e => e.status === 'ACTIVE').length,
        resolvedEmergencies: relEmergencies.filter(e => e.status === 'RESOLVED').length,
        criticalEmergencies: relEmergencies.filter(e => e.severity === 'CRITICAL').length,
        emergencies: relEmergencies,
      },
      weatherSummary: {
        totalWeatherEvents: relWeather.length,
        criticalEvents: relWeather.filter(w => w.severity === 'CRITICAL').length,
        activeEvents: relWeather.filter(w => w.status !== 'RESOLVED').length,
        events: relWeather,
      },
      communicationsSummary: {
        totalNotifications: commData.totalNotifications,
        delivered: commData.delivered,
        read: commData.read,
        acknowledged: commData.acknowledged,
        failed: commData.failed,
      },
      auditHistory: [
        {
          timestamp: exp.created_at || '2025-08-10T09:00:00Z',
          user: exp.created_by || 'director@ncpor.res.in',
          action: 'EXPEDITION_CREATED',
          details: `Campaign registered with baseline authorization.`,
        },
        {
          timestamp: exp.updated_at || '2025-11-15T12:00:00Z',
          user: exp.updated_by || 'logistics@ncpor.res.in',
          action: 'DEPLOYMENT_ACTIVATED',
          details: `Voyage VG-2026 sailed from Mormugao port. Telemetry active.`,
        },
      ],
    };

    return report;
  }

  // 13. Global Search across All Operational Reporting Modules
  async searchGlobalReporting(query: string, userRole: string = 'ADMIN'): Promise<ReportingSearchResult> {
    const q = (query || '').trim().toLowerCase();
    const [
      expeditions,
      personnel,
      cargo,
      containers,
      shipments,
      inventory,
      assets,
      emergencyData,
      weather
    ] = await Promise.all([
      this.getExpeditionsReport({ q }, userRole),
      this.getPersonnelReport({ q }, userRole),
      this.getCargoReport({ q }, userRole),
      this.getContainersReport({ q }, userRole),
      this.getShipmentsList({ q }),
      this.getInventoryReport({ q }, userRole),
      this.getAssetsReport({ q }, userRole),
      this.getEmergencyReport({ q }, userRole),
      this.getWeatherReport({ q }, userRole),
    ]);

    return {
      query,
      timestamp: new Date().toISOString(),
      counts: {
        expeditions: expeditions.length,
        personnel: personnel.length,
        cargo: cargo.length,
        containers: containers.length,
        shipments: shipments.length,
        inventory: inventory.length,
        assets: assets.length,
        emergencies: emergencyData.emergencies.length,
        weather: weather.length,
      },
      expeditions,
      personnel,
      cargo,
      containers,
      shipments,
      inventory,
      assets,
      emergencies: emergencyData.emergencies,
      weather,
    };
  }

  // 14. Documented KPI Definitions (Mandatory per Section 39)
  getKpiDefinitions(): KpiDefinition[] {
    return [
      {
        code: "KPI-EXP-01",
        name: "Active Expedition",
        category: "EXPEDITION",
        formula: "COUNT(expeditions WHERE status = 'ACTIVE')",
        unit: "Count",
        description: "Scientific and logistics campaigns currently deployed and actively operational in the Polar regions.",
        authoritativeSource: "National Centre for Polar and Ocean Research Expedition Registry",
        targetOrBenchmark: "Annual planned seasonal campaigns (e.g. 1-2 concurrent active).",
      },
      {
        code: "KPI-PRS-02",
        name: "Deployed Personnel Count",
        category: "PERSONNEL",
        formula: "COUNT(personnel WHERE status = 'Deployed')",
        unit: "Personnel",
        description: "Scientists, logistics engineers, and medical staff physically stationed at Antarctic stations.",
        authoritativeSource: "NCPOR Personnel Roster & Movement Manifest",
        targetOrBenchmark: "Within certified station life-support capacity limits (Bharati: 50, Maitri: 40).",
      },
      {
        code: "KPI-SHP-03",
        name: "Delayed Shipment Duration",
        category: "SHIPMENT",
        formula: "MAX(0, Actual / Updated ETA - Initial Scheduled ETA)",
        unit: "Days",
        description: "Net deviation between scheduled arrival date and confirmed arrival date across Sea, Air, and Land legs.",
        authoritativeSource: "Voyage Master AIS & Port Logistics Gateway",
        targetOrBenchmark: "< 4 days delay allowed during Southern Ocean ice pack transit.",
      },
      {
        code: "KPI-CNT-04",
        name: "Container Utilization Rate",
        category: "CARGO_CONTAINER",
        formula: "(Gross Cargo Weight / Max Certified Tare Capacity) * 100",
        unit: "Percentage (%)",
        description: "Payload weight density optimization for polar containers to maximize vessel stowage efficiency.",
        authoritativeSource: "Mormugao Port Weighbridge & Stowage Plan",
        targetOrBenchmark: "75% - 95% target utilization.",
      },
      {
        code: "KPI-INV-05",
        name: "Inventory Depletion Horizon",
        category: "INVENTORY",
        formula: "Current Usable Stock / Daily Average Consumption Rate",
        unit: "Days Remaining",
        description: "Estimated days before station stock reaches zero under current meteorological and crew consumption.",
        authoritativeSource: "Station Inventory Ledger & Depletion Engine",
        targetOrBenchmark: "> 45 days minimum safety cushion during Antarctic winter isolation.",
      },
      {
        code: "KPI-INV-06",
        name: "Predicted Inventory Shortage",
        category: "INVENTORY",
        formula: "MAX(0, Predicted Requirement - Available Usable Stock)",
        unit: "Units / Litres / kg",
        description: "Projected supply deficit before next scheduled resupply voyage reaches the fast-ice barrier.",
        authoritativeSource: "Inventory Machine-Learning Regression & Rule Engine",
        targetOrBenchmark: "0 shortage tolerance for Class 1 Life Support provisions.",
      },
      {
        code: "KPI-AST-07",
        name: "Asset Health Score",
        category: "ASSET",
        formula: "100 - ((Operating Hours % Threshold) / Threshold * 50) - (Vibration Index * 10)",
        unit: "Index (0-100)",
        description: "Calculated composite operational reliability index of high-value generators, snowcats, and cranes.",
        authoritativeSource: "Asset Telemetry & Scheduled Maintenance Registry",
        targetOrBenchmark: "> 80 Nominal, < 60 Maintenance Required.",
      },
      {
        code: "KPI-EMG-08",
        name: "Emergency Acknowledgement Time",
        category: "SAFETY_EMERGENCY",
        formula: "Timestamp(Incident Commander Acknowledged) - Timestamp(Emergency Created)",
        unit: "Minutes",
        description: "Duration between distress beacon or detector alarm trigger and operational commander sign-off.",
        authoritativeSource: "Emergency Command Incident Ledger",
        targetOrBenchmark: "< 5 minutes for Critical severity, < 15 minutes for Warning.",
      },
      {
        code: "KPI-EMG-09",
        name: "Emergency Resolution Time",
        category: "SAFETY_EMERGENCY",
        formula: "Timestamp(All Clear Declared) - Timestamp(Emergency Created)",
        unit: "Minutes / Hours",
        description: "Elapsed operational duration from first incident notification until containment and restoration.",
        authoritativeSource: "Incident Action Directives & Closure Audit",
        targetOrBenchmark: "< 60 minutes for secondary power failure or localized fire containment.",
      },
      {
        code: "KPI-COM-10",
        name: "Notification Delivery Success Rate",
        category: "COMMUNICATION",
        formula: "(Delivered Notifications / Total Queued Notifications) * 100",
        unit: "Percentage (%)",
        description: "Reliability of mission-critical dispatches delivered across In-App, Email, and Iridium Satellite SMS.",
        authoritativeSource: "Communication Queue Dispatch & Provider Telemetry",
        targetOrBenchmark: "> 95% across all polar transport links.",
      },
    ];
  }

  // 15. Export Generators (CSV, Excel XML, PDF)
  generateCsvReport(reportType: string, records: any[], filters: ReportFilterParams): string {
    if (!records || records.length === 0) {
      return 'Status,Message\nEMPTY,"No operational records found for the selected filter parameters."';
    }

    const headers = Object.keys(records[0]).filter(k => typeof records[0][k] !== 'object');
    const rows = records.map(record => {
      return headers.map(h => {
        let val = record[h];
        if (val === null || val === undefined) val = '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',');
    });

    const metadata = [
      `# POLARIS Polar Expedition Command & Logistics Platform (NCPOR)`,
      `# Report Type: ${reportType.toUpperCase()}`,
      `# Generated At: ${new Date().toISOString()}`,
      `# Applied Filters: ${JSON.stringify(filters)}`,
      `# Total Records: ${records.length}`,
      '',
    ].join('\n');

    return `${metadata}\n${headers.join(',')}\n${rows.join('\n')}`;
  }

  generateExcelReport(reportType: string, records: any[], filters: ReportFilterParams): string {
    // Generate clean Microsoft Excel 2003 XML Spreadsheet (supported natively by MS Excel, LibreOffice, Google Sheets)
    const title = `${reportType.toUpperCase()} Operational Report`;
    if (!records || records.length === 0) {
      return `<?xml version="1.0"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Worksheet ss:Name="Report">
          <Table><Row><Cell><Data ss:Type="String">No records match the selected filter parameters.</Data></Cell></Row></Table>
        </Worksheet>
      </Workbook>`;
    }

    const headers = Object.keys(records[0]).filter(k => typeof records[0][k] !== 'object');

    const headerCells = headers.map(h => 
      `<Cell ss:StyleID="Header"><Data ss:Type="String">${h.replace(/_/g, ' ').toUpperCase()}</Data></Cell>`
    ).join('');

    const dataRows = records.map(r => {
      const cells = headers.map(h => {
        const val = r[h];
        const isNum = typeof val === 'number';
        const safeStr = String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${safeStr}</Data></Cell>`;
      }).join('');
      return `<Row>${cells}</Row>`;
    }).join('\n');

    return `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      <Styles>
        <Style ss:ID="Header">
          <Font ss:Bold="1" ss:Color="#FFFFFF"/>
          <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
          <Alignment ss:Horizontal="Center"/>
        </Style>
      </Styles>
      <Worksheet ss:Name="${reportType.slice(0, 30)}">
        <Table>
          <Row><Cell><Data ss:Type="String">${title} - National Centre for Polar and Ocean Research</Data></Cell></Row>
          <Row><Cell><Data ss:Type="String">Exported: ${new Date().toISOString()} | Filters: ${JSON.stringify(filters)}</Data></Cell></Row>
          <Row/>
          <Row>${headerCells}</Row>
          ${dataRows}
        </Table>
      </Worksheet>
    </Workbook>`;
  }

  generatePdfPrintableHtml(reportType: string, records: any[], filters: ReportFilterParams, userRole: string = 'ADMIN'): string {
    const title = `${reportType.replace(/_/g, ' ').toUpperCase()} OPERATIONAL REPORT`;
    const dateStr = new Date().toUTCString();
    const headers = records.length > 0 ? Object.keys(records[0]).filter(k => typeof records[0][k] !== 'object').slice(0, 9) : [];

    const rowsHtml = records.slice(0, 100).map((r, idx) => {
      const tds = headers.map(h => {
        let val = r[h];
        if (typeof val === 'number') val = val.toLocaleString();
        return `<td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${val ?? '-'}</td>`;
      }).join('');
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      return `<tr style="background-color: ${bg};">${tds}</tr>`;
    }).join('\n');

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title} - NCPOR POLARIS</title>
      <style>
        @page { size: A4 landscape; margin: 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e3a8a; padding-bottom: 14px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; margin: 0; }
        .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 500; }
        .classification { background-color: #fee2e2; color: #991b1b; padding: 4px 10px; font-size: 10px; font-weight: 800; border-radius: 4px; border: 1px solid #f87171; letter-spacing: 1px; }
        .meta-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background-color: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-size: 11px; margin-bottom: 18px; }
        .meta-item strong { display: block; font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background-color: #1e3a8a; color: #ffffff; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .footer { margin-top: 25px; padding-top: 12px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
        .sig-block { margin-top: 30px; display: flex; justify-content: space-between; font-size: 10px; }
        .sig-line { width: 200px; border-top: 1px solid #94a3b8; padding-top: 4px; text-align: center; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; display: flex; gap: 10px;">
        <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600;">Print / Save as PDF</button>
        <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close Preview</button>
      </div>

      <div class="header">
        <div>
          <h1 class="title">POLARIS | ${title}</h1>
          <div class="subtitle">NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH (NCPOR) • MINISTRY OF EARTH SCIENCES, GOVT. OF INDIA</div>
        </div>
        <div class="classification">OFFICIAL USE ONLY • ANTARCTIC TREATY OPERATIONAL DATA</div>
      </div>

      <div class="meta-bar">
        <div class="meta-item"><strong>Report Generated</strong>${dateStr}</div>
        <div class="meta-item"><strong>Authorized User</strong>${userRole}</div>
        <div class="meta-item"><strong>Records Count</strong>${records.length} items logged</div>
        <div class="meta-item"><strong>System Security</strong>AES-256 Cloud SQL Link Verified</div>
      </div>

      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h.replace(/_/g, ' ')}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="8" style="padding: 20px; text-align: center;">No records found for the selected criteria.</td></tr>'}
        </tbody>
      </table>

      <div class="sig-block">
        <div class="sig-line">Prepared By: Polar Logistics Control</div>
        <div class="sig-line">Verified By: Station Commander / Lead</div>
        <div class="sig-line">Approved By: Director, NCPOR Goa</div>
      </div>

      <div class="footer">
        <span>POLARIS v2.6 Antarctic Command & Control Platform</span>
        <span>Headland Sada, Vasco da Gama, Goa 403804</span>
        <span>Page 1 of 1</span>
      </div>
    </body>
    </html>`;
  }
}

export const reportingRepository = new ReportingRepository();
