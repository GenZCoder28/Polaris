import { 
  AssetNotificationRecord, 
  ResponsibleAssetOfficerConfig 
} from '../types.ts';
import { 
  RESPONSIBLE_ASSET_OFFICER_CONFIG, 
  RESPONSIBLE_FOOD_OFFICER_CONFIG 
} from '../data/initialAssetMaster.ts';
import { communicationRepository } from '../db/communicationRepository.ts';

// In-memory configurable officer state (can be updated via settings API)
let currentAssetOfficerConfig: ResponsibleAssetOfficerConfig = { ...RESPONSIBLE_ASSET_OFFICER_CONFIG };
let currentFoodOfficerConfig = { ...RESPONSIBLE_FOOD_OFFICER_CONFIG };

export function getAssetOfficerConfig(): ResponsibleAssetOfficerConfig {
  return currentAssetOfficerConfig;
}

export function updateAssetOfficerConfig(newConfig: Partial<ResponsibleAssetOfficerConfig>): ResponsibleAssetOfficerConfig {
  currentAssetOfficerConfig = {
    ...currentAssetOfficerConfig,
    ...newConfig,
    notification_preferences: {
      ...currentAssetOfficerConfig.notification_preferences,
      ...(newConfig.notification_preferences || {})
    }
  };
  return currentAssetOfficerConfig;
}

export function getFoodOfficerConfig() {
  return currentFoodOfficerConfig;
}

// -------------------------------------------------------------
// SECURE PREDEFINED TEMPLATES (Strictly non-LLM)
// -------------------------------------------------------------
export function formatAssetShortageMessage(params: {
  expeditionId: string;
  stationName: string;
  equipmentType: string;
  currentlyAvailable: number;
  predictedRequirement: number;
  additionalRequirement: number;
}): string {
  // Predefined secure template from Section 17
  return `Asset Requirement Alert

Expedition:
${params.expeditionId}

Station:
${params.stationName}

Equipment:
${params.equipmentType}

Currently Available:
${params.currentlyAvailable}

Predicted Requirement:
${params.predictedRequirement}

Additional Requirement:
${params.additionalRequirement}

Reason:
Projected operational requirement exceeds current available assets.

Please review the requirement and initiate the appropriate supply process.`;
}

export function formatMaintenanceAlertMessage(params: {
  assetId: string;
  assetName: string;
  stationName: string;
  daysRemaining: number;
  hoursRemaining: number;
}): string {
  return `Maintenance Alert: Asset ${params.assetId} (${params.assetName}) at ${params.stationName} is approaching mandatory service threshold. Estimated time remaining: ${params.daysRemaining} days (${params.hoursRemaining} operating hours). Please schedule maintenance overhaul.`;
}

export function formatFoodShortageMessage(params: {
  expeditionId: string;
  stationName: string;
  itemName: string;
  currentStock: string;
  depletionDays: number;
}): string {
  return `Food Provision Supply Alert

Expedition:
${params.expeditionId}

Station:
${params.stationName}

Provision Item:
${params.itemName}

Current Reserve:
${params.currentStock}

Estimated Depletion:
${params.depletionDays} days

Reason:
Projected consumption rate threatens minimum reserve threshold before next maritime supply window.

Please review ration manifests and initiate provision dispatch.`;
}

