/**
 * WebhookNotificationBadge component
 * Shows a badge with count of new email notifications from webhooks
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getWebhookService } from '../../lib/webhooks/service';
import type { WebhookEvent } from '../../types/webhooks';
import { WebhookConnectionStatus } from '../../types/webhooks';

interface WebhookNotificationBadgeProps {
  className?: string;
  onClick?: () => void;
}

export default function WebhookNotificationBadge({ 
  className = '', 
  onClick 
}: WebhookNotificationBadgeProps) {
  const [eventCount, setEventCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<WebhookConnectionStatus>(
    WebhookConnectionStatus.DISCONNECTED
  );

  const webhookService = getWebhookService();

  useEffect(() => {
    // Set up event listeners
    const handleEvent = (event: WebhookEvent) => {
      setEventCount(prev => prev + 1);
    };

    const handleStatus = (status: WebhookConnectionStatus) => {
      setConnectionStatus(status);
    };

    webhookService.addEventListener(handleEvent);
    webhookService.addStatusListener(handleStatus);

    // Get initial state
    const currentState = webhookService.getState();
    setConnectionStatus(currentState.status);
    setEventCount(currentState.pendingEvents.length);

    return () => {
      webhookService.removeEventListener(handleEvent);
      webhookService.removeStatusListener(handleStatus);
    };
  }, [webhookService]);

  const handleClick = () => {
    // Clear the badge count when clicked
    setEventCount(0);
    
    if (onClick) {
      onClick();
    }
  };

  // Don't show badge if no events or not connected
  if (eventCount === 0 || connectionStatus !== WebhookConnectionStatus.CONNECTED) {
    return null;
  }

  return (
    <div 
      className={`relative inline-flex items-center cursor-pointer ${className}`}
      onClick={handleClick}
      title={`${eventCount} new email${eventCount !== 1 ? 's' : ''} received`}
    >
      {/* Notification bell icon */}
      <svg 
        className="w-6 h-6 text-gray-600 hover:text-gray-800" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 17h5l-5-5V9c0-1.657-1.343-3-3-3s-3 1.343-3 3v3l-5 5h5m0 0v1a3 3 0 006 0v-1m-6 0h6"
        />
      </svg>
      
      {/* Badge with count */}
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]">
        {eventCount > 99 ? '99+' : eventCount}
      </span>
      
      {/* Animated pulse effect */}
      <span className="absolute -top-2 -right-2 bg-red-500 rounded-full h-5 w-5 animate-ping opacity-20"></span>
    </div>
  );
}

/**
 * WebhookNotificationDropdown component
 * Shows a dropdown list of recent webhook events
 */
export function WebhookNotificationDropdown({ 
  className = '',
  isOpen = false,
  onClose 
}: {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const [recentEvents, setRecentEvents] = useState<WebhookEvent[]>([]);
  const webhookService = getWebhookService();

  useEffect(() => {
    if (isOpen) {
      // Get recent events when dropdown opens
      const currentState = webhookService.getState();
      setRecentEvents(currentState.pendingEvents.slice(0, 10));
    }
  }, [isOpen, webhookService]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 w-80 z-50 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">New Emails</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {recentEvents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No new emails
          </div>
        ) : (
          recentEvents.map((event, index) => (
            <div key={`${event.timestamp}-${index}`} className="p-3 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    event.provider === 'gmail' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      New {event.provider} email
                    </p>
                    <p className="text-xs text-gray-500">
                      {event.changeType === 'created' ? 'Received' : event.changeType}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200">
        <button 
          className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
          onClick={() => {
            // Navigate to triage view
            window.location.href = '/';
          }}
        >
          View All Emails
        </button>
      </div>
    </div>
  );
}