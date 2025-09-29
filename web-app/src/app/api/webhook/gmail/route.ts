import { NextRequest, NextResponse } from 'next/server';
import type { GmailPubSubMessage, GmailHistoryMessage, WebhookEvent } from '../../../../types/webhooks';

/**
 * Gmail webhook handler for Google Pub/Sub push notifications
 * Receives notifications when new emails arrive in user's inbox
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the Pub/Sub message
    const pubSubMessage: GmailPubSubMessage = await request.json();
    
    // Verify message structure
    if (!pubSubMessage.message || !pubSubMessage.message.data) {
      console.error('Invalid Pub/Sub message structure');
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    // Decode the base64 data
    let historyMessage: GmailHistoryMessage;
    try {
      const decodedData = Buffer.from(pubSubMessage.message.data, 'base64').toString('utf-8');
      historyMessage = JSON.parse(decodedData);
    } catch (error) {
      console.error('Failed to decode Pub/Sub message data:', error);
      return NextResponse.json(
        { error: 'Invalid message data' },
        { status: 400 }
      );
    }

    // Validate the history message
    if (!historyMessage.emailAddress || !historyMessage.historyId) {
      console.error('Missing required fields in history message:', historyMessage);
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Processing Gmail webhook for:', {
      emailAddress: historyMessage.emailAddress,
      historyId: historyMessage.historyId,
      messageId: pubSubMessage.message.messageId
    });

    // Create webhook event
    const webhookEvent: WebhookEvent = {
      provider: 'gmail',
      messageId: historyMessage.historyId, // Use historyId as messageId for Gmail
      timestamp: Date.now(),
      changeType: 'created'
    };

    // TODO: Send event to connected WebSocket clients
    // For now, we'll store events in a simple in-memory queue
    // In production, this should be a proper message queue (Redis, etc.)
    await broadcastWebhookEvent(webhookEvent);

    return NextResponse.json(
      { 
        message: 'Gmail webhook processed successfully',
        historyId: historyMessage.historyId 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Gmail webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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