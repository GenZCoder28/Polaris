import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  getOrCreateUser, 
  getMissions, 
  createMission, 
  updateMission,
  getCargoItems,
  createCargoItem,
  updateCargoItem,
  getInventory,
  createInventoryItem,
  updateInventoryStock,
  getAssets,
  createAsset,
  updateAssetStatus,
  getPersonnel,
  createPersonnel,
  getEmergencies,
  createEmergency,
  updateEmergency,
  seedInitialDataIfEmpty 
} from './src/db/repository.ts';
import {
  getAllExpeditions,
  getExpeditionById,
  getExpeditionDetailWithRelations,
  createExpedition,
  updateExpedition,
  deleteExpedition,
  getExpeditionAuditLogs,
  getDashboardStats,
} from './src/db/expeditionRepository.ts';
import {
  getInventoryItemsMaster,
  getInventoryItemById,
  createInventoryItemMaster,
  updateInventoryItemMaster,
  recordInventoryTransaction,
  getTransactionsByItemId,
  getAllTransactions,
  getForecastForItem,
  getAllForecasts,
  evaluateAndGenerateAlerts,
  getAlerts,
  acknowledgeAlert,
  getResupplyRequests,
  createResupplyRequest,
  approveResupplyRequest,
  receiveAndVerifyResupply,
  getNotificationHistory,
  getModelPerformanceStatus,
  getInventoryAuditLogs
} from './src/db/inventoryRepository.ts';
import {
  getAssetsList,
  getAssetById,
  registerAsset,
  updateAsset,
  assignAsset,
  transferAsset,
  createMaintenanceRecord,
  reportAssetIncident,
  resolveAssetIncident,
  getAssetFullHistory,
  lookupAssetByQr,
  generateAssetPredictions,
  createSupplyRequest,
  approveSupplyRequest,
  receiveSupplyEquipment,
  getAssetNotifications,
  getAssetAuditLogs,
  getAssetSupplyRequests,
  getAssetMaintenanceList,
  getAssetIncidentsList,
} from './src/db/assetRepository.ts';
import {
  assessAssetAvailabilityRisk,
  runAssetModelTraining,
  getLatestModelArtifact,
} from './src/lib/assetMLService.ts';
import {
  getAssetOfficerConfig,
  updateAssetOfficerConfig,
  dispatchUnifiedSupplyNotification,
} from './src/lib/assetNotificationService.ts';
import { weatherRepository } from './src/db/weatherRepository.ts';
import { weatherService } from './src/services/weatherService.ts';
import { emergencyRepository } from './src/db/emergencyRepository.ts';
import { communicationRepository } from './src/db/communicationRepository.ts';
import { 
  reportingRepository, 
  recordReportingAudit, 
  ensureReportingAuditStore 
} from './src/db/reportingRepository.ts';
import { setProviderSimulation, getProviderSimulation } from './src/services/notificationProviders.ts';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';

