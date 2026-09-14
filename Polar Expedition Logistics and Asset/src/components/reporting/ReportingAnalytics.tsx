import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Compass, 
  Users, 
  Boxes, 
  Truck, 
  MapPin, 
  Package, 
  ShieldAlert, 
  Radio, 
  Download, 
  BookOpen, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  Filter, 
  Calendar, 
  Layers, 
  ChevronRight,
  ExternalLink,
  Sparkles,
  Globe
} from 'lucide-react';
import { 
  DashboardKpis, 
  ExpeditionReportItem, 
  PersonnelReportItem, 
  CargoReportItem, 
  ContainerReportItem, 
  ShipmentReportItem, 
  InventoryReportItem, 
  AssetReportItem, 
  WeatherReportItem, 
  EmergencyReportItem, 
  ResponseTeamScorecard, 
  CommunicationReportSummary, 
  ReportFilterParams,
  UserRole
} from '../../types.ts';
import { 
  fetchReportingDashboardApi, 
  fetchReportingExpeditionsApi, 
  fetchReportingPersonnelApi, 
  fetchReportingCargoApi, 
  fetchReportingContainersApi, 
  fetchReportingShipmentsApi, 
  fetchReportingInventoryApi, 
  fetchReportingAssetsApi, 
  fetchReportingWeatherApi, 
  fetchReportingEmergenciesApi, 
  fetchReportingCommunicationsApi,
  searchReportingGlobalApi
} from '../../lib/api.ts';

import { ReportingDashboardOverview } from './ReportingDashboardOverview.tsx';
import { ExpeditionAnalyticsView } from './ExpeditionAnalyticsView.tsx';
import { PersonnelAnalyticsView } from './PersonnelAnalyticsView.tsx';
import { CargoContainerAnalyticsView } from './CargoContainerAnalyticsView.tsx';
import { ShipmentTrackingAnalyticsView } from './ShipmentTrackingAnalyticsView.tsx';
import { MapAnalyticsView } from './MapAnalyticsView.tsx';
import { InventoryAssetAnalyticsView } from './InventoryAssetAnalyticsView.tsx';
import { WeatherEmergencyAnalyticsView } from './WeatherEmergencyAnalyticsView.tsx';
import { CommunicationAnalyticsView } from './CommunicationAnalyticsView.tsx';
import { CrossModuleExpeditionReportModal } from './CrossModuleExpeditionReportModal.tsx';
import { ReportExportModal } from './ReportExportModal.tsx';
import { KpiDefinitionsModal } from './KpiDefinitionsModal.tsx';
import { ReportingAuditLogsModal } from './ReportingAuditLogsModal.tsx';

interface ReportingAnalyticsProps {
  currentRole: UserRole;
  onNavigateTab?: (tab: string) => void;
}

