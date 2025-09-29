/**
 * Type definitions for webhook integration
 */

export interface WebhookEvent {
  provider: 'gmail' | 'outlook';
  messageId: string;
  timestamp: number;
  changeType?: 'created' | 'updated' | 'deleted';
}

export interface GmailPubSubMessage {
  message: {
    data: string; // Base64 encoded JSON
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

export interface GmailHistoryMessage {
  emailAddress: string;
  historyId: string;
}

export interface OutlookWebhookNotification {
  changeType: 'created' | 'updated' | 'deleted';
  clientState?: string;
  resource: string;
  resourceData?: {
    '@odata.type': string;
    '@odata.id': string;
    id: string;
  };
  subscriptionExpirationDateTime: string;
  subscriptionId: string;
  tenantId: string;
}

export interface OutlookWebhookPayload {
  value: OutlookWebhookNotification[];
}

export interface WebhookSubscription {
  id: string;
  provider: 'gmail' | 'outlook';
  userId: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  subscriptionId?: string; // For Outlook Graph subscriptions
  topicName?: string; // For Gmail Pub/Sub topic
}

export interface WebhookSettings {
  gmail: {
    enabled: boolean;
    autoSummarise: boolean;
  };
  outlook: {
    enabled: boolean;
    autoSummarise: boolean;
  };
  notifications: {
    showToast: boolean;
    showBadge: boolean;
  };
}

export enum WebhookConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export interface WebhookServiceState {
  status: WebhookConnectionStatus;
  lastConnected?: Date;
  lastError?: string;
  pendingEvents: WebhookEvent[];
}