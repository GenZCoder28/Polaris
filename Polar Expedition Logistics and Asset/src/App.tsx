import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  Station, 
  Expedition, 
  Container, 
  Vessel, 
  InventoryItem, 
  Asset, 
  Personnel, 
  EmergencyIncident, 
  ContainerJourneyStatus,
  StationId
} from './types';
import {
  INITIAL_STATIONS,
  INITIAL_EXPEDITIONS,
  INITIAL_CONTAINERS,
  INITIAL_VESSELS,
  INITIAL_INVENTORY,
  INITIAL_ASSETS,
  INITIAL_PERSONNEL,
  INITIAL_EMERGENCIES,
} from './data/initialData';
import {
  fetchMissionsApi,
  createMissionApi,
  fetchCargoApi,
  updateCargoApi,
  fetchInventoryApi,
  adjustInventoryStockApi,
  fetchAssetsApi,
  updateAssetStatusApi,
  fetchPersonnelApi,
  fetchEmergenciesApi,
  createEmergencyApi,
  updateEmergencyApi
} from './lib/api';

import { Header } from './components/Header';
import { GmailSidebar } from './components/GmailSidebar';
import { PolarMap } from './components/PolarMap';
import { ExpeditionPlanning } from './components/ExpeditionPlanning';
import { CargoTracking } from './components/CargoTracking';
import { InventoryManagement } from './components/InventoryManagement';
import { AssetManagement } from './components/AssetManagement';
import { PersonnelMovement } from './components/PersonnelMovement';
import { StationOverview } from './components/StationOverview';
import { EmergencyCenter } from './components/EmergencyCenter';
import { WeatherMonitoring } from './components/WeatherMonitoring';
import { CommunicationCenter } from './components/communication/CommunicationCenter';
import { COMMAND_BOXES } from './components/AntarcticCommandBoxes';
import { Navigation } from 'lucide-react';

