import { NextRequest, NextResponse } from 'next/server';
import type { OutlookWebhookPayload, OutlookWebhookNotification, WebhookEvent } from '../../../../types/webhooks';

/**
 * Microsoft Graph webhook handler for Outlook email notifications
 * Handles both validation requests and actual notification events
 */
export async function POST(request: NextRequest) {
  try {
    const body: OutlookWebhookPayload = await request.json();
    
    // Handle Microsoft Graph webhook notifications
    // These notifications inform us when emails are received/changed
    console.log('Received Outlook webhook:', body);
    
    // Validate webhook notification structure
    if (!body.value || !Array.isArray(body.value)) {
      console.error('Invalid webhook payload structure');
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    // Process each notification
    for (const notification of body.value) {
      if (!isValidOutlookNotification(notification)) {
        console.error('Invalid notification format:', notification);
        continue;
      }

      console.log(`Outlook notification: ${notification.changeType} on ${notification.resource}`);
      
      // Extract message ID from resource path
      const messageId = extractMessageIdFromResource(notification.resource);
      if (!messageId) {
        console.error('Could not extract message ID from resource:', notification.resource);
        continue;
      }

      // Create webhook event
      const webhookEvent: WebhookEvent = {
        provider: 'outlook',
        messageId: messageId,
        timestamp: Date.now(),
        changeType: notification.changeType
      };

      // Only process 'created' events for new email notifications
      if (notification.changeType === 'created') {
        await broadcastWebhookEvent(webhookEvent);
      }
    }
    
    return NextResponse.json(
      { message: 'Outlook webhook processed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Outlook webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Handle Microsoft Graph webhook validation
  // When setting up a webhook subscription, Microsoft Graph sends a validation request
  const url = new URL(request.url);
  const validationToken = url.searchParams.get('validationToken');
  
  if (validationToken) {
    // Return the validation token as plain text for webhook validation
    console.log('Validating Outlook webhook with token:', validationToken);
    return new Response(validationToken, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
  
  return NextResponse.json(
    { 
      message: 'Outlook webhook endpoint',
      description: 'Receives Microsoft Graph webhook notifications for email changes',
      validation: 'Pass validationToken query parameter for subscription validation'
    },
    { status: 200 }
  );
}

/**
 * Validate Outlook notification structure
 */
function isValidOutlookNotification(notification: unknown): notification is OutlookWebhookNotification {
  if (!notification || typeof notification !== 'object') {
    return false;
  }
  
  const n = notification as Record<string, unknown>;
  return (
    typeof n.changeType === 'string' &&
    typeof n.resource === 'string' &&
    typeof n.subscriptionId === 'string' &&
    ['created', 'updated', 'deleted'].includes(n.changeType)
  );
}

/**
 * Extract message ID from Microsoft Graph resource path
 * Resource format: "/users/{userId}/mailFolders('Inbox')/messages/{messageId}"
 */
function extractMessageIdFromResource(resource: string): string | null {
  const messageMatch = resource.match(/\/messages\/([^/]+)$/);
  return messageMatch ? messageMatch[1] : null;
}

/**
 * Broadcast webhook event to connected clients
 * This is a placeholder implementation - in production this would use WebSockets/SSE
 */
async function broadcastWebhookEvent(event: WebhookEvent) {
  // TODO: Implement WebSocket broadcasting
  // For now, just log the event
  console.log('Broadcasting webhook event:', event);
  
  // Store in simple in-memory queue for now
  // This would be replaced with proper WebSocket/SSE implementation
  if (typeof global !== 'undefined') {
    if (!global.webhookEvents) {
      global.webhookEvents = [];
    }
    global.webhookEvents.push(event);
    
    // Keep only the last 100 events
    if (global.webhookEvents.length > 100) {
      global.webhookEvents = global.webhookEvents.slice(-100);
    }
  }
}