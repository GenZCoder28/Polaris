import { NotificationChannel, NotificationPriority } from '../types.ts';

export interface ProviderSendPayload {
  notificationId: string;
  notificationCode: string;
  priority: NotificationPriority;
  recipientId: string;
  recipientName: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  subject: string;
  message: string;
  attemptNumber: number;
  channel: NotificationChannel;
  metadata?: Record<string, any>;
}

export interface ProviderSendResult {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'REJECTED';
  providerName: string;
  providerResponse: string;
  failureReason?: string | null;
  timestamp: string;
  deliveredAt?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  name: string;
  send(payload: ProviderSendPayload): Promise<ProviderSendResult>;
}

// Global simulation flags for testing provider failure / fallback / timeout (Section 33, 45)
export interface ProviderSimulationOptions {
  forceFailSMS?: boolean;
  forceTimeoutEmail?: boolean;
  simulatedLatencyMs?: number;
}

let simulationOptions: ProviderSimulationOptions = {
  forceFailSMS: false,
  forceTimeoutEmail: false,
  simulatedLatencyMs: 250,
};

export function setProviderSimulation(options: Partial<ProviderSimulationOptions>) {
  simulationOptions = { ...simulationOptions, ...options };
}

export function getProviderSimulation(): ProviderSimulationOptions {
  return { ...simulationOptions };
}

// 1. In-App Notification Provider
export class InAppNotificationProvider implements NotificationProvider {
  channel: NotificationChannel = 'IN_APP';
  name = 'PolarisInAppProvider';

  async send(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    const timestamp = new Date().toISOString();
    
    // In-app notifications deliver directly to browser storage & SSE stream
    return {
      success: true,
      status: 'SUCCESS',
      providerName: this.name,
      providerResponse: `Delivered to In-App Session for [${payload.recipientName}]. Real-time SSE broadcast emitted.`,
      failureReason: null,
      timestamp,
      deliveredAt: timestamp,
    };
  }
}

// 2. Email Notification Provider (Iridium Satellite & NCPOR Gateway)
export class EmailNotificationProvider implements NotificationProvider {
  channel: NotificationChannel = 'EMAIL';
  name = 'NCPOR-IridiumEmailGateway';

  async send(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    const timestamp = new Date().toISOString();

    // Check contact validity (Section 41 edge case)
    if (!payload.recipientEmail || !payload.recipientEmail.includes('@')) {
      return {
        success: false,
        status: 'REJECTED',
        providerName: this.name,
        providerResponse: '550 5.1.1 Invalid or missing recipient email address',
        failureReason: `Recipient '${payload.recipientName}' does not have a valid email configured`,
        timestamp,
      };
    }

    if (simulationOptions.forceTimeoutEmail) {
      return {
        success: false,
        status: 'TIMEOUT',
        providerName: this.name,
        providerResponse: '421 4.4.2 Polar VSAT ground station connection timed out',
        failureReason: 'Gateway connection timed out after 30000ms',
        timestamp,
      };
    }

    // Realistic delivery simulation
    return {
      success: true,
      status: 'SUCCESS',
      providerName: this.name,
      providerResponse: `250 2.0.0 Message accepted for delivery to ${payload.recipientEmail} via NCPOR Secure Relay`,
      failureReason: null,
      timestamp,
      deliveredAt: new Date(Date.now() + 500).toISOString(),
    };
  }
}

// 3. SMS Notification Provider (Iridium Satellite SBD / SMS Gateway)
export class SMSNotificationProvider implements NotificationProvider {
  channel: NotificationChannel = 'SMS';
  name = 'IridiumSatelliteSMSGateway';

  async send(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    const timestamp = new Date().toISOString();

    // Check contact validity (Section 41 edge case)
    if (!payload.recipientPhone || payload.recipientPhone.trim().length < 6) {
      return {
        success: false,
        status: 'REJECTED',
        providerName: this.name,
        providerResponse: 'ERR_INVALID_MSISDN: Missing or malformed phone number',
        failureReason: `Recipient '${payload.recipientName}' has no satellite or mobile phone number on file`,
        timestamp,
      };
    }

    if (simulationOptions.forceFailSMS) {
      return {
        success: false,
        status: 'FAILED',
        providerName: this.name,
        providerResponse: 'ERR_IRIDIUM_LINK_DOWN: Constellation beam blocked or ionospheric disturbance',
        failureReason: 'Satellite uplink failed; signal strength 0/5',
        timestamp,
      };
    }

    // High-priority satellite SBD burst dispatch
    const packetId = `SBD-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: true,
      status: 'SUCCESS',
      providerName: this.name,
      providerResponse: `Packet [${packetId}] transmitted to satellite transponder for ${payload.recipientPhone}. Delivery verified.`,
      failureReason: null,
      timestamp,
      deliveredAt: new Date(Date.now() + 800).toISOString(),
    };
  }
}

// Provider Registry
const inAppProvider = new InAppNotificationProvider();
const emailProvider = new EmailNotificationProvider();
const smsProvider = new SMSNotificationProvider();

export function getNotificationProvider(channel: NotificationChannel): NotificationProvider {
  switch (channel) {
    case 'IN_APP':
      return inAppProvider;
    case 'EMAIL':
      return emailProvider;
    case 'SMS':
      return smsProvider;
    default:
      return inAppProvider;
  }
}
