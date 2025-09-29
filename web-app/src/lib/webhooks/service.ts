/**
 * WebhookService - Manages real-time webhook events from email providers
 * Handles both Server-Sent Events (SSE) and polling for webhook notifications
 * 
 * Note: This service is designed to work client-side only for simplicity
 */

import type { 
  WebhookEvent, 
  WebhookServiceState
} from '../../types/webhooks';
import { WebhookConnectionStatus } from '../../types/webhooks';

export interface WebhookEventListener {
  (event: WebhookEvent): void;
}

export interface WebhookStatusListener {
  (status: WebhookConnectionStatus, error?: string): void;
}

export class WebhookService {
  private eventSource: EventSource | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private eventListeners: WebhookEventListener[] = [];
  private statusListeners: WebhookStatusListener[] = [];
  private state: WebhookServiceState;
  private useSSE: boolean = true;
  private lastEventId: string | null = null;

  constructor() {
    this.state = {
      status: WebhookConnectionStatus.DISCONNECTED,
      pendingEvents: []
    };
  }

  /**
   * Start the webhook service
   */
  public start(): void {
    // Only start if running in browser
    if (typeof window === 'undefined') {
      console.warn('WebhookService can only run in browser environment');
      return;
    }

    if (this.state.status === WebhookConnectionStatus.CONNECTED || 
        this.state.status === WebhookConnectionStatus.CONNECTING) {
      return;
    }

    this.updateStatus(WebhookConnectionStatus.CONNECTING);

    if (this.useSSE && typeof EventSource !== 'undefined') {
      this.startSSE();
    } else {
      this.startPolling();
    }
  }

  /**
   * Stop the webhook service
   */
  public stop(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.updateStatus(WebhookConnectionStatus.DISCONNECTED);
  }

  /**
   * Add event listener for webhook events
   */
  public addEventListener(listener: WebhookEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(listener: WebhookEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Add status listener
   */
  public addStatusListener(listener: WebhookStatusListener): void {
    this.statusListeners.push(listener);
  }

  /**
   * Remove status listener
   */
  public removeStatusListener(listener: WebhookStatusListener): void {
    const index = this.statusListeners.indexOf(listener);
    if (index > -1) {
      this.statusListeners.splice(index, 1);
    }
  }

  /**
   * Get current service state
   */
  public getState(): WebhookServiceState {
    return { ...this.state };
  }

  /**
   * Start Server-Sent Events connection
   */
  private startSSE(): void {
    const url = new URL('/api/webhook/events', window.location.origin);
    url.searchParams.set('mode', 'sse');
    if (this.lastEventId) {
      url.searchParams.set('lastEventId', this.lastEventId);
    }

    this.eventSource = new EventSource(url.toString());

    this.eventSource.onopen = () => {
      this.updateStatus(WebhookConnectionStatus.CONNECTED);
      this.state.lastConnected = new Date();
    };

    this.eventSource.onerror = () => {
      console.error('SSE connection error');
      this.updateStatus(WebhookConnectionStatus.ERROR, 'Connection failed');
      
      // Fallback to polling if SSE fails
      this.useSSE = false;
      this.eventSource?.close();
      this.eventSource = null;
      
      // Retry with polling after a delay
      setTimeout(() => {
        if (this.state.status === WebhookConnectionStatus.ERROR) {
          this.start();
        }
      }, 5000);
    };

    this.eventSource.addEventListener('connected', () => {
      console.log('SSE connected');
    });

    this.eventSource.addEventListener('webhook-event', (event) => {
      try {
        const webhookEvent: WebhookEvent = JSON.parse(event.data);
        this.handleWebhookEvent(webhookEvent);
        if (event instanceof MessageEvent) {
          this.lastEventId = event.lastEventId || null;
        }
      } catch (error) {
        console.error('Failed to parse webhook event:', error);
      }
    });

    this.eventSource.addEventListener('ping', () => {
      // Keep connection alive - no action needed
    });
  }

  /**
   * Start polling for webhook events
   */
  private startPolling(): void {
    this.updateStatus(WebhookConnectionStatus.CONNECTED);
    this.state.lastConnected = new Date();

    const poll = async () => {
      try {
        const url = new URL('/api/webhook/events', window.location.origin);
        if (this.lastEventId) {
          url.searchParams.set('lastEventId', this.lastEventId);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Process new events
        if (data.events && Array.isArray(data.events)) {
          data.events.forEach((event: WebhookEvent) => {
            this.handleWebhookEvent(event);
          });
        }

        this.lastEventId = data.lastEventId;

        // Update status if we were in error state
        if (this.state.status === WebhookConnectionStatus.ERROR) {
          this.updateStatus(WebhookConnectionStatus.CONNECTED);
        }

      } catch (error) {
        console.error('Polling error:', error);
        this.updateStatus(WebhookConnectionStatus.ERROR, `Polling failed: ${error}`);
      }
    };

    // Start polling immediately, then every 10 seconds
    poll();
    this.pollingInterval = setInterval(poll, 10000);
  }

  /**
   * Handle incoming webhook event
   */
  private handleWebhookEvent(event: WebhookEvent): void {
    console.log('Received webhook event:', event);
    
    // Add to pending events
    this.state.pendingEvents.push(event);
    
    // Keep only the last 50 events
    if (this.state.pendingEvents.length > 50) {
      this.state.pendingEvents = this.state.pendingEvents.slice(-50);
    }

    // Notify listeners
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (listenerError) {
        console.error('Error in webhook event listener:', listenerError);
      }
    });
  }

  /**
   * Update service status
   */
  private updateStatus(status: WebhookConnectionStatus, error?: string): void {
    this.state.status = status;
    if (error) {
      this.state.lastError = error;
    } else if (status === WebhookConnectionStatus.CONNECTED) {
      this.state.lastError = undefined;
    }

    // Notify status listeners
    this.statusListeners.forEach(listener => {
      try {
        listener(status, error);
      } catch (listenerError) {
        console.error('Error in webhook status listener:', listenerError);
      }
    });
  }

  /**
   * Get pending events and mark them as read
   */
  public getPendingEvents(): WebhookEvent[] {
    const events = [...this.state.pendingEvents];
    this.state.pendingEvents = [];
    return events;
  }
}

// Singleton instance - only create in browser environment
let webhookService: WebhookService | null = null;

/**
 * Get the singleton WebhookService instance
 */
export function getWebhookService(): WebhookService {
  if (typeof window === 'undefined') {
    // Return a dummy service for SSR
    return {
      start: () => {},
      stop: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      addStatusListener: () => {},
      removeStatusListener: () => {},
      getState: () => ({
        status: WebhookConnectionStatus.DISCONNECTED,
        pendingEvents: []
      }),
      getPendingEvents: () => []
    } as WebhookService;
  }

  if (!webhookService) {
    webhookService = new WebhookService();
  }
  return webhookService;
}