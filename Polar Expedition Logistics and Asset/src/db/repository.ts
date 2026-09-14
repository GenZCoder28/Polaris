import fs from 'fs';
import path from 'path';
import { db } from './index.ts';
import { users, missions, cargoItems, inventoryItems, assets, personnel, emergencies } from './schema.ts';
import { eq, sql } from 'drizzle-orm';
import { 
  INITIAL_EXPEDITIONS, 
  INITIAL_CONTAINERS, 
  INITIAL_INVENTORY, 
  INITIAL_ASSETS, 
  INITIAL_PERSONNEL, 
  INITIAL_EMERGENCIES 
} from '../data/initialData.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const OPS_STORE_FILE = path.join(DATA_DIR, 'operations_store.json');

export interface OperationsStoreData {
  missions: any[];
  cargoItems: any[];
  inventoryItems: any[];
  assets: any[];
  personnel: any[];
  emergencies: any[];
  users: any[];
}

function buildInitialStore(): OperationsStoreData {
  const seededMissions = INITIAL_EXPEDITIONS.map((m, idx) => ({
    id: idx + 1,
    code: m.code || m.id,
    name: m.name,
    lead: m.leadScientist || 'Dr. Lead Scientist',
    station: m.destinationStationId || 'bharati',
    startDate: m.startDate,
    endDate: m.endDate,
    priority: 'STRATEGIC',
    status: m.status,
    objectives: m.objective,
    personnelCount: m.personnelCount,
    requiredFuelKl: m.requirements?.fuelL ? Math.round(m.requirements.fuelL / 1000) : 45,
    riskIndex: 'Moderate',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const seededCargo = INITIAL_CONTAINERS.map((c, idx) => ({
    id: idx + 1,
    rfid: c.rfidTag || `RFID-${c.code}`,
    containerNo: c.code,
    cargoType: c.type,
    priority: c.stowagePriority <= 2 ? 'CRITICAL' : 'ROUTINE',
    departurePort: c.currentLocationName,
    destination: c.destinationStationId,
    vessel: 'MV Vasiliy Golovnin',
    voyageId: 'VG-2026-NCPOR',
    eta: '2026-12-14',
    status: c.status,
    tempCurrent: -18.0,
    tempTarget: -20.0,
    weightTons: Math.round((c.currentWeightKg / 1000) * 10) / 10,
    hazmatClass: c.isHazardous ? 'CLASS_9' : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const seededInventory = INITIAL_INVENTORY.map((inv, idx) => {
    const days = inv.dailyConsumptionRate > 0 ? Math.floor(inv.currentStock / inv.dailyConsumptionRate) : 999;
    return {
      id: idx + 1,
      code: inv.id,
      name: inv.name,
      category: inv.category,
      station: inv.stationId,
      stock: inv.currentStock,
      unit: inv.unit,
      minThreshold: inv.minReserveThreshold,
      dailyDepletion: inv.dailyConsumptionRate,
      resupplyWindow: '68 Days (Voyage VG-26)',
      daysRemaining: days,
      status: days <= 14 ? 'Critical' : 'Nominal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const seededAssets = INITIAL_ASSETS.map((a, idx) => ({
    id: idx + 1,
    code: a.id,
    name: a.name,
    category: a.type,
    station: a.stationId,
    model: a.code,
    status: a.status === 'OPERATIONAL' ? 'Operational' : a.status === 'MAINTENANCE_DUE' ? 'Service Due' : 'Fault Alert',
    hoursTotal: a.operatingHours,
    serviceIntervalHours: a.maintenanceThresholdHours,
    hoursSinceService: a.operatingHours % (a.maintenanceThresholdHours || 500),
    vibrationIndex: a.vibrationIndex,
    lastInspection: a.lastMaintenanceDate,
    sparesStatus: 'Adequate',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const seededPersonnel = INITIAL_PERSONNEL.map((p, idx) => ({
    id: idx + 1,
    code: p.id,
    name: p.name,
    role: p.role,
    station: p.assignedStationId,
    status: 'Deployed',
    medicalClearance: p.medicalClearance === 'CERTIFIED' ? 'Class 1 Polar' : 'Re-Eval Due',
    polarCertValidUntil: '2027-11-30',
    transitLeg: p.currentLocation,
    nextRotationDate: '2027-04-15',
    bloodGroup: p.bloodGroup,
    emergencyContact: p.emergencyContact,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const seededEmergencies = INITIAL_EMERGENCIES.map((e, idx) => ({
    id: idx + 1,
    code: e.id,
    type: e.type,
    station: e.stationId,
    status: e.status === 'ACTIVE' ? 'Active' : e.status === 'CONTAINED' ? 'Contained' : 'Drill',
    severity: e.severity,
    title: e.title,
    timestamp: e.reportedTime,
    casualties: e.affectedPersonnelCount || 0,
    actionDirectives: e.actionsTaken.join('; '),
    situationReport: e.description,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const seededUsers = [
    {
      id: 1,
      uid: 'uid-expedition-manager',
      email: 'manager@ncpor.gov.in',
      displayName: 'Dr. Rajesh Sharma (Expedition Manager)',
      role: 'Expedition Manager',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      uid: 'uid-viewer',
      email: 'viewer@ncpor.res.in',
      displayName: 'Scientific Observer (Viewer)',
      role: 'VIEWER',
      createdAt: new Date().toISOString(),
    }
  ];

  return {
    missions: seededMissions,
    cargoItems: seededCargo,
    inventoryItems: seededInventory,
    assets: seededAssets,
    personnel: seededPersonnel,
    emergencies: seededEmergencies,
    users: seededUsers,
  };
}

export function ensureOperationsStore(): OperationsStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(OPS_STORE_FILE)) {
      const initial = buildInitialStore();
      fs.writeFileSync(OPS_STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(OPS_STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.missions || parsed.missions.length === 0) {
      const initial = buildInitialStore();
      fs.writeFileSync(OPS_STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    return parsed;
  } catch (err) {
    console.warn('Fallback loading operations store in memory:', err);
    return buildInitialStore();
  }
}

export function saveOperationsStore(data: OperationsStoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(OPS_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save operations store:', err);
  }
}

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------
export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  if (db) {
    try {
      const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (existing.length > 0) {
        if (displayName && existing[0].displayName !== displayName) {
          const updated = await db.update(users)
            .set({ displayName, email })
            .where(eq(users.uid, uid))
            .returning();
          return updated[0];
        }
        return existing[0];
      }
      const created = await db.insert(users)
        .values({
          uid,
          email,
          displayName: displayName || email.split('@')[0],
          role: 'Expedition Logistics Coordinator',
        })
        .returning();
      return created[0];
    } catch (error: any) {
      console.warn('Database user sync notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  let user = store.users.find(u => u.uid === uid || u.email === email);
  if (user) {
    if (displayName && user.displayName !== displayName) {
      user.displayName = displayName;
      user.email = email;
      saveOperationsStore(store);
    }
    return user;
  }

  const newUser = {
    id: store.users.length + 1,
    uid,
    email,
    displayName: displayName || email.split('@')[0],
    role: 'Expedition Logistics Coordinator',
    createdAt: new Date().toISOString(),
  };
  store.users.push(newUser);
  saveOperationsStore(store);
  return newUser;
}

// -------------------------------------------------------------
// MISSIONS
// -------------------------------------------------------------
export async function getMissions() {
  if (db) {
    try {
      return await db.select().from(missions).orderBy(missions.id);
    } catch (error: any) {
      console.warn('Database missions query notice, using local store:', error.message);
    }
  }
  const store = ensureOperationsStore();
  return store.missions;
}

export async function createMission(data: typeof missions.$inferInsert) {
  let createdItem: any = null;
  if (db) {
    try {
      const result = await db.insert(missions).values(data).returning();
      createdItem = result[0];
    } catch (error: any) {
      console.warn('Database mission insert notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const newItem = {
    id: store.missions.length + 1,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.missions.push(newItem);
  saveOperationsStore(store);
  return createdItem || newItem;
}

export async function updateMission(code: string, data: Partial<typeof missions.$inferInsert>) {
  let updatedItem: any = null;
  if (db) {
    try {
      const result = await db.update(missions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(missions.code, code))
        .returning();
      updatedItem = result[0];
    } catch (error: any) {
      console.warn('Database mission update notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const idx = store.missions.findIndex(m => m.code === code);
  if (idx !== -1) {
    store.missions[idx] = {
      ...store.missions[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveOperationsStore(store);
    return updatedItem || store.missions[idx];
  }
  return updatedItem;
}

// -------------------------------------------------------------
// CARGO ITEMS
// -------------------------------------------------------------
export async function getCargoItems() {
  if (db) {
    try {
      return await db.select().from(cargoItems).orderBy(cargoItems.id);
    } catch (error: any) {
      console.warn('Database cargo query notice, using local store:', error.message);
    }
  }
  const store = ensureOperationsStore();
  return store.cargoItems;
}

export async function createCargoItem(data: typeof cargoItems.$inferInsert) {
  let createdItem: any = null;
  if (db) {
    try {
      const result = await db.insert(cargoItems).values(data).returning();
      createdItem = result[0];
    } catch (error: any) {
      console.warn('Database cargo insert notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const newItem = {
    id: store.cargoItems.length + 1,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.cargoItems.push(newItem);
  saveOperationsStore(store);
  return createdItem || newItem;
}

export async function updateCargoItem(rfid: string, data: Partial<typeof cargoItems.$inferInsert>) {
  let updatedItem: any = null;
  if (db) {
    try {
      const result = await db.update(cargoItems)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(cargoItems.rfid, rfid))
        .returning();
      updatedItem = result[0];
    } catch (error: any) {
      console.warn('Database cargo update notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const idx = store.cargoItems.findIndex(c => c.rfid === rfid || c.containerNo === rfid);
  if (idx !== -1) {
    store.cargoItems[idx] = {
      ...store.cargoItems[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveOperationsStore(store);
    return updatedItem || store.cargoItems[idx];
  }
  return updatedItem;
}

// -------------------------------------------------------------
// INVENTORY
// -------------------------------------------------------------
export async function getInventory() {
  if (db) {
    try {
      return await db.select().from(inventoryItems).orderBy(inventoryItems.id);
    } catch (error: any) {
      console.warn('Database inventory query notice, using local store:', error.message);
    }
  }
  const store = ensureOperationsStore();
  return store.inventoryItems;
}

export async function createInventoryItem(data: typeof inventoryItems.$inferInsert) {
  let createdItem: any = null;
  if (db) {
    try {
      const result = await db.insert(inventoryItems).values(data).returning();
      createdItem = result[0];
    } catch (error: any) {
      console.warn('Database inventory insert notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const newItem = {
    id: store.inventoryItems.length + 1,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.inventoryItems.push(newItem);
  saveOperationsStore(store);
  return createdItem || newItem;
}

export async function updateInventoryStock(code: string, delta: number) {
  let updatedItem: any = null;
  if (db) {
    try {
      const item = await db.select().from(inventoryItems).where(eq(inventoryItems.code, code)).limit(1);
      if (item.length) {
        const newStock = Math.max(0, item[0].stock + delta);
        const newDays = item[0].dailyDepletion > 0 ? Math.floor(newStock / item[0].dailyDepletion) : 999;
        const newStatus = newDays <= 14 ? 'Severe Deficit' : newDays <= 45 ? 'Critical' : 'Nominal';

        const result = await db.update(inventoryItems)
          .set({ 
            stock: newStock, 
            daysRemaining: newDays, 
            status: newStatus,
            updatedAt: new Date() 
          })
          .where(eq(inventoryItems.code, code))
          .returning();
        updatedItem = result[0];
      }
    } catch (error: any) {
      console.warn('Database inventory update notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const item = store.inventoryItems.find(i => i.code === code);
  if (item) {
    item.stock = Math.max(0, (item.stock || 0) + delta);
    item.daysRemaining = item.dailyDepletion > 0 ? Math.floor(item.stock / item.dailyDepletion) : 999;
    item.status = item.daysRemaining <= 14 ? 'Severe Deficit' : item.daysRemaining <= 45 ? 'Critical' : 'Nominal';
    item.updatedAt = new Date().toISOString();
    saveOperationsStore(store);
    return updatedItem || item;
  }
  return updatedItem;
}

// -------------------------------------------------------------
// ASSETS
// -------------------------------------------------------------
export async function getAssets() {
  if (db) {
    try {
      return await db.select().from(assets).orderBy(assets.id);
    } catch (error: any) {
      console.warn('Database assets query notice, using local store:', error.message);
    }
  }
  const store = ensureOperationsStore();
  return store.assets;
}

export async function createAsset(data: typeof assets.$inferInsert) {
  let createdItem: any = null;
  if (db) {
    try {
      const result = await db.insert(assets).values(data).returning();
      createdItem = result[0];
    } catch (error: any) {
      console.warn('Database asset insert notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const newItem = {
    id: store.assets.length + 1,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.assets.push(newItem);
  saveOperationsStore(store);
  return createdItem || newItem;
}

export async function updateAssetStatus(code: string, status: string, vibrationIndex?: number) {
  let updatedItem: any = null;
  if (db) {
    try {
      const updates: Partial<typeof assets.$inferInsert> = { status, updatedAt: new Date() };
      if (vibrationIndex !== undefined) {
        updates.vibrationIndex = vibrationIndex;
      }
      const result = await db.update(assets)
        .set(updates)
        .where(eq(assets.code, code))
        .returning();
      updatedItem = result[0];
    } catch (error: any) {
      console.warn('Database asset update notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const item = store.assets.find(a => a.code === code);
  if (item) {
    item.status = status;
    if (vibrationIndex !== undefined) {
      item.vibrationIndex = vibrationIndex;
    }
    item.updatedAt = new Date().toISOString();
    saveOperationsStore(store);
    return updatedItem || item;
  }
  return updatedItem;
}

// -------------------------------------------------------------
// PERSONNEL
// -------------------------------------------------------------
export async function getPersonnel() {
  if (db) {
    try {
      return await db.select().from(personnel).orderBy(personnel.id);
    } catch (error: any) {
      console.warn('Database personnel query notice, using local store:', error.message);
    }
  }
  const store = ensureOperationsStore();
  return store.personnel;
}

export async function createPersonnel(data: typeof personnel.$inferInsert) {
  let createdItem: any = null;
  if (db) {
    try {
      const result = await db.insert(personnel).values(data).returning();
      createdItem = result[0];
    } catch (error: any) {
      console.warn('Database personnel insert notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const newItem = {
    id: store.personnel.length + 1,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.personnel.push(newItem);
  saveOperationsStore(store);
  return createdItem || newItem;
}

// -------------------------------------------------------------
// EMERGENCIES
// -------------------------------------------------------------
export async function getEmergencies() {
  if (db) {
    try {
      return await db.select().from(emergencies).orderBy(emergencies.id);
    } catch (error: any) {
      console.warn('Database emergencies query notice, using local store:', error.message);
    }
  }
  const store = ensureOperationsStore();
  return store.emergencies;
}

export async function createEmergency(data: typeof emergencies.$inferInsert) {
  let createdItem: any = null;
  if (db) {
    try {
      const result = await db.insert(emergencies).values(data).returning();
      createdItem = result[0];
    } catch (error: any) {
      console.warn('Database emergency insert notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const newItem = {
    id: store.emergencies.length + 1,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.emergencies.push(newItem);
  saveOperationsStore(store);
  return createdItem || newItem;
}

export async function updateEmergency(code: string, data: Partial<typeof emergencies.$inferInsert>) {
  let updatedItem: any = null;
  if (db) {
    try {
      const result = await db.update(emergencies)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(emergencies.code, code))
        .returning();
      updatedItem = result[0];
    } catch (error: any) {
      console.warn('Database emergency update notice, using local store:', error.message);
    }
  }

  const store = ensureOperationsStore();
  const idx = store.emergencies.findIndex(e => e.code === code);
  if (idx !== -1) {
    store.emergencies[idx] = {
      ...store.emergencies[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveOperationsStore(store);
    return updatedItem || store.emergencies[idx];
  }
  return updatedItem;
}

// -------------------------------------------------------------
// SEED INITIAL DATA IF EMPTY (Cloud SQL / PostgreSQL)
// -------------------------------------------------------------
export async function seedInitialDataIfEmpty() {
  // Always ensure local operations store is available and populated
  ensureOperationsStore();

  if (!db) {
    return;
  }

  try {
    const existingMissions = await db.select({ count: sql<number>`count(*)` }).from(missions);
    if (Number(existingMissions[0]?.count || 0) === 0) {
      console.log('Seeding initial missions to Cloud SQL PostgreSQL...');
      for (const m of INITIAL_EXPEDITIONS) {
        await db.insert(missions).values({
          code: m.code || m.id,
          name: m.name,
          lead: m.leadScientist || 'Dr. Lead Scientist',
          station: m.destinationStationId || 'bharati',
          startDate: m.startDate,
          endDate: m.endDate,
          priority: 'STRATEGIC',
          status: m.status,
          objectives: m.objective,
          personnelCount: m.personnelCount,
          requiredFuelKl: m.requirements?.fuelL ? Math.round(m.requirements.fuelL / 1000) : 45,
          riskIndex: 'Moderate',
        }).onConflictDoNothing();
      }
    }

    const existingCargo = await db.select({ count: sql<number>`count(*)` }).from(cargoItems);
    if (Number(existingCargo[0]?.count || 0) === 0) {
      console.log('Seeding initial cargo to Cloud SQL PostgreSQL...');
      for (const c of INITIAL_CONTAINERS) {
        await db.insert(cargoItems).values({
          rfid: c.rfidTag || `RFID-${c.code}`,
          containerNo: c.code,
          cargoType: c.type,
          priority: c.stowagePriority <= 2 ? 'CRITICAL' : 'ROUTINE',
          departurePort: c.currentLocationName,
          destination: c.destinationStationId,
          vessel: 'MV Vasiliy Golovnin',
          voyageId: 'VG-2026-NCPOR',
          eta: '2026-12-14',
          status: c.status,
          tempCurrent: -18.0,
          tempTarget: -20.0,
          weightTons: Math.round((c.currentWeightKg / 1000) * 10) / 10,
          hazmatClass: c.isHazardous ? 'CLASS_9' : null,
        }).onConflictDoNothing();
      }
    }

    const existingInventory = await db.select({ count: sql<number>`count(*)` }).from(inventoryItems);
    if (Number(existingInventory[0]?.count || 0) === 0) {
      console.log('Seeding initial inventory to Cloud SQL PostgreSQL...');
      for (const inv of INITIAL_INVENTORY) {
        const days = inv.dailyConsumptionRate > 0 ? Math.floor(inv.currentStock / inv.dailyConsumptionRate) : 999;
        await db.insert(inventoryItems).values({
          code: inv.id,
          name: inv.name,
          category: inv.category,
          station: inv.stationId,
          stock: inv.currentStock,
          unit: inv.unit,
          minThreshold: inv.minReserveThreshold,
          dailyDepletion: inv.dailyConsumptionRate,
          resupplyWindow: '68 Days (Voyage VG-26)',
          daysRemaining: days,
          status: days <= 14 ? 'Critical' : 'Nominal',
        }).onConflictDoNothing();
      }
    }

    const existingAssets = await db.select({ count: sql<number>`count(*)` }).from(assets);
    if (Number(existingAssets[0]?.count || 0) === 0) {
      console.log('Seeding initial assets to Cloud SQL PostgreSQL...');
      for (const a of INITIAL_ASSETS) {
        await db.insert(assets).values({
          code: a.id,
          name: a.name,
          category: a.type,
          station: a.stationId,
          model: a.code,
          status: a.status === 'OPERATIONAL' ? 'Operational' : a.status === 'MAINTENANCE_DUE' ? 'Service Due' : 'Fault Alert',
          hoursTotal: a.operatingHours,
          serviceIntervalHours: a.maintenanceThresholdHours,
          hoursSinceService: a.operatingHours % (a.maintenanceThresholdHours || 500),
          vibrationIndex: a.vibrationIndex,
          lastInspection: a.lastMaintenanceDate,
          sparesStatus: 'Adequate',
        }).onConflictDoNothing();
      }
    }

    const existingPersonnel = await db.select({ count: sql<number>`count(*)` }).from(personnel);
    if (Number(existingPersonnel[0]?.count || 0) === 0) {
      console.log('Seeding initial personnel to Cloud SQL PostgreSQL...');
      for (const p of INITIAL_PERSONNEL) {
        await db.insert(personnel).values({
          code: p.id,
          name: p.name,
          role: p.role,
          station: p.assignedStationId,
          status: 'Deployed',
          medicalClearance: p.medicalClearance === 'CERTIFIED' ? 'Class 1 Polar' : 'Re-Eval Due',
          polarCertValidUntil: '2027-11-30',
          transitLeg: p.currentLocation,
          nextRotationDate: '2027-04-15',
          bloodGroup: p.bloodGroup,
          emergencyContact: p.emergencyContact,
        }).onConflictDoNothing();
      }
    }

    const existingEmergencies = await db.select({ count: sql<number>`count(*)` }).from(emergencies);
    if (Number(existingEmergencies[0]?.count || 0) === 0) {
      console.log('Seeding initial emergencies to Cloud SQL PostgreSQL...');
      for (const e of INITIAL_EMERGENCIES) {
        await db.insert(emergencies).values({
          code: e.id,
          type: e.type,
          station: e.stationId,
          status: e.status === 'ACTIVE' ? 'Active' : e.status === 'CONTAINED' ? 'Contained' : 'Drill',
          severity: e.severity,
          title: e.title,
          timestamp: e.reportedTime,
          casualties: e.affectedPersonnelCount || 0,
          actionDirectives: e.actionsTaken.join('; '),
          situationReport: e.description,
          resolvedAt: null,
        }).onConflictDoNothing();
      }
    }
  } catch (error: any) {
    console.warn('Non-blocking notice during Cloud SQL initial seed:', error.message);
  }
}