export default function App() {
  // Primary Command Box Selection (Default to 1 = Expedition Planning Dashboard as first page)
  const [activeBox, setActiveBox] = useState<number>(1);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');

  // Sub-views inside each box
  const [box1SubTab, setBox1SubTab] = useState<'missions' | 'stations'>('missions');
  const [box4SubTab, setBox4SubTab] = useState<'inventory' | 'assets'>('inventory');
  const [box5SubTab, setBox5SubTab] = useState<'incidents' | 'comms'>('incidents');

  // Domain State (Chain of Integration)
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS);
  const [expeditions, setExpeditions] = useState<Expedition[]>(INITIAL_EXPEDITIONS);
  const [containers, setContainers] = useState<Container[]>(INITIAL_CONTAINERS);
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [personnel, setPersonnel] = useState<Personnel[]>(INITIAL_PERSONNEL);
  const [emergencies, setEmergencies] = useState<EmergencyIncident[]>(INITIAL_EMERGENCIES);

  // Hydrate data from Cloud SQL PostgreSQL database
  useEffect(() => {
    let isMounted = true;
    async function loadDatabaseData() {
      try {
        const [missionsData, cargoData, invData, assetsData, personnelData, emgData] = await Promise.allSettled([
          fetchMissionsApi(),
          fetchCargoApi(),
          fetchInventoryApi(),
          fetchAssetsApi(),
          fetchPersonnelApi(),
          fetchEmergenciesApi(),
        ]);

        if (!isMounted) return;

        if (missionsData.status === 'fulfilled' && Array.isArray(missionsData.value) && missionsData.value.length > 0) {
          const mapped: Expedition[] = missionsData.value.map((m: any) => ({
            id: m.code || `EXP-${m.id}`,
            code: m.code,
            name: m.name,
            destinationStationId: (m.station || 'bharati') as StationId,
            startDate: m.startDate,
            endDate: m.endDate,
            personnelCount: m.personnelCount,
            objective: m.objectives,
            status: m.status as any,
            requirements: {
              foodKg: 12000,
              fuelL: (m.requiredFuelKl || 45) * 1000,
              equipmentKg: 8500,
              medicineUnits: 450,
              sparePartsKg: 1200,
            },
            allocatedWeightKg: 25000,
            containersAssigned: ['CNT-1023', 'CNT-1024'],
            vesselId: 'VESSEL-01',
            leadScientist: m.lead || 'Dr. Lead Scientist',
          }));
          setExpeditions(mapped);
        }

        if (cargoData.status === 'fulfilled' && Array.isArray(cargoData.value) && cargoData.value.length > 0) {
          const mapped: Container[] = cargoData.value.map((c: any) => ({
            id: c.containerNo || c.rfid,
            code: c.containerNo,
            type: (c.cargoType || '20ft Standard') as any,
            capacityKg: 28000,
            currentWeightKg: Math.round((c.weightTons || 12) * 1000),
            stowagePriority: (c.priority === 'CRITICAL' ? 1 : 3) as 1 | 2 | 3 | 4,
            stowageTierLabel: 'Tier 1 - Weather Deck',
            isHazardous: Boolean(c.hazmatClass),
            rfidTag: c.rfid,
            status: c.status as any,
            currentLocationName: c.departurePort || 'Mormugao Port, Goa',
            vesselId: 'VESSEL-01',
            destinationStationId: (c.destination || 'bharati') as StationId,
            items: [],
            qrPayload: `NCPOR-CONTAINER-${c.containerNo}`,
            lastScannedTime: new Date().toISOString(),
          }));
          setContainers(mapped);
        }

        if (invData.status === 'fulfilled' && Array.isArray(invData.value) && invData.value.length > 0) {
          const mapped: InventoryItem[] = invData.value.map((inv: any) => ({
            id: inv.item_code || inv.code || `INV-${inv.id}`,
            stationId: (inv.station_id || inv.station || 'bharati') as StationId,
            name: inv.item_name || inv.name || 'Expedition Supply',
            category: (inv.category || 'Consumables') as any,
            currentStock: Number(inv.current_quantity ?? inv.stock ?? inv.currentStock ?? 0),
            unit: inv.unit || 'Units',
            dailyConsumptionRate: Number(inv.daily_consumption_rate ?? inv.daily_depletion ?? inv.dailyDepletion ?? inv.dailyConsumptionRate ?? (inv.category === 'Fuel' ? 500 : inv.category === 'Food' ? 180 : 15)),
            minReserveThreshold: Number(inv.safety_stock ?? inv.minimum_stock ?? inv.minThreshold ?? inv.minReserveThreshold ?? 500),
            lastReplenishedDate: inv.updated_at ? new Date(inv.updated_at).toISOString().split('T')[0] : '2026-03-12',
            batchOrLotNumber: `LOT-POLAR-${inv.id || inv.item_code || '01'}`,
          }));
          setInventory(mapped);
        }

        if (assetsData.status === 'fulfilled' && Array.isArray(assetsData.value) && assetsData.value.length > 0) {
          const mapped: Asset[] = assetsData.value.map((a: any, idx: number) => ({
            id: a.code || a.id || `AST-${idx + 1}`,
            code: a.code || a.id || `AST-${idx + 1}`,
            stationId: (a.station || 'bharati') as StationId,
            name: a.name,
            type: (a.category || 'Generator') as any,
            status: a.status === 'Operational' ? 'OPERATIONAL' : a.status === 'Service Due' ? 'MAINTENANCE_DUE' : 'CRITICAL_OFFLINE',
            operatingHours: a.hoursTotal,
            maintenanceThresholdHours: a.serviceIntervalHours || 500,
            vibrationIndex: a.vibrationIndex || 1.4,
            healthScore: a.status === 'Operational' ? 95 : 55,
            lastMaintenanceDate: a.lastInspection || '2026-06-15',
            nextMaintenanceDue: '2027-01-15',
            linkedSpareParts: a.sparesStatus === 'Adequate' ? 'In Stock (Warehouse)' : 'Order Requisitioned',
            operatorNotes: `Model ${a.model}. Inspected ${a.lastInspection}.`,
          }));
          setAssets(mapped);
        }

        if (personnelData.status === 'fulfilled' && Array.isArray(personnelData.value) && personnelData.value.length > 0) {
          const mapped: Personnel[] = personnelData.value.map((p: any, idx: number) => ({
            id: p.code || p.id || `PRS-${idx + 1}`,
            name: p.name,
            role: p.role,
            specialization: p.role,
            assignedStationId: (p.station || 'bharati') as StationId,
            currentLocation: p.transitLeg || 'Station Campus',
            rotationType: 'Winter-over Team',
            medicalClearance: p.medicalClearance === 'Class 1 Polar' ? 'CERTIFIED' : 'CONDITIONAL',
            bloodGroup: p.bloodGroup || 'O+ Polar Certified',
            emergencyContact: p.emergencyContact || 'NCPOR Operations Center, Goa (+91-832-2525515)',
            movementTimeline: [],
          }));
          setPersonnel(mapped);
        }

        if (emgData.status === 'fulfilled' && Array.isArray(emgData.value) && emgData.value.length > 0) {
          const mapped: EmergencyIncident[] = emgData.value.map((e: any, idx: number) => ({
            id: e.emergency_code || e.code || e.id || `EMG-DB-${idx + 1}`,
            stationId: (e.station_id || e.station || 'bharati') as StationId,
            type: (e.emergency_type || e.type || 'BLIZZARD') as any,
            severity: (e.severity || 'HIGH') as any,
            title: e.title || (e.description ? (e.description.length > 65 ? e.description.slice(0, 65) + '...' : e.description) : `${e.emergency_type || 'Safety'} Incident`),
            description: e.description || e.situationReport || 'Emergency reported at station.',
            reportedTime: e.detected_at ? new Date(e.detected_at).toLocaleTimeString() : (e.timestamp || 'Active'),
            affectedPersonnelCount: e.casualties || (e.affected_personnel_id ? 1 : 0),
            status: (e.status === 'RESOLVED' || e.status === 'Resolved') ? 'RESOLVED' : (e.status === 'CONTAINED' || e.status === 'Contained') ? 'CONTAINED' : 'ACTIVE',
            incidentCommander: e.reported_by || 'Dr. K. Swaminathan (Station Commander)',
            availableResources: ['Emergency Shelter Alpha', 'Dräger SCBA Units', 'Snowcat Medic Carrier'],
            actionsTaken: Array.isArray(e.actions) ? e.actions.map((a: any) => a.description) : (e.actionDirectives ? e.actionDirectives.split('; ') : []),
          }));
          setEmergencies(mapped);
        }
      } catch (err) {
        console.warn('Database hydration fallback note:', err);
      }
    }

    loadDatabaseData();
    return () => { isMounted = false; };
  }, []);

  // Simulation & Quick Actions
  const [simulatedDays, setSimulatedDays] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to show transient toast feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Reset entire scenario to baseline
  const handleResetSimulation = () => {
    setStations(INITIAL_STATIONS);
    setExpeditions(INITIAL_EXPEDITIONS);
    setContainers(INITIAL_CONTAINERS);
    setVessels(INITIAL_VESSELS);
    setInventory(INITIAL_INVENTORY);
    setAssets(INITIAL_ASSETS);
    setPersonnel(INITIAL_PERSONNEL);
    setEmergencies(INITIAL_EMERGENCIES);
    setActiveBox(1);
    setBox1SubTab('missions');
    setSimulatedDays(0);
    showToast('Mission reset to initial baseline (ISEA-44 initiation).');
  };

  // 5 Primary Quick Actions corresponding to the 5 Boxes
  const handleExecuteSimulationAction = (actionKey: string) => {
    switch (actionKey) {
      // Box 1: Plan & Requirements
      case 'plan_and_requirements':
      case 'create_expedition':
      case 'view_requirements':
        setActiveBox(1);
        setBox1SubTab('missions');
        showToast('Expedition ISEA-44 initialized! Automatic requirement formulation generated: 12,000 kg Food, 30,000 L Fuel, 500 Medical Units, 2,000 kg Equipment.');
        break;

      // Box 2: Polar Map & Navigation
      case 'map_navigation':
      case 'view_map':
        setActiveBox(2);
        showToast('Antarctic Polar Map loaded: Tracking fast-ice moorings, weather overlays, and station telemetry.');
        break;

      // Box 3: Stowage & Voyage Tracking
      case 'stowage_and_voyage':
      case 'optimize_containers':
      case 'track_voyage':
        setVessels((prev) =>
          prev.map((v) =>
            v.id === 'vessel_golovnin'
              ? {
                  ...v,
                  status: 'ARRIVED_ICE_SHELF',
                  currentCoordinates: { lat: -68.8, lng: 75.9 },
                  destinationPort: 'Bharati Station Fast-Ice (Prydz Bay)',
                }
              : v
          )
        );
        setActiveBox(3);
        showToast('Cargo packed into 4 standard polar containers with priority deck staging. MV Vasiliy Golovnin advanced to Fast-Ice boundary at Prydz Bay (68.8°S, 75.9°E).');
        break;

      // Box 4: Resupply & Depletion Simulation
      case 'resupply_and_depletion':
      case 'receive_cargo':
      case 'consume_30_days':
      case 'detect_shortage':
      case 'apply_conservation':
        // 1. Offload containers to Bharati
        setContainers((prev) =>
          prev.map((c) => ({
            ...c,
            status: 'DELIVERED',
            currentLocationName: 'Bharati Station Polar Logistics Apron',
          }))
        );
        handleReceiveShipmentRestock('bharati');

        // 2. Advance 30 days of winter consumption
        setSimulatedDays((d) => d + 30);
        setInventory((prev) =>
          prev.map((item) => {
            if (item.stationId === 'bharati') {
              const consumed = item.dailyConsumptionRate * 30;
              return {
                ...item,
                currentStock: Math.max(0, item.currentStock - consumed),
              };
            }
            return item;
          })
        );

        // 3. Apply AI 12% fuel conservation to resolve deficit
        handleApplyRationing('bharati', 12);
        setActiveBox(4);
        setBox4SubTab('inventory');
        showToast('Station resupplied (+30kL Fuel, +12kkg Food), 30 winter days simulated, and 12% AI fuel rationing applied to avert resupply gap!');
        break;

      // Box 5: Emergency Alert & Command Response
      case 'emergency_and_response':
      case 'trigger_emergency':
      case 'resolve_emergency':
        setEmergencies((prev) => [
          {
            id: `EMG-SIM-${Date.now()}`,
            stationId: 'bharati',
            type: 'GENERATOR_OUTAGE',
            severity: 'CRITICAL',
            title: 'Station APU-2 Thermal Overheat & Controlled Shutdown',
            description: 'Auxiliary generator temperature spiked to 98°C. Automatic FM-200 armed and power decoupled to auxiliary batteries. PistenBully deployed with spare turbocharger.',
            reportedTime: '14:32 UTC (Simulation Drill)',
            affectedPersonnelCount: 12,
            status: 'RESOLVED',
            incidentCommander: 'Dr. P. K. Sen (Station Commander)',
            availableResources: [
              'Automatic FM-200 Fire Suppression (Armed)',
              'Station Medical Trauma Bay on standby',
              'PistenBully 300 Rescue Snowcat (Deployed)',
              'Auxiliary Battery Reserve Bank (Active)',
            ],
            actionsTaken: [
              'APU-2 decoupled from main station electrical grid.',
              'Living Sector 2 mustered; all personnel safe and accounted for.',
              'Spare turbocharger from Container CNT-1025 fitted and tested. Station restored to normal operations.',
            ],
          },
          ...prev.filter((e) => e.id !== 'EMG-SIM-01'),
        ]);
        setActiveBox(5);
        setBox5SubTab('incidents');
        showToast('Emergency drill executed: APU-2 alarm sounded, sector mustered, PistenBully deployed, and station grid safely stabilized!');
        break;

      default:
        break;
    }
  };

  // Cargo status updater
  const handleUpdateContainerStatus = (containerId: string, newStatus: ContainerJourneyStatus) => {
    let loc = 'Mormugao Port Berth 9, Goa';
    if (newStatus === 'LOADED_GOA') loc = 'Mormugao Port Berth 9, Goa';
    else if (newStatus === 'DEPARTED_GOA') loc = 'Arabian Sea (Transit Leg 1)';
    else if (newStatus === 'IN_CAPE_TOWN') loc = 'Port of Cape Town Quay 500';
    else if (newStatus === 'ON_SHIP') loc = 'Southern Ocean Roaring Forties (MV Vasiliy Golovnin)';
    else if (newStatus === 'ARRIVED_ICE_SHELF') loc = 'Fast-Ice Mooring, Prydz Bay Antarctica';
    else if (newStatus === 'DELIVERED') loc = 'Bharati Station Polar Logistics Apron';

    setContainers((prev) =>
      prev.map((c) => {
        if (c.id === containerId) {
          return { ...c, status: newStatus, currentLocationName: loc };
        }
        return c;
      })
    );
    showToast(`Container ${containerId} status advanced to ${newStatus.replace(/_/g, ' ')}`);

    // Async save to Cloud SQL
    updateCargoApi(containerId, { status: newStatus, departurePort: loc }).catch((err) => {
      console.warn('PostgreSQL cargo update notification:', err);
    });
  };

  // Inventory actions
  const handleUpdateStock = (itemId: string, newStock: number) => {
    const prevItem = inventory.find((i) => i.id === itemId);
    const delta = prevItem ? newStock - prevItem.currentStock : 0;

    setInventory((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, currentStock: newStock } : item))
    );

    if (delta !== 0) {
      adjustInventoryStockApi(itemId, delta).catch((err) => {
        console.warn('PostgreSQL inventory update notification:', err);
      });
    }
  };

  const handleUpdateDailyRate = (itemId: string, newRate: number) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, dailyConsumptionRate: newRate } : item))
    );
  };

  const handleReceiveShipmentRestock = (stationId: StationId) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.stationId === stationId) {
          let added = 0;
          if (item.category === 'Fuel') added = 30000;
          else if (item.category === 'Food') added = 12000;
          else if (item.category === 'Medical') added = 400;
          else if (item.category === 'Spare Parts') added = 200;

          if (added > 0) {
            adjustInventoryStockApi(item.id, added).catch(console.warn);
          }
          return { ...item, currentStock: item.currentStock + added };
        }
        return item;
      })
    );
    showToast(`Offload Complete: Bharati Station received +30,000L Fuel and +12,000kg Food supplies.`);
  };

  const handleApplyRationing = (stationId: StationId, percentage: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.stationId === stationId && item.category === 'Fuel') {
          // Adjust daily consumption rate by percentage
          const factor = (100 - percentage) / 100;
          const newRate = Math.max(200, Math.round(500 * factor));
          return { ...item, dailyConsumptionRate: newRate };
        }
        return item;
      })
    );
  };

  // Expedition creation
  const handleCreateExpedition = (newExp: Omit<Expedition, 'id' | 'code' | 'containersAssigned'>) => {
    const id = `EXP-2027-0${expeditions.length + 1}`;
    const code = `ISEA-${43 + expeditions.length + 1}`;
    const created: Expedition = {
      ...newExp,
      id,
      code,
      containersAssigned: ['CNT-1023', 'CNT-1024'],
    };
    setExpeditions((prev) => [created, ...prev]);
    showToast(`Polar Expedition ${code} (${created.name}) created successfully!`);

    // Persist to Cloud SQL
    createMissionApi({
      code,
      name: created.name,
      lead: created.leadScientist || 'Dr. Expedition Leader',
      station: created.destinationStationId,
      startDate: created.startDate,
      endDate: created.endDate,
      priority: 'STRATEGIC',
      status: created.status,
      objectives: created.objective,
      personnelCount: created.personnelCount,
      requiredFuelKl: Math.round(((created.requirements?.fuelL) || 45000) / 1000),
      riskIndex: 'Moderate',
    }).catch((err) => {
      console.warn('PostgreSQL mission insert notification:', err);
    });
  };

  // Asset actions
  const handleUpdateAssetHours = (assetId: string, additionalHours: number) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, operatingHours: a.operatingHours + additionalHours } : a))
    );
    showToast(`Logged +${additionalHours} operating hours.`);
  };

  const handleServiceAsset = (assetId: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              operatingHours: 0,
              healthScore: 99,
              vibrationIndex: 1.2,
              lastMaintenanceDate: new Date().toISOString().slice(0, 10),
            }
          : a
      )
    );
    showToast(`Asset overhaul service executed. Operating meter reset to 0 hrs.`);

    updateAssetStatusApi(assetId, 'Operational', 1.2).catch((err) => {
      console.warn('PostgreSQL asset service notification:', err);
    });
  };

  // Emergency actions
  const handleTriggerEmergency = (incident: Omit<EmergencyIncident, 'id'>) => {
    const id = `EMG-MANUAL-${Date.now()}`;
    setEmergencies((prev) => [{ ...incident, id }, ...prev]);
    setActiveBox(4);
    setBox4SubTab('incidents');
    showToast(`Declared Code Red incident: ${incident.title}`);

    createEmergencyApi({
      code: id,
      type: incident.type,
      station: incident.stationId,
      status: 'Active',
      severity: incident.severity,
      title: incident.title,
      timestamp: incident.reportedTime,
      casualties: incident.affectedPersonnelCount || 0,
      actionDirectives: incident.actionsTaken.join('; '),
      situationReport: incident.description,
    }).catch((err) => {
      console.warn('PostgreSQL emergency insert notification:', err);
    });
  };

  const handleResolveEmergency = (incidentId: string) => {
    setEmergencies((prev) =>
      prev.map((e) => (e.id === incidentId ? { ...e, status: 'RESOLVED' } : e))
    );
    showToast('Emergency marked RESOLVED. Life-support telemetry back to nominal.');

    updateEmergencyApi(incidentId, {
      status: 'Resolved',
      resolvedAt: new Date().toISOString(),
    }).catch((err) => {
      console.warn('PostgreSQL emergency resolve notification:', err);
    });
  };

  const handleExecuteEmergencyAction = (incidentId: string, actionText: string) => {
    setEmergencies((prev) =>
      prev.map((e) =>
        e.id === incidentId
          ? {
              ...e,
              actionsTaken: [...e.actionsTaken, `[${new Date().toISOString().slice(11, 16)} UTC] ${actionText}`],
            }
          : e
      )
    );
    showToast(`Directive executed: ${actionText}`);
  };

  const activeEmergencies = emergencies.filter((e) => e.status === 'ACTIVE');
  const activeBoxItem = COMMAND_BOXES.find((b) => b.id === activeBox);
  const [composeTrigger, setComposeTrigger] = useState<number>(0);

  return (
    <div className="min-h-screen bg-[#f0f5fa] text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Banner - static indicator, no blinking */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-blue-700 border border-blue-400 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-cyan-300" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-blue-200 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main Header with Telemetry & Static Bell */}
      <Header
        stations={stations}
        activeEmergencyCount={activeEmergencies.length}
        onOpenEmergencyModal={() => {
          setActiveBox(5);
          setBox5SubTab('incidents');
        }}
        onNavigateToTab={(tab) => {
          if (tab === 'emergency') {
            setActiveBox(5);
            setBox5SubTab('comms');
          } else if (tab === 'map') {
            setActiveBox(2);
          }
        }}
        simulatedDays={simulatedDays}
        onReset={handleResetSimulation}
        activeBoxTitle={activeBoxItem?.title}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Workspace with Single Collapsible Gmail Navigation Rail */}
      <div className="flex-1 flex w-full overflow-hidden bg-[#f6f8fc]">
        {/* Gmail Navigation Sidebar: expands to full text list (before clicking 3 lines) or collapses to icon rail (after clicking 3 lines) */}
        <GmailSidebar
          sidebarOpen={sidebarOpen}
          activeBox={activeBox}
          onSelectBox={(boxId) => {
            setActiveBox(boxId);
            if (boxId === 1) {
              setBox1SubTab('missions');
            }
          }}
          activeEmergenciesCount={activeEmergencies.length}
          onSelectStation={() => {
            setActiveBox(1);
            setBox1SubTab('stations');
          }}
          isStationsViewActive={activeBox === 1 && box1SubTab === 'stations'}
        />

        {/* Right Main Application Workspace */}
        <main className="flex-1 min-w-0 h-[calc(100vh-61px)] overflow-y-auto px-3 sm:px-5 lg:px-6 py-4 space-y-4">
          {/* BOX 1: Expedition Planning & Requirements (Dashboard is First Page!) */}
          {activeBox === 1 && (
            <div className="space-y-4">
              {box1SubTab === 'missions' ? (
                <ExpeditionPlanning 
                  currentRole={currentRole} 
                  onRoleChange={setCurrentRole}
                  openCreateTrigger={composeTrigger}
                />
              ) : (
                <StationOverview 
                  stations={stations} 
                  personnel={personnel} 
                  inventory={inventory}
                  onReturn={() => setBox1SubTab('missions')} 
                />
              )}
            </div>
          )}

          {/* BOX 2: Polar Navigation & Fast-Ice Moorings (Map as Second Button!) */}
          {activeBox === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Polar Navigation & Fast-Ice Moorings
                    </h2>
                    <p className="text-xs text-slate-500">
                      Antarctic geographic navigation, fast-ice mooring corridors, and research fleet tracking
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-3 shadow-xs">
                <PolarMap
                  stations={stations}
                  vessels={vessels}
                  containers={containers}
                  emergencies={emergencies}
                  showVesselCards={true}
                  mapHeightClassName="relative w-full h-[620px] lg:h-[720px] bg-[#dbeafe] rounded-xl overflow-hidden"
                  onSelectStation={(stId) => {
                    setActiveBox(1);
                    setBox1SubTab('stations');
                  }}
                />
              </div>
            </div>
          )}

          {/* BOX 3: Cargo Manifest & Voyage Tracking */}
          {activeBox === 3 && (
            <div className="space-y-4">
              <CargoTracking
                containers={containers}
                vessels={vessels}
                onUpdateContainerStatus={handleUpdateContainerStatus}
              />
            </div>
          )}

          {/* BOX 4: Station Inventory, Depletion & Assets */}
          {activeBox === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBox4SubTab('inventory')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      box4SubTab === 'inventory'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Station Warehouses & 30-Day Depletion Burn Rate
                  </button>
                  <button
                    onClick={() => setBox4SubTab('assets')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      box4SubTab === 'assets'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Heavy Equipment & Snowcat Machinery ({assets.length})
                  </button>
                </div>
              </div>

              {box4SubTab === 'inventory' ? (
                <InventoryManagement
                  inventory={inventory}
                  stations={stations}
                  onUpdateStock={handleUpdateStock}
                  onUpdateDailyRate={handleUpdateDailyRate}
                  onReceiveShipmentRestock={handleReceiveShipmentRestock}
                  onApplyRationing={handleApplyRationing}
                />
              ) : (
                <AssetManagement
                  assets={assets}
                  stations={stations}
                  onUpdateAssetHours={handleUpdateAssetHours}
                  onServiceAsset={handleServiceAsset}
                />
              )}
            </div>
          )}

          {/* BOX 5: Emergency Incident Command & Safety */}
          {activeBox === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBox5SubTab('incidents')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      box5SubTab === 'incidents'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Incident Command & Emergency Containment
                  </button>
                  <button
                    onClick={() => setBox5SubTab('comms')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      box5SubTab === 'comms'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Polar Communications & Satellite Dispatches
                  </button>
                </div>
              </div>

              {box5SubTab === 'incidents' ? (
                <EmergencyCenter
                  emergencies={emergencies}
                  stations={stations}
                  onTriggerEmergency={handleTriggerEmergency}
                  onResolveEmergency={handleResolveEmergency}
                  onExecuteEmergencyAction={handleExecuteEmergencyAction}
                />
              ) : (
                <CommunicationCenter />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
