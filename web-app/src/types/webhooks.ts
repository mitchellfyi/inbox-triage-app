/**
 * Type definitions for webhook integration
 */

export enum WebhookConnectionStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected', 
  ERROR = 'error'
}

export interface WebhookSubscription {
  id: string;
  provider: 'gmail' | 'outlook';
  userId: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  topicName?: string; // For Gmail
  resourceUrl?: string; // For Outlook  
  subscriptionId?: string; // For Outlook
}

export interface WebhookState {
  status: WebhookConnectionStatus;
  lastEventTime?: number;
  eventCount: number;
  error?: string;
  pendingEvents: WebhookEvent[];
  lastError?: string;
  lastConnected?: Date;
}

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