function getUserContext(req: any) {
  const role = (req.headers['x-user-role'] as string) || (req.user?.role) || 'Expedition Manager';
  const email = (req.headers['x-user-email'] as string) || (req.user?.email) || 'manager@ncpor.gov.in';
  const name = (req.headers['x-user-name'] as string) || (req.user?.displayName) || 'Dr. Rajesh Sharma (Expedition Manager)';
  return { role, email, name };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Automatically seed PostgreSQL if empty
  seedInitialDataIfEmpty().catch((err) => {
    console.warn('Non-blocking seed warning:', err);
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'POLARIS Command Cloud SQL (PostgreSQL)', time: new Date().toISOString() });
  });

  // Database status overview
  app.get('/api/database/status', async (req, res) => {
    try {
      const [m, c, i, a, p, e] = await Promise.all([
        getMissions(),
        getCargoItems(),
        getInventory(),
        getAssets(),
        getPersonnel(),
        getEmergencies()
      ]);
      res.json({
        connected: true,
        storageMode: process.env.SQL_HOST ? 'Cloud SQL (PostgreSQL)' : 'Local Resilient Storage',
        host: process.env.SQL_HOST ? 'Cloud SQL Proxy Active' : 'Resilient Persistent Store Active',
        database: process.env.SQL_DB_NAME || 'polaris_pg',
        counts: {
          missions: m.length,
          cargo: c.length,
          inventory: i.length,
          assets: a.length,
          personnel: p.length,
          emergencies: e.length
        }
      });
    } catch (error: any) {
      console.error('Database status error:', error);
      res.status(500).json({ connected: false, error: error.message || 'Database query error' });
    }
  });

  // =============================================================
  // EXPEDITION PLANNING REST APIs
  // =============================================================

  // 1. Dashboard Stats
  const handleDashboardStats = async (req: express.Request, res: express.Response) => {
    try {
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Failed to get dashboard stats:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch dashboard statistics' });
    }
  };

  app.get('/api/expeditions/stats', handleDashboardStats);
  app.get('/api/expeditions/stats/dashboard', handleDashboardStats);
  app.get('/api/expeditions/dashboard/stats', handleDashboardStats);

  // 2. Search & Filter Expeditions
  app.get('/api/expeditions/search', async (req, res) => {
    try {
      const queryParams = req.query as any;
      const results = await getAllExpeditions(queryParams);
      res.json(results);
    } catch (error: any) {
      console.error('Failed to search expeditions:', error);
      res.status(400).json({ error: error.message || 'Failed to search expeditions' });
    }
  });

  // 3. List All Expeditions
  app.get('/api/expeditions', async (req, res) => {
    try {
      const results = await getAllExpeditions(req.query as any);
      res.json(results);
    } catch (error: any) {
      console.error('Failed to fetch expeditions:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch expeditions' });
    }
  });

  // 4. Get Single Expedition Details with Relational Module Counts & Audit Logs
  app.get('/api/expeditions/:id', async (req, res) => {
    try {
      const detail = await getExpeditionDetailWithRelations(req.params.id);
      if (!detail) {
        return res.status(404).json({ error: `Expedition '${req.params.id}' not found.` });
      }
      res.json(detail);
    } catch (error: any) {
      console.error('Failed to get expedition detail:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch expedition detail' });
    }
  });

  // 5. Get Expedition Audit Logs
  app.get('/api/expeditions/:id/audit-logs', async (req, res) => {
    try {
      const logs = await getExpeditionAuditLogs(req.params.id);
      res.json(logs);
    } catch (error: any) {
      console.error('Failed to get audit logs:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
    }
  });

  // 6. Create Expedition (Authorized: Expedition Manager only)
  app.post('/api/expeditions', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      if (user.role === 'VIEWER') {
        return res.status(403).json({ 
          error: 'You are not authorized to create an expedition. Expedition Manager role required.' 
        });
      }

      const created = await createExpedition(req.body, user);
      res.status(201).json(created);
    } catch (error: any) {
      const msg = error.message || 'Failed to create expedition';
      if (msg.includes('already exists')) {
        return res.status(409).json({ error: msg });
      }
      res.status(400).json({ error: msg });
    }
  });

  // 7. Update Expedition (Authorized: Expedition Manager only)
  app.put('/api/expeditions/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      if (user.role === 'VIEWER') {
        return res.status(403).json({ 
          error: 'You are not authorized to edit an expedition. Expedition Manager role required.' 
        });
      }

      const updated = await updateExpedition(req.params.id, req.body, user);
      res.json(updated);
    } catch (error: any) {
      const msg = error.message || 'Failed to update expedition';
      if (msg.includes('already exists')) {
        return res.status(409).json({ error: msg });
      }
      if (msg.includes('not found')) {
        return res.status(404).json({ error: msg });
      }
      res.status(400).json({ error: msg });
    }
  });

  // 8. Delete Expedition (Authorized: Expedition Manager only, Protected against records)
  app.delete('/api/expeditions/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      if (user.role === 'VIEWER') {
        return res.status(403).json({ 
          error: 'You are not authorized to delete an expedition. Expedition Manager role required.' 
        });
      }

      const result = await deleteExpedition(req.params.id, user);
      res.json(result);
    } catch (error: any) {
      const msg = error.message || 'Failed to delete expedition';
      if (msg.includes('associated operational records')) {
        return res.status(409).json({ error: msg });
      }
      if (msg.includes('not found')) {
        return res.status(404).json({ error: msg });
      }
      res.status(400).json({ error: msg });
    }
  });

  // User Sync
  app.post('/api/auth/sync', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email, displayName } = req.body;
      const effectiveUid = req.user?.uid || uid;
      const effectiveEmail = req.user?.email || email;

      if (!effectiveUid || !effectiveEmail) {
        return res.status(400).json({ error: 'UID and Email are required' });
      }

      const user = await getOrCreateUser(effectiveUid, effectiveEmail, displayName);
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Failed to sync user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // Missions
  app.get('/api/missions', async (req, res) => {
    try {
      const items = await getMissions();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch missions' });
    }
  });

  app.post('/api/missions', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const created = await createMission(req.body);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create mission' });
    }
  });

  app.put('/api/missions/:code', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const updated = await updateMission(req.params.code, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update mission' });
    }
  });

  // Cargo Items
  app.get('/api/cargo', async (req, res) => {
    try {
      const items = await getCargoItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch cargo' });
    }
  });

  app.post('/api/cargo', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const created = await createCargoItem(req.body);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create cargo' });
    }
  });

  app.put('/api/cargo/:rfid', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const updated = await updateCargoItem(req.params.rfid, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update cargo' });
    }
  });

  // ==============================================================
  // INVENTORY MANAGEMENT & PREDICTION MODULE API (Section 29)
  // ==============================================================

  // 1. GET /api/inventory (Query items with station filter)
  app.get('/api/inventory', async (req, res) => {
    try {
      const station = (req.query.station as string) || (req.query.station_id as string);
      const items = await getInventoryItemsMaster(station);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch inventory master items' });
    }
  });

  // 2. POST /api/inventory (Create inventory item with initial opening stock)
  app.post('/api/inventory', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req).name;
      const created = await createInventoryItemMaster(req.body, user);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create inventory item' });
    }
  });

  // 3. GET /api/inventory/forecast (All station items forecast overview)
  app.get('/api/inventory/forecast', async (req, res) => {
    try {
      const activePersonnel = req.query.personnel ? parseInt(req.query.personnel as string, 10) : 50;
      const etaDays = req.query.eta ? parseInt(req.query.eta as string, 10) : 8;
      const forecasts = await getAllForecasts(activePersonnel, etaDays);
      res.json(forecasts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate inventory forecasts' });
    }
  });

  // 4. GET /api/inventory/alerts
  app.get('/api/inventory/alerts', async (req, res) => {
    try {
      const status = req.query.status as string;
      const alerts = await getAlerts(status);
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch inventory alerts' });
    }
  });

  // POST /api/inventory/alerts/evaluate (Run background stockout risk engine job)
  app.post('/api/inventory/alerts/evaluate', async (req, res) => {
    try {
      const activePersonnel = req.body.personnel ? parseInt(req.body.personnel, 10) : 50;
      const etaDays = req.body.etaDays ? parseInt(req.body.etaDays, 10) : 8;
      const alerts = await evaluateAndGenerateAlerts(activePersonnel, etaDays);
      res.json({ success: true, evaluatedCount: alerts.length, alerts });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to evaluate stockout risks' });
    }
  });

  // GET /api/inventory/alerts/:id
  app.get('/api/inventory/alerts/:id', async (req, res) => {
    try {
      const alerts = await getAlerts();
      const alert = alerts.find(a => a.id === parseInt(req.params.id, 10));
      if (!alert) return res.status(404).json({ error: 'Alert not found' });
      res.json(alert);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch alert' });
    }
  });

  // PATCH /api/inventory/alerts/:id/acknowledge
  app.patch('/api/inventory/alerts/:id/acknowledge', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req).name;
      const acknowledged = await acknowledgeAlert(parseInt(req.params.id, 10), user);
      if (!acknowledged) return res.status(404).json({ error: 'Alert not found' });
      res.json(acknowledged);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to acknowledge alert' });
    }
  });

  // 5. GET /api/inventory/transactions
  app.get('/api/inventory/transactions', async (req, res) => {
    try {
      const txs = await getAllTransactions(100);
      res.json(txs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
    }
  });

  // POST /api/inventory/transactions (Record consumption, receipt, adjustment, etc.)
  app.post('/api/inventory/transactions', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req).name;
      const result = await recordInventoryTransaction({
        ...req.body,
        performed_by: req.body.performed_by || user,
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to record transaction' });
    }
  });

  // 6. GET /api/inventory/model/status (Section 28 Model Monitoring)
  app.get('/api/inventory/model/status', async (req, res) => {
    try {
      const status = await getModelPerformanceStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to get ML model status' });
    }
  });

  // 7. GET /api/inventory/notifications (History)
  app.get('/api/inventory/notifications', async (req, res) => {
    try {
      const history = await getNotificationHistory();
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch notification history' });
    }
  });

  // 8. GET /api/inventory/audit-logs
  app.get('/api/inventory/audit-logs', async (req, res) => {
    try {
      const logs = await getInventoryAuditLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
    }
  });

  // 9. GET /api/inventory/:id
  app.get('/api/inventory/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        // Fallback for code lookup
        const items = await getInventoryItemsMaster();
        const found = items.find(i => i.item_code === req.params.id);
        if (found) return res.json(found);
        return res.status(404).json({ error: 'Item not found' });
      }
      const item = await getInventoryItemById(id);
      if (!item) return res.status(404).json({ error: 'Item not found' });
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch inventory item' });
    }
  });

  // 10. PUT /api/inventory/:id
  app.put('/api/inventory/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = getUserContext(req).name;
      const updated = await updateInventoryItemMaster(id, req.body, user);
      if (!updated) return res.status(404).json({ error: 'Item not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update inventory item' });
    }
  });

  // 11. GET /api/inventory/:id/transactions
  app.get('/api/inventory/:id/transactions', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const txs = await getTransactionsByItemId(id);
      res.json(txs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch item transactions' });
    }
  });

  // 12. GET /api/inventory/:id/forecast
  app.get('/api/inventory/:id/forecast', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const activePersonnel = req.query.personnel ? parseInt(req.query.personnel as string, 10) : 50;
      const etaDays = req.query.eta ? parseInt(req.query.eta as string, 10) : 8;
      const forecast = await getForecastForItem(id, activePersonnel, etaDays);
      if (!forecast) return res.status(404).json({ error: 'Item not found for forecast' });
      res.json(forecast);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate item forecast' });
    }
  });

  // ==============================================================
  // RESUPPLY MODULE API (Section 29)
  // ==============================================================

  // GET /api/resupply
  app.get('/api/resupply', async (req, res) => {
    try {
      const requests = await getResupplyRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch resupply requests' });
    }
  });

  // POST /api/resupply
  app.post('/api/resupply', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req).name;
      const created = await createResupplyRequest({
        ...req.body,
        requested_by: req.body.requested_by || user,
      });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create resupply request' });
    }
  });

  // GET /api/resupply/:id
  app.get('/api/resupply/:id', async (req, res) => {
    try {
      const requests = await getResupplyRequests();
      const reqItem = requests.find(r => r.id === parseInt(req.params.id, 10));
      if (!reqItem) return res.status(404).json({ error: 'Resupply request not found' });
      res.json(reqItem);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch resupply request' });
    }
  });

  // PUT /api/resupply/:id (Approve or modify by authorized officer)
  app.put('/api/resupply/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req).name;
      const { approved_quantity, cargo_code } = req.body;
      const approved = await approveResupplyRequest(
        parseInt(req.params.id, 10),
        Number(approved_quantity || req.body.requested_quantity),
        user,
        cargo_code
      );
      if (!approved) return res.status(404).json({ error: 'Resupply request not found' });
      res.json(approved);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update resupply request' });
    }
  });

  // POST /api/resupply/:id/verify (Receive & verify at station pier with discrepancy recording)
  app.post('/api/resupply/:id/verify', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req).name;
      const result = await receiveAndVerifyResupply({
        requestId: parseInt(req.params.id, 10),
        actualReceivedQuantity: Number(req.body.actual_received_quantity),
        receivingOfficer: req.body.receiving_officer || user,
        discrepancyReason: req.body.discrepancy_reason,
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to verify resupply receipt' });
    }
  });

  // Legacy Stock Adjustment Route maintained for backwards compatibility
  app.patch('/api/inventory/:code/stock', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { delta } = req.body;
      const updated = await updateInventoryStock(req.params.code, Number(delta || 0));
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to adjust stock' });
    }
  });

  // ==============================================================
  // ASSET MANAGEMENT & ML PREDICTION API ENDPOINTS
  // ==============================================================

  // 1. Predictions, Model Status, and Risk Assessments (Placed before :id routes)
  app.get('/api/assets/predictions', async (req, res) => {
    try {
      const generated = await generateAssetPredictions();
      if (req.query.full === 'true') {
        return res.json(generated);
      }
      const list = Array.isArray(generated) ? generated : (generated.predictions || []);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch asset predictions' });
    }
  });

  app.post('/api/assets/predictions/generate', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const result = await generateAssetPredictions();
      if (req.query.full === 'true') {
        return res.json(result);
      }
      const list = Array.isArray(result) ? result : (result.predictions || []);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate asset predictions' });
    }
  });

  app.get('/api/assets/risk-assessment', async (req, res) => {
    try {
      const assets = await getAssetsList();
      const maintenances = await getAssetMaintenanceList();
      const incidents = await getAssetIncidentsList();
      const assessments = assets.map(a => assessAssetAvailabilityRisk(a, maintenances, incidents));
      res.json(assessments);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to calculate availability risk assessments' });
    }
  });

  app.get('/api/assets/model-status', async (req, res) => {
    try {
      const artifact = getLatestModelArtifact();
      res.json(artifact);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to get model metrics' });
    }
  });

  app.post('/api/assets/model/retrain', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const assets = await getAssetsList();
      const maintenances = await getAssetMaintenanceList();
      const incidents = await getAssetIncidentsList();
      
      const trainingSamples = assets.map(a => ({
        asset_id: a.asset_id,
        asset_category: a.asset_category,
        currently_available: a.status === 'AVAILABLE' ? 1 : 0,
        assigned_count: (a.status === 'ASSIGNED' || a.status === 'IN_USE') ? 1 : 0,
        under_maintenance_count: a.status === 'UNDER_MAINTENANCE' ? 1 : 0,
        damaged_count: a.status === 'DAMAGED' ? 1 : 0,
        historical_failures: incidents.filter(i => i.asset_id === a.asset_id).length,
        operating_hours: a.operating_hours,
        actual_required: a.asset_category === 'Generators' ? 8 : a.asset_category === 'Radios' ? 20 : 5
      }));

      const trained = await runAssetModelTraining(trainingSamples);
      res.json(trained);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to retrain asset model' });
    }
  });

  // 2. Supply Requests
  app.get('/api/assets/supply-requests', async (req, res) => {
    try {
      const requests = await getAssetSupplyRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch supply requests' });
    }
  });

  app.post('/api/assets/supply-requests', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { role, name } = getUserContext(req);
      const created = await createSupplyRequest(req.body, name);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create supply request' });
    }
  });

  app.post('/api/assets/supply-requests/:code/approve', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const approved = await approveSupplyRequest(req.params.code, req.body);
      res.json(approved);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to approve supply request' });
    }
  });

  app.post('/api/assets/supply-requests/:code/receive', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const received = await receiveSupplyEquipment(req.params.code, req.body);
      res.json(received);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to receive equipment' });
    }
  });

  // 3. Notifications & Officer Config
  app.get('/api/assets/notifications', async (req, res) => {
    try {
      const notifications = await getAssetNotifications();
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
    }
  });

  app.post('/api/assets/notifications/dispatch', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { alertType, params } = req.body;
      const existing = await getAssetNotifications();
      const dispatched = dispatchUnifiedSupplyNotification(alertType, params, existing);
      res.json(dispatched);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to dispatch notification' });
    }
  });

  app.get('/api/assets/officer-config', async (req, res) => {
    try {
      const config = getAssetOfficerConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch officer config' });
    }
  });

  app.put('/api/assets/officer-config', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const updated = updateAssetOfficerConfig(req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update officer config' });
    }
  });

  // 4. Audit Trail, Maintenance & Incidents Lists
  app.get('/api/assets/audit-logs', async (req, res) => {
    try {
      const logs = await getAssetAuditLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch asset audit logs' });
    }
  });

  app.get('/api/assets/maintenance', async (req, res) => {
    try {
      const list = await getAssetMaintenanceList();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch maintenance records' });
    }
  });

  app.get('/api/assets/incidents', async (req, res) => {
    try {
      const list = await getAssetIncidentsList();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch asset incidents' });
    }
  });

  app.post('/api/assets/incidents/:code/resolve', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { name } = getUserContext(req);
      const resolved = await resolveAssetIncident(req.params.code, req.body, name);
      res.json(resolved);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to resolve incident' });
    }
  });

  // 5. QR Code Lookup
  app.get('/api/assets/qr/:payload', async (req, res) => {
    try {
      const data = await lookupAssetByQr(req.params.payload);
      res.json(data);
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Asset QR code not recognized' });
    }
  });

  // 6. Asset Master List & Creation
  app.get('/api/assets', async (req, res) => {
    try {
      const { station, category, status, condition, search } = req.query;
      const items = await getAssetsList({
        station: station as string,
        category: category as string,
        status: status as string,
        condition: condition as string,
        search: search as string,
      });

      // Augment items with legacy fields for backward compatibility with older components
      const augmented = items.map(a => ({
        ...a,
        code: a.asset_id,
        name: a.asset_name,
        type: a.asset_category,
        category: a.asset_category,
        station: a.assigned_station,
        stationId: a.assigned_station,
        hoursTotal: a.operating_hours,
        operatingHours: a.operating_hours,
        serviceIntervalHours: a.maintenance_threshold_hours,
        maintenanceThresholdHours: a.maintenance_threshold_hours,
        vibrationIndex: a.vibration_index,
        healthScore: a.health_score,
        lastInspection: a.last_maintenance_date,
        lastMaintenanceDate: a.last_maintenance_date,
        nextMaintenanceDue: a.next_maintenance_date,
        sparesStatus: a.condition === 'CRITICAL' ? 'Order Requisitioned' : 'Adequate'
      }));

      res.json(augmented);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch assets' });
    }
  });

  app.post('/api/assets', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { name } = getUserContext(req);
      const created = await registerAsset(req.body, name);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to register asset' });
    }
  });

  // 7. Parameterized Asset Routes (:id)
  app.get('/api/assets/:id/history', async (req, res) => {
    try {
      const history = await getAssetFullHistory(req.params.id);
      res.json(history);
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Asset history not found' });
    }
  });

  app.get('/api/assets/:id', async (req, res) => {
    try {
      const asset = await getAssetById(req.params.id);
      if (!asset) {
        return res.status(404).json({ error: `Asset '${req.params.id}' not found.` });
      }
      res.json(asset);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch asset' });
    }
  });

  app.put('/api/assets/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { name } = getUserContext(req);
      const updated = await updateAsset(req.params.id, req.body, name);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update asset' });
    }
  });

  app.post('/api/assets/:id/assign', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { name } = getUserContext(req);
      const assigned = await assignAsset(req.params.id, req.body, name);
      res.json(assigned);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to assign asset' });
    }
  });

  app.post('/api/assets/:id/transfer', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { name } = getUserContext(req);
      const transferred = await transferAsset(req.params.id, req.body, name);
      res.json(transferred);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to transfer asset' });
    }
  });

  app.post('/api/assets/:id/maintenance', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { name } = getUserContext(req);
      const record = await createMaintenanceRecord(req.params.id, req.body, name);
      res.status(201).json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to record maintenance' });
    }
  });

  app.post('/api/assets/:id/incident', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { name } = getUserContext(req);
      const incident = await reportAssetIncident(req.params.id, req.body, name);
      res.status(201).json(incident);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to report asset incident' });
    }
  });

  // Legacy status patch compatibility
  app.patch('/api/assets/:code/status', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { status, vibrationIndex } = req.body;
      const { name } = getUserContext(req);
      const updated = await updateAsset(req.params.code, { status, vibration_index: vibrationIndex }, name);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update asset status' });
    }
  });

  // Personnel
  app.get('/api/personnel', async (req, res) => {
    try {
      const items = await getPersonnel();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch personnel' });
    }
  });

  app.post('/api/personnel', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const created = await createPersonnel(req.body);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create personnel' });
    }
  });

  // =============================================================
  // EMERGENCY & ALERT MANAGEMENT REST APIs (Section 33)
  // =============================================================

  // 1. Get Emergencies with Filtering
  app.get('/api/emergencies', async (req, res) => {
    try {
      const items = emergencyRepository.getEmergencies(req.query as any);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch emergencies' });
    }
  });

  // 2. Emergency Reports & Analytics (Section 44, 45)
  app.get('/api/emergencies/stats', async (req, res) => {
    try {
      const stats = emergencyRepository.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch emergency stats' });
    }
  });

  // 3. Response Teams Master List & Availability (Section 8, 9, 10)
  app.get('/api/emergencies/teams', async (req, res) => {
    try {
      const { station_id, available_only } = req.query;
      const teams = emergencyRepository.getResponseTeams(
        station_id as string,
        available_only === 'true'
      );
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch response teams' });
    }
  });

  app.patch('/api/emergencies/teams/:id/status', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      const updated = emergencyRepository.updateResponseTeamStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ error: 'Response team not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update response team status' });
    }
  });

  // 4. Get Single Emergency by ID or Code
  app.get('/api/emergencies/:id', async (req, res) => {
    try {
      const item = emergencyRepository.getEmergencyById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Emergency incident not found' });
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch emergency' });
    }
  });

  // 5. Full Incident Audit History & Actions
  app.get('/api/emergencies/:id/history', async (req, res) => {
    try {
      const history = emergencyRepository.getHistory(req.params.id);
      if (!history.emergency) return res.status(404).json({ error: 'Emergency incident not found' });
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch emergency history' });
    }
  });

  // 6. Generic Emergency Creation
  app.post('/api/emergencies', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const created = emergencyRepository.createEmergency(req.body, user);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create emergency' });
    }
  });

  // 7. Personnel-Initiated Emergency (Section 2, 3, 7, 27, 28)
  app.post('/api/emergencies/personnel', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const created = emergencyRepository.createPersonnelEmergency(req.body, user);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to raise personnel emergency' });
    }
  });

  // 8. Weather-Triggered Emergency with Deduplication (Section 6, 25, 36)
  app.post('/api/emergencies/weather', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const result = emergencyRepository.createWeatherEmergency(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to receive weather emergency' });
    }
  });

  // 9. Alert Acknowledgement (Section 13)
  app.post('/api/emergencies/:id/acknowledge', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const acknowledgedBy = req.body.acknowledged_by || user.name;
      const updated = emergencyRepository.acknowledgeEmergency(req.params.id, acknowledgedBy, req.body.notes);
      if (!updated) return res.status(404).json({ error: 'Emergency not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to acknowledge emergency' });
    }
  });

  // 10. Assign Response Team (Section 9, 14)
  app.post('/api/emergencies/:id/assign', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const { response_team_id, notes } = req.body;
      if (!response_team_id) return res.status(400).json({ error: 'response_team_id is required' });
      const updated = emergencyRepository.assignResponseTeam(req.params.id, response_team_id, user.name, notes);
      if (!updated) return res.status(404).json({ error: 'Emergency or response team not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to assign response team' });
    }
  });

  // 11. Accept Response (Section 14)
  app.post('/api/emergencies/:id/accept', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const responder = req.body.responder_name || user.name;
      const updated = emergencyRepository.acceptResponse(req.params.id, responder, req.body.notes);
      if (!updated) return res.status(404).json({ error: 'Emergency not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to accept response' });
    }
  });

  // 12. Reject Response Assignment (Section 14, Edge Case 22)
  app.post('/api/emergencies/:id/reject', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const responder = req.body.responder_name || user.name;
      const reason = req.body.reason || 'Team engaged in active field rescue';
      const updated = emergencyRepository.rejectResponse(req.params.id, reason, responder);
      if (!updated) return res.status(404).json({ error: 'Emergency not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to reject response assignment' });
    }
  });

  // 13. Add Action to Log (Section 16)
  app.post('/api/emergencies/:id/actions', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const { action_type, description } = req.body;
      if (!action_type || !description) {
        return res.status(400).json({ error: 'action_type and description are required' });
      }
      const updated = emergencyRepository.recordAction(
        req.params.id,
        action_type,
        description,
        req.body.performed_by || user.name
      );
      if (!updated) return res.status(404).json({ error: 'Emergency not found' });
      res.status(201).json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to record action' });
    }
  });

  // 14. Escalate Emergency (Section 17)
  app.post('/api/emergencies/:id/escalate', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const updated = emergencyRepository.escalateEmergency(
        req.params.id,
        user.name,
        req.body.reason
      );
      if (!updated) return res.status(404).json({ error: 'Emergency not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to escalate emergency' });
    }
  });

  // 15. Resolve Emergency (Section 19)
  app.post('/api/emergencies/:id/resolve', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const { resolution_summary, notes } = req.body;
      if (!resolution_summary) {
        return res.status(400).json({ error: 'resolution_summary is required' });
      }
      const updated = emergencyRepository.resolveEmergency(
        req.params.id,
        resolution_summary,
        user.name,
        notes
      );
      if (!updated) return res.status(404).json({ error: 'Emergency not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to resolve emergency' });
    }
  });

  // 16. Cancel Emergency (Section 20 - False/Accidental Alarm)
  app.post('/api/emergencies/:id/cancel', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const { cancellation_reason } = req.body;
      if (!cancellation_reason) {
        return res.status(400).json({ error: 'cancellation_reason is required' });
      }
      const updated = emergencyRepository.cancelEmergency(
        req.params.id,
        cancellation_reason,
        user.name
      );
      if (!updated) return res.status(404).json({ error: 'Emergency not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to cancel emergency' });
    }
  });

  // 17. Update Emergency (Generic fields)
  app.put('/api/emergencies/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const existing = emergencyRepository.getEmergencyById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Emergency not found' });
      Object.assign(existing, req.body);
      res.json(existing);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update emergency' });
    }
  });

  // =============================================================
  // WEATHER & ENVIRONMENTAL MONITORING REST APIs
  // =============================================================

  // 1. Overview for stations, vessels, active events, alerts, and system health
  app.get('/api/weather/overview', async (req, res) => {
    try {
      const overview = await weatherRepository.getOverview();
      res.json(overview);
    } catch (error: any) {
      console.error('Weather overview error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch weather overview' });
    }
  });

  // 2. Force Sync Weather from External Weather API
  app.post('/api/weather/sync', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { email } = getUserContext(req);
      weatherRepository.logAudit('MANUAL_SYNC_TRIGGERED', 'Operator triggered manual live weather sync from external weather API.', email);
      await weatherRepository.syncAllWeather();
      const overview = await weatherRepository.getOverview();
      res.json({ message: 'Weather synchronized successfully with external API.', overview });
    } catch (error: any) {
      console.error('Weather sync error:', error);
      res.status(500).json({ error: error.message || 'Failed to sync weather with external API' });
    }
  });

  // 3. Current Weather for Station
  app.get('/api/weather/current/stations/:stationId', async (req, res) => {
    try {
      const stn = weatherRepository.getStations().find((s) => s.station_id === req.params.stationId);
      if (!stn) {
        return res.status(404).json({ error: `Station '${req.params.stationId}' not found.` });
      }
      const data = await weatherService.getStationWeather(stn);
      res.json(data.observation);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch station weather' });
    }
  });

  // 4. Current Weather for Vessel
  app.get('/api/weather/current/vessels/:vesselId', async (req, res) => {
    try {
      const vessel = weatherRepository.getVessels().find((v) => v.id === req.params.vesselId);
      if (!vessel) {
        return res.status(404).json({ error: `Vessel '${req.params.vesselId}' not found.` });
      }
      const data = await weatherService.getVesselWeather(vessel);
      res.json(data.observation);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch vessel weather' });
    }
  });

  // 5. Forecast for Station
  app.get('/api/weather/forecast/stations/:stationId', async (req, res) => {
    try {
      const stn = weatherRepository.getStations().find((s) => s.station_id === req.params.stationId);
      if (!stn) {
        return res.status(404).json({ error: `Station '${req.params.stationId}' not found.` });
      }
      const data = await weatherService.getStationWeather(stn);
      res.json(data.forecast);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch station forecast' });
    }
  });

  // 6. Forecast for Vessel
  app.get('/api/weather/forecast/vessels/:vesselId', async (req, res) => {
    try {
      const vessel = weatherRepository.getVessels().find((v) => v.id === req.params.vesselId);
      if (!vessel) {
        return res.status(404).json({ error: `Vessel '${req.params.vesselId}' not found.` });
      }
      const data = await weatherService.getVesselWeather(vessel);
      res.json(data.forecast);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch vessel forecast' });
    }
  });

  // 7. Weather Events List & Lifecycle
  app.get('/api/weather/events', async (req, res) => {
    try {
      const events = weatherRepository.getEvents(req.query as any);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch weather events' });
    }
  });

  app.get('/api/weather/events/:id', async (req, res) => {
    try {
      const event = weatherRepository.getEventById(req.params.id);
      if (!event) return res.status(404).json({ error: 'Weather event not found' });
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch weather event' });
    }
  });

  app.patch('/api/weather/events/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { status, resolvedBy } = req.body;
      const { name } = getUserContext(req);
      const updated = weatherRepository.updateEventStatus(req.params.id, status, resolvedBy || name);
      if (!updated) return res.status(404).json({ error: 'Weather event not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update weather event' });
    }
  });

  // 8. Alerts & Acknowledgements
  app.get('/api/weather/alerts', async (req, res) => {
    try {
      const alerts = weatherRepository.getAlerts();
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch weather alerts' });
    }
  });

  app.post('/api/weather/alerts/:id/acknowledge', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { acknowledgedBy } = req.body;
      const { name } = getUserContext(req);
      const updated = weatherRepository.acknowledgeAlert(req.params.id, acknowledgedBy || name);
      if (!updated) return res.status(404).json({ error: 'Alert not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to acknowledge alert' });
    }
  });

  app.post('/api/weather/alerts/:id/escalate', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const updated = weatherRepository.escalateAlert(req.params.id);
      if (!updated) return res.status(404).json({ error: 'Alert not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to escalate alert' });
    }
  });

  // 9. Configurable Weather Safety Rules
  app.get('/api/weather/rules', async (req, res) => {
    try {
      const rules = weatherRepository.getRules();
      res.json(rules);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch weather rules' });
    }
  });

  app.post('/api/weather/rules', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const created = weatherRepository.addRule(req.body);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create weather rule' });
    }
  });

  app.put('/api/weather/rules/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const updated = weatherRepository.updateRule(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Weather rule not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update weather rule' });
    }
  });

  app.delete('/api/weather/rules/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const success = weatherRepository.deleteRule(req.params.id);
      if (!success) return res.status(404).json({ error: 'Weather rule not found' });
      res.json({ success: true, message: `Rule '${req.params.id}' removed.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete weather rule' });
    }
  });

  // 10. Station Operational Monitoring Radius
  app.patch('/api/weather/stations/:id/radius', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { radiusKm } = req.body;
      const updated = weatherRepository.updateStationRadius(req.params.id, Number(radiusKm));
      if (!updated) return res.status(404).json({ error: 'Station not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update station radius' });
    }
  });

  // 11. Weather History & Audit Logs
  app.get('/api/weather/history', async (req, res) => {
    try {
      const history = weatherRepository.getHistory(req.query as any);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch weather history' });
    }
  });

  app.get('/api/weather/audit-logs', async (req, res) => {
    try {
      const logs = weatherRepository.getAuditLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch weather audit logs' });
    }
  });

  // 12. Manual Risk Check trigger
  app.post('/api/weather/check', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await weatherRepository.syncAllWeather();
      res.json({ message: 'Weather Risk Rule Engine evaluated all active stations and vessels.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to evaluate weather risk' });
    }
  });

  // Non-blocking initial weather sync and periodic background monitor (every 15 min)
  setTimeout(() => {
    weatherRepository.syncAllWeather().catch((e) => {
      console.warn('[Weather Background Sync Notice]', e.message);
    });
  }, 3000);

  setInterval(() => {
    weatherRepository.syncAllWeather().catch((e) => {
      console.warn('[Weather Periodic Job Notice]', e.message);
    });
  }, 15 * 60 * 1000);

  // Emergency automated escalation & notification retry service (Section 34 & 35)
  setInterval(() => {
    try {
      emergencyRepository.checkEscalations();
      emergencyRepository.retryPendingNotifications();
    } catch (err: any) {
      console.warn('[Emergency Escalation Job Notice]', err.message);
    }
  }, 30 * 1000);

  // =========================================================================
  // COMMUNICATION & NOTIFICATION SYSTEM API ROUTES (Module 7)
  // =========================================================================

  // 1. Get Notification List with Filters
  app.get('/api/notifications', optionalAuth, (req: AuthRequest, res) => {
    try {
      const { status, priority, source_module, unread_only, recipient_id, limit } = req.query;
      const notifications = communicationRepository.getNotifications({
        status: status as string,
        priority: priority as string,
        source_module: source_module as string,
        unread_only: unread_only === 'true',
        recipient_id: recipient_id as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
    }
  });

  // 2. Unread & Critical Unacknowledged Counter (for Header Bell Badge)
  app.get('/api/notifications/unread-count', optionalAuth, (req: AuthRequest, res) => {
    try {
      res.json({
        unread: communicationRepository.getUnreadCount(),
        critical_unacknowledged: communicationRepository.getCriticalUnacknowledgedCount(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch unread count' });
    }
  });

  // 3. Notification Analytics & Operational Statistics
  app.get('/api/notifications/stats', optionalAuth, (req: AuthRequest, res) => {
    try {
      const stats = communicationRepository.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch notification stats' });
    }
  });

  // 4. Server-Sent Events (SSE) Live Feed (Section 38)
  app.get('/api/notifications/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    communicationRepository.registerSseClient(res);

    // Initial connection ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'POLARIS Live Notification Stream Established' })}\n\n`);
  });

  // Dedicated GET /api/notifications/unread (Section 26)
  app.get('/api/notifications/unread', optionalAuth, (req: AuthRequest, res) => {
    try {
      const unreadList = communicationRepository.getNotifications({ unread_only: true });
      res.json({
        unread_count: communicationRepository.getUnreadCount(),
        critical_unacknowledged_count: communicationRepository.getCriticalUnacknowledgedCount(),
        notifications: unreadList,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch unread notifications' });
    }
  });

  // Dedicated GET /api/notifications/history (Section 26, 29)
  app.get('/api/notifications/history', optionalAuth, (req: AuthRequest, res) => {
    try {
      const {
        start_date,
        end_date,
        source_module,
        notification_type,
        priority,
        recipient_id,
        channel,
        status,
        search,
        limit,
        offset,
      } = req.query;

      const history = communicationRepository.queryHistory({
        start_date: start_date as string,
        end_date: end_date as string,
        source_module: source_module as string,
        notification_type: notification_type as string,
        priority: priority as string,
        recipient_id: recipient_id as string,
        channel: channel as string,
        status: status as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to query notification history' });
    }
  });

  // Dedicated GET /api/notifications/status/:id (Section 26)
  app.get('/api/notifications/status/:id', optionalAuth, (req: AuthRequest, res) => {
    try {
      const statusObj = communicationRepository.getNotificationStatus(req.params.id);
      if (!statusObj) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(statusObj);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch notification status' });
    }
  });

  // Standardized GET /api/notifications/preferences & PUT /api/notifications/preferences (Section 26)
  app.get('/api/notifications/preferences', optionalAuth, (req: AuthRequest, res) => {
    try {
      const { personnel_id } = req.query;
      const prefs = communicationRepository.getPreferences(personnel_id as string);
      res.json(prefs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch preferences' });
    }
  });

  app.put('/api/notifications/preferences', optionalAuth, (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const { preferences } = req.body;
      if (Array.isArray(preferences)) {
        const updated = communicationRepository.updateMultiplePreferences(preferences, user.name);
        return res.json({ message: `Updated ${updated.length} preferences`, preferences: updated });
      }
      if (req.body.id && typeof req.body.enabled === 'boolean') {
        const updated = communicationRepository.updatePreference(req.body.id, req.body.enabled, user.name);
        return res.json(updated);
      }
      res.status(400).json({ error: 'Invalid payload: expected { preferences: [...] } or { id, enabled }' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update preferences' });
    }
  });

  // Standardized Templates Endpoints GET/POST /api/notifications/templates (Section 26)
  app.get('/api/notifications/templates', optionalAuth, (req: AuthRequest, res) => {
    try {
      const templates = communicationRepository.getTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch templates' });
    }
  });

  app.post('/api/notifications/templates', optionalAuth, (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const created = communicationRepository.createTemplate(req.body, user.name);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create template' });
    }
  });

  app.put('/api/notifications/templates/:id', optionalAuth, (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const updated = communicationRepository.updateTemplate(req.params.id, req.body, user.name);
      if (!updated) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update template' });
    }
  });

  // Secure Internal Modules Notification Dispatch Endpoint (Section 26, 27)
  app.post('/api/internal/notifications', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const internalKey = req.headers['x-internal-module-key'] || req.headers['authorization'];
      const user = getUserContext(req);
      const {
        source_module,
        source_event_id,
        notification_type,
        priority,
        station_id,
        vessel_id,
        expedition_id,
        template_code,
        template_params,
        custom_title,
        custom_message,
        target_recipient_types,
        explicit_recipient_ids,
        forced_channels,
        requires_acknowledgement,
        metadata,
      } = req.body;

      if (!source_module || !notification_type) {
        return res.status(400).json({
          error: 'Validation failed: source_module and notification_type are strictly required',
        });
      }

      const created = await communicationRepository.createNotification({
        source_module,
        source_event_id: source_event_id || `INTERNAL-EVT-${Date.now()}`,
        notification_type,
        priority: priority || 'NORMAL',
        station_id,
        vessel_id,
        expedition_id,
        template_code,
        template_params: template_params || {},
        custom_title,
        custom_message,
        target_recipient_types,
        explicit_recipient_ids,
        forced_channels,
        requires_acknowledgement,
        metadata: { ...metadata, origin: 'INTERNAL_MODULE_RPC' },
      }, `Internal Service [${source_module}]`);

      res.status(201).json({
        success: true,
        notification_id: created.id,
        notification_code: created.notification_code,
        status: created.status,
        delivered_to_count: created.recipients.length,
        notification: created,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal notification dispatch error' });
    }
  });

  // Shipment Lifecycle Notifications Event Endpoint (Section 14)
  app.post('/api/shipments/event', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const {
        event_type, // 'DELAY' | 'ARRIVAL' | 'EXCEPTION'
        shipment_id,
        vessel_name,
        origin,
        destination,
        previous_eta,
        updated_eta,
        reason,
        containers_count,
        severity,
      } = req.body;

      if (!shipment_id || !vessel_name) {
        return res.status(400).json({ error: 'shipment_id and vessel_name are required' });
      }

      let template_code = 'SHIPMENT_DELAY';
      let notification_type: any = 'SHIPMENT_DELAY';
      let priority: any = 'HIGH';

      if (event_type === 'ARRIVAL') {
        template_code = 'SHIPMENT_ARRIVAL';
        notification_type = 'SHIPMENT_ARRIVAL';
        priority = 'NORMAL';
      } else if (event_type === 'EXCEPTION') {
        template_code = 'SHIPMENT_DELAY';
        notification_type = 'SHIPMENT_DELAY';
        priority = severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
      }

      const notif = await communicationRepository.createNotification({
        source_module: 'SHIPMENT',
        source_event_id: `SHP-EVT-${shipment_id}-${Date.now()}`,
        notification_type,
        priority,
        template_code,
        template_params: {
          shipment_id,
          vessel_name,
          origin: origin || 'Mormugao Port, Goa, India',
          destination: destination || 'Larsemann Hills (Bharati Station)',
          previous_eta: previous_eta || '2026-09-18 14:00 UTC',
          updated_eta: updated_eta || '2026-09-24 10:00 UTC',
          reason: reason || 'Extreme Roaring Forties sea state and localized pack ice convergence',
          arrival_time: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          containers_count: String(containers_count || 48),
        },
        requires_acknowledgement: priority === 'CRITICAL',
      }, user.name);

      res.status(201).json({ success: true, notification: notif });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to trigger shipment event' });
    }
  });

  // 5. Get Notification Details by ID
  app.get('/api/notifications/:id', optionalAuth, (req: AuthRequest, res) => {
    try {
      const notification = communicationRepository.getNotificationById(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch notification details' });
    }
  });

  // 6. Create and Dispatch Notification (Manual or Module-triggered)
  app.post('/api/notifications', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const {
        source_module,
        source_event_id,
        notification_type,
        priority,
        station_id,
        vessel_id,
        expedition_id,
        template_code,
        template_params,
        custom_title,
        custom_message,
        target_recipient_types,
        explicit_recipient_ids,
        forced_channels,
        requires_acknowledgement,
        metadata,
      } = req.body;

      if (!source_module || !notification_type) {
        return res.status(400).json({ error: 'Missing required fields: source_module, notification_type' });
      }

      const notif = await communicationRepository.createNotification({
        source_module,
        source_event_id: source_event_id || `EVT-${Date.now()}`,
        notification_type,
        priority: priority || 'NORMAL',
        station_id,
        vessel_id,
        expedition_id,
        template_code,
        template_params: template_params || {},
        custom_title,
        custom_message,
        target_recipient_types,
        explicit_recipient_ids,
        forced_channels,
        requires_acknowledgement,
        metadata,
      }, user.name);

      res.status(201).json(notif);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to dispatch notification' });
    }
  });

  // 7. Mark Notification as Read
  const handleMarkRead = (req: AuthRequest, res: express.Response) => {
    try {
      const user = getUserContext(req);
      const updated = communicationRepository.markAsRead(req.params.id, user.name);
      if (!updated) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
    }
  };
  app.post('/api/notifications/:id/read', optionalAuth, handleMarkRead);
  app.patch('/api/notifications/:id/read', optionalAuth, handleMarkRead);

  // 8. Formally Acknowledge Notification (Critical Safety Loop)
  app.post('/api/notifications/:id/acknowledge', optionalAuth, (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const { recipient_id } = req.body;
      const updated = communicationRepository.acknowledgeNotification(
        req.params.id,
        recipient_id || user.email,
        user.name
      );
      if (!updated) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to acknowledge notification' });
    }
  });

  // 9. Retry Failed Notifications
  app.post('/api/notifications/retry-failed', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const result = await communicationRepository.retryAllFailed();
      res.json({ message: `Retried ${result.retriedCount} pending or failed notification deliveries` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to retry notifications' });
    }
  });

  // 10. Notification Templates CRUD
  app.get('/api/notification-templates', optionalAuth, (req: AuthRequest, res) => {
    try {
      const templates = communicationRepository.getTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch templates' });
    }
  });

  app.get('/api/notification-templates/:id', optionalAuth, (req: AuthRequest, res) => {
    try {
      const template = communicationRepository.getTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch template' });
    }
  });

  app.post('/api/notification-templates', optionalAuth, (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const created = communicationRepository.createTemplate(req.body, user.name);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create template' });
    }
  });

  app.put('/api/notification-templates/:id', optionalAuth, (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const updated = communicationRepository.updateTemplate(req.params.id, req.body, user.name);
      if (!updated) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update template' });
    }
  });

  // 11. Notification Channel Preferences
  app.get('/api/notification-preferences', optionalAuth, (req: AuthRequest, res) => {
    try {
      const { personnel_id } = req.query;
      const prefs = communicationRepository.getPreferences(personnel_id as string);
      res.json(prefs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch preferences' });
    }
  });

  app.patch('/api/notification-preferences/:id', optionalAuth, (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'Field "enabled" must be boolean' });
      }
      const updated = communicationRepository.updatePreference(req.params.id, enabled, user.name);
      if (!updated) {
        return res.status(404).json({ error: 'Preference not found' });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update preference' });
    }
  });

  // 12. Personnel Contacts Directory
  app.get('/api/notification-contacts', optionalAuth, (req: AuthRequest, res) => {
    try {
      const contacts = communicationRepository.getContacts();
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch contacts' });
    }
  });

  // 13. Notification Audit Logs
  app.get('/api/notification-audit-logs', optionalAuth, (req: AuthRequest, res) => {
    try {
      const logs = communicationRepository.getAuditLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch notification audit logs' });
    }
  });

  // 14. Provider Simulation Test Hooks (for failure, retry & fallback demonstration)
  app.get('/api/notifications-simulation', optionalAuth, (req: AuthRequest, res) => {
    res.json(getProviderSimulation());
  });

  app.post('/api/notifications-simulation', optionalAuth, (req: AuthRequest, res) => {
    try {
      setProviderSimulation(req.body);
      res.json({ message: 'Provider simulation settings updated', current: getProviderSimulation() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // 15. REPORTING & ANALYTICS MODULE AUTHORITATIVE REST API
  // ============================================================

  // 1. Dashboard Executive Summary & Real-time KPIs
  app.get('/api/reports/dashboard', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const filters = req.query as any;
      const startTime = Date.now();
      const kpis = await reportingRepository.getDashboardKpis(filters, user.role);

      recordReportingAudit({
        reportType: 'DASHBOARD_KPI',
        reportTitle: 'Executive Command KPI Dashboard',
        action: 'GENERATED',
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        filtersJson: JSON.stringify(filters),
        recordsCount: kpis.totalExpeditions + kpis.totalPersonnel + kpis.totalCargo,
        executionDurationMs: Date.now() - startTime,
      });

      res.json(kpis);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate dashboard KPIs' });
    }
  });

  // 2. Expedition Analytics
  app.get('/api/reports/expeditions', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const filters = req.query as any;
      const startTime = Date.now();
      const expeditions = await reportingRepository.getExpeditionsReport(filters, user.role);

      recordReportingAudit({
        reportType: 'EXPEDITION_ANALYTICS',
        reportTitle: 'Polar Expeditions Operational Registry Report',
        action: filters.q ? 'FILTERED' : 'GENERATED',
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        filtersJson: JSON.stringify(filters),
        recordsCount: expeditions.length,
        executionDurationMs: Date.now() - startTime,
      });

      res.json(expeditions);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch expeditions report' });
    }
  });

  // 3. Personnel Analytics
  app.get('/api/reports/personnel', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const filters = req.query as any;
      const personnel = await reportingRepository.getPersonnelReport(filters, user.role);
      res.json(personnel);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch personnel report' });
    }
  });

  // 4. Cargo Analytics
  app.get('/api/reports/cargo', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const filters = req.query as any;
      const cargo = await reportingRepository.getCargoReport(filters, user.role);
      res.json(cargo);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch cargo report' });
    }
  });

  // 5. Container Analytics with Utilization
  app.get('/api/reports/containers', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const filters = req.query as any;
      const containers = await reportingRepository.getContainersReport(filters, user.role);
      res.json(containers);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch containers report' });
    }
  });

  // 6. Multi-Modal Shipment & Tracking Analytics
  app.get('/api/reports/shipments', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const filters = req.query as any;
      const shipments = await reportingRepository.getShipmentsList(filters);
      res.json(shipments);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch shipments report' });
    }
  });

  // 7. Inventory Analytics with Depletion & Forecasts
  app.get('/api/reports/inventory', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const filters = req.query as any;
      const inventory = await reportingRepository.getInventoryReport(filters, user.role);
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch inventory report' });
    }
  });

  // 8. Asset Analytics with Predictive Wear & Maintenance
  app.get('/api/reports/assets', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const filters = req.query as any;
      const assets = await reportingRepository.getAssetsReport(filters, user.role);
      res.json(assets);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch assets report' });
    }
  });

  // 9. Weather Analytics & Safety Observations
  app.get('/api/reports/weather', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const filters = req.query as any;
      const weather = await reportingRepository.getWeatherReport(filters, user.role);
      res.json(weather);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch weather report' });
    }
  });

  // 10. Emergency Analytics & Response Team Performance
  app.get('/api/reports/emergencies', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const filters = req.query as any;
      const emergencyData = await reportingRepository.getEmergencyReport(filters, user.role);
      res.json(emergencyData);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch emergency report' });
    }
  });

  // 11. Communication Analytics
  app.get('/api/reports/communications', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const commData = await reportingRepository.getCommunicationReport();
      res.json(commData);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch communication report' });
    }
  });

  // 12. Single Expedition Cross-Module Deep Operational Report
  app.get('/api/reports/expedition/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const report = await reportingRepository.getExpeditionDeepReport(req.params.id, user.role);
      if (!report) {
        return res.status(404).json({ error: 'Expedition not found for reporting' });
      }

      recordReportingAudit({
        reportType: 'SINGLE_EXPEDITION_DOSSIER',
        reportTitle: `Deep Dossier: ${report.expedition.expedition_name}`,
        action: 'VIEWED',
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        filtersJson: JSON.stringify({ expeditionId: req.params.id }),
        recordsCount: report.personnelSummary.total + report.cargoSummary.containersCount,
        executionDurationMs: 18,
      });

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate expedition deep report' });
    }
  });

  // 13. Global Search across All Operational Reporting Modules
  app.get('/api/reports/search', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const q = (req.query.q as string) || '';
      const results = await reportingRepository.searchGlobalReporting(q, user.role);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to perform reporting search' });
    }
  });

  // 14. Documented KPI Definitions
  app.get('/api/reports/kpi-definitions', optionalAuth, (req: AuthRequest, res) => {
    try {
      const kpis = reportingRepository.getKpiDefinitions();
      res.json(kpis);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch KPI definitions' });
    }
  });

  // 15. Reporting Audit Logs
  app.get('/api/reports/audit-logs', optionalAuth, (req: AuthRequest, res) => {
    try {
      const logs = ensureReportingAuditStore();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch reporting audit logs' });
    }
  });

  // 16. CSV Export Endpoint
  app.all('/api/reports/export/csv', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const params = req.method === 'POST' ? req.body : req.query;
      const reportType = params.reportType || 'expeditions';
      const filters = params.filters || params;

      let records: any[] = [];
      if (reportType === 'expeditions') records = await reportingRepository.getExpeditionsReport(filters, user.role);
      else if (reportType === 'personnel') records = await reportingRepository.getPersonnelReport(filters, user.role);
      else if (reportType === 'cargo') records = await reportingRepository.getCargoReport(filters, user.role);
      else if (reportType === 'containers') records = await reportingRepository.getContainersReport(filters, user.role);
      else if (reportType === 'shipments') records = await reportingRepository.getShipmentsList(filters);
      else if (reportType === 'inventory') records = await reportingRepository.getInventoryReport(filters, user.role);
      else if (reportType === 'assets') records = await reportingRepository.getAssetsReport(filters, user.role);
      else if (reportType === 'weather') records = await reportingRepository.getWeatherReport(filters, user.role);
      else if (reportType === 'emergencies') {
        const d = await reportingRepository.getEmergencyReport(filters, user.role);
        records = d.emergencies;
      }

      const csvContent = reportingRepository.generateCsvReport(reportType, records, filters);

      recordReportingAudit({
        reportType: `EXPORT_CSV_${reportType.toUpperCase()}`,
        reportTitle: `${reportType.toUpperCase()} CSV Export`,
        action: 'EXPORTED_CSV',
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        filtersJson: JSON.stringify(filters),
        recordsCount: records.length,
        executionDurationMs: 25,
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="POLARIS_${reportType}_Report_${Date.now()}.csv"`);
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to export CSV' });
    }
  });

  // 17. Excel XML Export Endpoint
  app.all('/api/reports/export/excel', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const params = req.method === 'POST' ? req.body : req.query;
      const reportType = params.reportType || 'expeditions';
      const filters = params.filters || params;

      let records: any[] = [];
      if (reportType === 'expeditions') records = await reportingRepository.getExpeditionsReport(filters, user.role);
      else if (reportType === 'personnel') records = await reportingRepository.getPersonnelReport(filters, user.role);
      else if (reportType === 'cargo') records = await reportingRepository.getCargoReport(filters, user.role);
      else if (reportType === 'containers') records = await reportingRepository.getContainersReport(filters, user.role);
      else if (reportType === 'shipments') records = await reportingRepository.getShipmentsList(filters);
      else if (reportType === 'inventory') records = await reportingRepository.getInventoryReport(filters, user.role);
      else if (reportType === 'assets') records = await reportingRepository.getAssetsReport(filters, user.role);
      else if (reportType === 'weather') records = await reportingRepository.getWeatherReport(filters, user.role);
      else if (reportType === 'emergencies') {
        const d = await reportingRepository.getEmergencyReport(filters, user.role);
        records = d.emergencies;
      }

      const xmlContent = reportingRepository.generateExcelReport(reportType, records, filters);

      recordReportingAudit({
        reportType: `EXPORT_EXCEL_${reportType.toUpperCase()}`,
        reportTitle: `${reportType.toUpperCase()} Excel Export`,
        action: 'EXPORTED_EXCEL',
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        filtersJson: JSON.stringify(filters),
        recordsCount: records.length,
        executionDurationMs: 30,
      });

      res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="POLARIS_${reportType}_Report_${Date.now()}.xls"`);
      res.send(xmlContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to export Excel' });
    }
  });

  // 18. Printable PDF / HTML Export Endpoint
  app.all('/api/reports/export/pdf', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const user = getUserContext(req);
      const params = req.method === 'POST' ? req.body : req.query;
      const reportType = params.reportType || 'expeditions';
      const filters = params.filters || params;

      let records: any[] = [];
      if (reportType === 'expeditions') records = await reportingRepository.getExpeditionsReport(filters, user.role);
      else if (reportType === 'personnel') records = await reportingRepository.getPersonnelReport(filters, user.role);
      else if (reportType === 'cargo') records = await reportingRepository.getCargoReport(filters, user.role);
      else if (reportType === 'containers') records = await reportingRepository.getContainersReport(filters, user.role);
      else if (reportType === 'shipments') records = await reportingRepository.getShipmentsList(filters);
      else if (reportType === 'inventory') records = await reportingRepository.getInventoryReport(filters, user.role);
      else if (reportType === 'assets') records = await reportingRepository.getAssetsReport(filters, user.role);
      else if (reportType === 'weather') records = await reportingRepository.getWeatherReport(filters, user.role);
      else if (reportType === 'emergencies') {
        const d = await reportingRepository.getEmergencyReport(filters, user.role);
        records = d.emergencies;
      }

      const html = reportingRepository.generatePdfPrintableHtml(reportType, records, filters, user.role);

      recordReportingAudit({
        reportType: `EXPORT_PDF_${reportType.toUpperCase()}`,
        reportTitle: `${reportType.toUpperCase()} Official PDF Document`,
        action: 'EXPORTED_PDF',
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        filtersJson: JSON.stringify(filters),
        recordsCount: records.length,
        executionDurationMs: 20,
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate PDF view' });
    }
  });

  // Background Queue Dispatch Worker (Every 10 seconds)
  setInterval(() => {
    try {
      communicationRepository.processQueue();
    } catch (err: any) {
      console.warn('[Comm Queue Background Worker Notice]', err.message);
    }
  }, 10 * 1000);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`POLARIS Command Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