export const ReportingAnalytics: React.FC<ReportingAnalyticsProps> = ({ currentRole, onNavigateTab }) => {
  // Main View Navigation
  const [activeTab, setActiveTab] = useState<
    'overview' | 'expeditions' | 'personnel' | 'cargo' | 'shipments' | 'map' | 'inventory_assets' | 'safety' | 'comms'
  >('overview');

  // Filter state
  const [dateRange, setDateRange] = useState<string>('CURRENT_EXPEDITION');
  const [stationId, setStationId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefreshSecs, setAutoRefreshSecs] = useState<number>(15);

  // Modals
  const [selectedExpeditionId, setSelectedExpeditionId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isKpiModalOpen, setIsKpiModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [expeditions, setExpeditions] = useState<ExpeditionReportItem[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelReportItem[]>([]);
  const [cargoItems, setCargoItems] = useState<CargoReportItem[]>([]);
  const [containers, setContainers] = useState<ContainerReportItem[]>([]);
  const [shipments, setShipments] = useState<ShipmentReportItem[]>([]);
  const [inventory, setInventory] = useState<InventoryReportItem[]>([]);
  const [assets, setAssets] = useState<AssetReportItem[]>([]);
  const [weather, setWeather] = useState<WeatherReportItem[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyReportItem[]>([]);
  const [responseTeams, setResponseTeams] = useState<ResponseTeamScorecard[]>([]);
  const [meanAckMinutes, setMeanAckMinutes] = useState<number>(3.8);
  const [meanResponseMinutes, setMeanResponseMinutes] = useState<number>(12.4);
  const [meanResolutionMinutes, setMeanResolutionMinutes] = useState<number>(45.2);
  const [commData, setCommData] = useState<CommunicationReportSummary | null>(null);

  // Load all reporting datasets
  const loadData = useCallback(async () => {
    setLoading(true);
    const filterParams: ReportFilterParams = {
      dateRange: dateRange as any,
      stationId: stationId !== 'ALL' ? (stationId as any) : undefined,
      q: searchQuery || undefined,
    };

    try {
      const [
        kpisRes,
        expeditionsRes,
        personnelRes,
        cargoRes,
        containersRes,
        shipmentsRes,
        inventoryRes,
        assetsRes,
        weatherRes,
        emergenciesRes,
        commsRes
      ] = await Promise.allSettled([
        fetchReportingDashboardApi(filterParams),
        fetchReportingExpeditionsApi(filterParams),
        fetchReportingPersonnelApi(filterParams),
        fetchReportingCargoApi(filterParams),
        fetchReportingContainersApi(filterParams),
        fetchReportingShipmentsApi(filterParams),
        fetchReportingInventoryApi(filterParams),
        fetchReportingAssetsApi(filterParams),
        fetchReportingWeatherApi(filterParams),
        fetchReportingEmergenciesApi(filterParams),
        fetchReportingCommunicationsApi()
      ]);

      if (kpisRes.status === 'fulfilled') setKpis(kpisRes.value);
      if (expeditionsRes.status === 'fulfilled') setExpeditions(expeditionsRes.value);
      if (personnelRes.status === 'fulfilled') setPersonnel(personnelRes.value);
      if (cargoRes.status === 'fulfilled') setCargoItems(cargoRes.value);
      if (containersRes.status === 'fulfilled') setContainers(containersRes.value);
      if (shipmentsRes.status === 'fulfilled') setShipments(shipmentsRes.value);
      if (inventoryRes.status === 'fulfilled') setInventory(inventoryRes.value);
      if (assetsRes.status === 'fulfilled') setAssets(assetsRes.value);
      if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value);
      if (emergenciesRes.status === 'fulfilled') {
        setEmergencies(emergenciesRes.value.emergencies || []);
        setResponseTeams(emergenciesRes.value.responseTeams || []);
        setMeanAckMinutes(emergenciesRes.value.meanAcknowledgementTimeMinutes || 3.8);
        setMeanResponseMinutes(emergenciesRes.value.meanResponseTimeMinutes || 12.4);
        setMeanResolutionMinutes(emergenciesRes.value.meanResolutionDurationMinutes || 45.2);
      }
      if (commsRes.status === 'fulfilled') setCommData(commsRes.value);
    } catch (err) {
      console.warn('Reporting data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, stationId, searchQuery]);

  // Initial and reactive load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshSecs <= 0) return;
    const interval = setInterval(() => {
      loadData();
    }, autoRefreshSecs * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshSecs, loadData]);

  const activeFilters: ReportFilterParams = {
    dateRange: dateRange as any,
    stationId: stationId !== 'ALL' ? (stationId as any) : undefined,
    q: searchQuery || undefined,
  };

  const navSubTabs = [
    { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
    { id: 'expeditions', label: 'Expeditions', icon: Compass },
    { id: 'personnel', label: 'Personnel', icon: Users },
    { id: 'cargo', label: 'Cargo & Containers', icon: Boxes },
    { id: 'shipments', label: 'Multi-Modal Logistics', icon: Truck },
    { id: 'map', label: 'Polar GIS Map', icon: Globe },
    { id: 'inventory_assets', label: 'Inventory & Fleet', icon: Package },
    { id: 'safety', label: 'Safety & Emergency', icon: ShieldAlert },
    { id: 'comms', label: 'Satellite Comms', icon: Radio },
  ];

  return (
    <div className="space-y-6">
      {/* Top Polar Command Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Reporting & Analytics Command
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  NCPOR Authoritative
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cross-module operational intelligence, KPI tracking, and official Antarctic Treaty audit dispatches
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>

            <button
              onClick={() => setIsKpiModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>KPI Dictionary</span>
            </button>

            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Audit Log</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Multi-Domain Filter Ribbon */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search across all modules (e.g. 'EXP-2025', 'Bharati', 'Fuel')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Right: Date range & station selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value="CURRENT_EXPEDITION">Current 44th ISEA Season</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="TODAY">Today (24h)</option>
                <option value="ALL">All Mission Archives</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Stations & Ports</option>
                <option value="bharati">Bharati Station</option>
                <option value="maitri">Maitri Station</option>
                <option value="himadri">Himadri Arctic Station</option>
                <option value="cape_town">Cape Town Staging Port</option>
                <option value="goa">Goa HQ Command</option>
              </select>
            </div>

            {/* Auto refresh dropdown */}
            <div className="flex items-center gap-1 text-slate-500">
              <span className="text-[11px]">Poll:</span>
              <select
                value={autoRefreshSecs}
                onChange={(e) => setAutoRefreshSecs(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] text-slate-700 focus:outline-none"
              >
                <option value={15}>15s (Live)</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={0}>Manual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation Ribbon */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 pt-2 -mb-1">
          {navSubTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-VIEW RENDERING */}
      {activeTab === 'overview' && (
        <ReportingDashboardOverview
          kpis={kpis}
          expeditions={expeditions}
          onSelectExpedition={(id) => setSelectedExpeditionId(id)}
          onNavigateTab={(tabKey) => {
            if (tabKey === 'expeditions') setActiveTab('expeditions');
            else if (tabKey === 'personnel') setActiveTab('personnel');
            else if (tabKey === 'cargo') setActiveTab('cargo');
            else if (tabKey === 'shipments') setActiveTab('shipments');
            else if (tabKey === 'inventory') setActiveTab('inventory_assets');
            else if (tabKey === 'assets') setActiveTab('inventory_assets');
            else if (tabKey === 'emergencies') setActiveTab('safety');
            else if (tabKey === 'weather') setActiveTab('safety');
            else if (tabKey === 'communications') setActiveTab('comms');
          }}
          loading={loading}
        />
      )}

      {activeTab === 'expeditions' && (
        <ExpeditionAnalyticsView
          expeditions={expeditions}
          onSelectExpedition={(id) => setSelectedExpeditionId(id)}
          onExport={() => setIsExportModalOpen(true)}
          loading={loading}
        />
      )}

      {activeTab === 'personnel' && (
        <PersonnelAnalyticsView
          personnel={personnel}
          onExport={() => setIsExportModalOpen(true)}
          loading={loading}
          userRole={currentRole}
        />
      )}

      {activeTab === 'cargo' && (
        <CargoContainerAnalyticsView
          containers={containers}
          cargoItems={cargoItems}
          onExport={() => setIsExportModalOpen(true)}
          loading={loading}
        />
      )}

      {activeTab === 'shipments' && (
        <ShipmentTrackingAnalyticsView
          shipments={shipments}
          onExport={() => setIsExportModalOpen(true)}
          loading={loading}
        />
      )}

      {activeTab === 'map' && (
        <MapAnalyticsView />
      )}

      {activeTab === 'inventory_assets' && (
        <InventoryAssetAnalyticsView
          inventory={inventory}
          assets={assets}
          onExport={() => setIsExportModalOpen(true)}
          loading={loading}
        />
      )}

      {activeTab === 'safety' && (
        <WeatherEmergencyAnalyticsView
          emergencies={emergencies}
          responseTeams={responseTeams}
          weather={weather}
          meanAckMinutes={meanAckMinutes}
          meanResponseMinutes={meanResponseMinutes}
          meanResolutionMinutes={meanResolutionMinutes}
          onExport={() => setIsExportModalOpen(true)}
          loading={loading}
        />
      )}

      {activeTab === 'comms' && (
        <CommunicationAnalyticsView
          commData={commData}
          loading={loading}
        />
      )}

      {/* MODALS */}
      {/* 1. Cross-Module Deep Expedition Dossier */}
      <CrossModuleExpeditionReportModal
        expeditionId={selectedExpeditionId}
        isOpen={Boolean(selectedExpeditionId)}
        onClose={() => setSelectedExpeditionId(null)}
      />

      {/* 2. Official Report Export Dialog */}
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeFilters={activeFilters}
      />

      {/* 3. Standard Operational KPI Dictionary */}
      <KpiDefinitionsModal
        isOpen={isKpiModalOpen}
        onClose={() => setIsKpiModalOpen(false)}
      />

      {/* 4. Immutable Reporting Audit Log */}
      <ReportingAuditLogsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
};