// -------------------------------------------------------------
// UNIFIED DISPATCH ROUTER (Section 19)
// -------------------------------------------------------------
export function dispatchUnifiedSupplyNotification(
  alertType: 'EQUIPMENT_SHORTAGE' | 'FOOD_SHORTAGE' | 'MAINTENANCE_DUE' | 'CRITICAL_INCIDENT',
  params: any,
  existingNotifications: AssetNotificationRecord[] = []
): { notification: AssetNotificationRecord; isDuplicate: boolean } {
  const isEquipment = alertType === 'EQUIPMENT_SHORTAGE' || alertType === 'MAINTENANCE_DUE' || alertType === 'CRITICAL_INCIDENT';
  const officer = isEquipment ? currentAssetOfficerConfig : currentFoodOfficerConfig;

  let subject = '';
  let message = '';

  if (alertType === 'EQUIPMENT_SHORTAGE') {
    subject = `Asset Requirement Alert: ${params.additionalRequirement}x ${params.equipmentType} for ${params.stationName}`;
    message = formatAssetShortageMessage(params);
  } else if (alertType === 'MAINTENANCE_DUE') {
    subject = `Maintenance Due Alert: ${params.assetId} (${params.assetName}) at ${params.stationName}`;
    message = formatMaintenanceAlertMessage(params);
  } else if (alertType === 'FOOD_SHORTAGE') {
    subject = `Food Provision Alert: ${params.itemName} at ${params.stationName}`;
    message = formatFoodShortageMessage(params);
  } else {
    subject = `Polar Critical Asset Incident Alert: ${params.assetId} at ${params.stationName}`;
    message = `Incident Alert: Asset ${params.assetId} reported as ${params.incidentType} at ${params.stationName}. Details: ${params.description}`;
  }

  // Check duplicate unresolved notifications within last 24 hours (Section 33)
  const isDuplicate = existingNotifications.some(n => {
    if (n.alert_type === alertType && n.subject === subject) {
      const sentTime = new Date(n.sent_at).getTime();
      const hoursAgo = (Date.now() - sentTime) / (1000 * 60 * 60);
      return hoursAgo < 24; // De-duplicate within 24 hours
    }
    return false;
  });

  const notification: AssetNotificationRecord = {
    id: existingNotifications.length + 1,
    alert_id: params.alertId,
    alert_type: alertType,
    department: officer.department,
    officer_name: officer.officer_name,
    email: officer.email,
    phone: officer.phone,
    subject,
    message,
    channel: 'Email',
    sent_at: new Date().toISOString(),
    delivery_status: isDuplicate ? 'ACKNOWLEDGED' : 'DELIVERED',
    created_at: new Date().toISOString()
  };

  // Section 13: Direct routing to Communication & Notification subsystem
  if (!isDuplicate) {
    try {
      const station = params.stationName || 'Bharati Station';
      const stationId = station.toLowerCase().includes('maitri') ? 'maitri' : station.toLowerCase().includes('himadri') ? 'himadri' : 'bharati';
      const isShortage = alertType === 'EQUIPMENT_SHORTAGE' || alertType === 'FOOD_SHORTAGE';

      communicationRepository.createNotification({
        source_module: 'ASSET',
        source_event_id: `AST-ALERT-${params.alertId || Date.now()}`,
        notification_type: isShortage ? (alertType === 'FOOD_SHORTAGE' ? 'FOOD_REQUIREMENT' : 'ASSET_REQUIREMENT') : 'GENERAL_UPDATE',
        priority: isShortage ? 'HIGH' : 'NORMAL',
        station_id: stationId,
        template_code: isShortage ? (alertType === 'FOOD_SHORTAGE' ? 'FOOD_REQUIREMENT' : 'ASSET_REQUIREMENT') : 'GENERAL_ANNOUNCEMENT',
        template_params: {
          expedition: params.expeditionId || '44th Indian Antarctic Expedition',
          station: station,
          asset_type: params.equipmentType || params.assetName || 'Heavy Machinery',
          available: String(params.currentlyAvailable ?? 1),
          predicted: String(params.predictedRequirement ?? 3),
          shortage: String(params.additionalRequirement ?? 2),
          current_stock: params.currentStock || 'Low Reserve',
          predicted_requirement: '45 operating days',
          title: subject,
          content: message,
          announcement_title: subject,
        },
        requires_acknowledgement: false,
      }).catch((e: any) => console.warn('[Asset->Comm notice]', e.message));
    } catch (e: any) {
      console.warn('[Asset->Comm error]', e.message);
    }
  }

  return { notification, isDuplicate };
}
