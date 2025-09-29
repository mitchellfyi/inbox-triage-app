import { NextRequest, NextResponse } from 'next/server';
import type { WebhookEvent } from '../../../../types/webhooks';

/**
 * Webhook events API endpoint
 * Provides access to recent webhook events for the frontend
 * Supports both polling and Server-Sent Events (SSE)
 */

// Global event storage (in production, use Redis or similar)
declare global {
  var webhookEvents: WebhookEvent[] | undefined;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode');
  const lastEventId = url.searchParams.get('lastEventId');

  if (mode === 'sse') {
    // Server-Sent Events implementation
    return handleSSE(request, lastEventId);
  } else {
    // Regular polling implementation
    return handlePolling(lastEventId);
  }
}

/**
 * Handle Server-Sent Events connection
 */
function handleSSE(request: NextRequest, lastEventId: string | null): Response {
  // Create SSE response
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(formatSSEMessage('connected', { timestamp: Date.now() }));

      // Send any events that occurred after lastEventId
      const events = getEventsAfter(lastEventId ? parseInt(lastEventId) : 0);
      events.forEach(event => {
        controller.enqueue(formatSSEMessage('webhook-event', event, event.timestamp));
      });

      // Set up periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(formatSSEMessage('ping', { timestamp: Date.now() }));
        } catch (error) {
          // Connection closed
          clearInterval(pingInterval);
        }
      }, 30000); // Ping every 30 seconds

      // TODO: In production, set up event listener for new webhook events
      // and push them through this connection
      
      // Clean up on connection close
      request.signal?.addEventListener('abort', () => {
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

/**
 * Handle regular polling requests
 */
function handlePolling(lastEventId: string | null): NextResponse {
  const sinceTimestamp = lastEventId ? parseInt(lastEventId) : 0;
  const events = getEventsAfter(sinceTimestamp);

  return NextResponse.json({
    events,
    lastEventId: events.length > 0 ? Math.max(...events.map(e => e.timestamp)).toString() : lastEventId,
    hasMore: false // For simple implementation, we'll always return all events
  });
}

/**
 * Get events that occurred after the specified timestamp
 */
function getEventsAfter(timestamp: number): WebhookEvent[] {
  if (typeof global === 'undefined' || !global.webhookEvents) {
    return [];
  }

  return global.webhookEvents.filter(event => event.timestamp > timestamp);
}

/**
 * Format message for Server-Sent Events
 */
function formatSSEMessage(type: string, data: unknown, id?: number): Uint8Array {
  const encoder = new TextEncoder();
  let message = `event: ${type}\n`;
  
  if (id) {
    message += `id: ${id}\n`;
  }
  
  message += `data: ${JSON.stringify(data)}\n\n`;
  
  return encoder.encode(message);
}