/**
 * Basic webhook settings UI component
 * Provides UI for managing webhook subscriptions and notifications
 * 
 * Note: This is a simplified version that doesn't use the WebhookService
 * due to module resolution issues. Can be enhanced when those are resolved.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface BasicWebhookSettings {
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

interface WebhookSettingsProps {
  className?: string;
}

export default function WebhookSettings({ className = '' }: WebhookSettingsProps) {
  const [settings, setSettings] = useState<BasicWebhookSettings>({
    gmail: { enabled: false, autoSummarise: true },
    outlook: { enabled: false, autoSummarise: true },
    notifications: { showToast: true, showBadge: true }
  });
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('webhook-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load webhook settings:', error);
      }
    }
  }, []);

  const saveSettings = useCallback((newSettings: BasicWebhookSettings) => {
    setSettings(newSettings);
    localStorage.setItem('webhook-settings', JSON.stringify(newSettings));
  }, []);

  const handleProviderToggle = useCallback(async (provider: 'gmail' | 'outlook', enabled: boolean) => {
    setIsLoading(prev => ({ ...prev, [provider]: true }));

    try {
      if (enabled) {
        // Create subscription
        const userEmail = 'user@example.com'; // TODO: Get from auth context
        setConnectionStatus('connecting');
        
        const response = await fetch(`/api/webhook/subscriptions/${provider}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            userEmail: userEmail,
            ...(provider === 'outlook' ? { accessToken: 'token' } : {}) // TODO: Get real token
          })
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || `Failed to enable ${provider} notifications`);
        }

        // Request notification permission if not already granted
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        
        setConnectionStatus('connected');
        setLastError(null);
      } else {
        // Delete subscription
        const response = await fetch(`/api/webhook/subscriptions/${provider}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            userEmail: 'user@example.com' // TODO: Get from auth context
          })
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || `Failed to disable ${provider} notifications`);
        }
        
        // Check if any providers are still enabled
        const otherProvider = provider === 'gmail' ? 'outlook' : 'gmail';
        if (!settings[otherProvider].enabled) {
          setConnectionStatus('disconnected');
        }
      }

      saveSettings({
        ...settings,
        [provider]: { ...settings[provider], enabled }
      });

    } catch (error) {
      console.error(`Error toggling ${provider} webhook:`, error);
      setConnectionStatus('error');
      setLastError(`Failed to ${enabled ? 'enable' : 'disable'} ${provider} notifications: ${error}`);
    } finally {
      setIsLoading(prev => ({ ...prev, [provider]: false }));
    }
  }, [settings, saveSettings]);

  const handleAutoSummariseToggle = useCallback((provider: 'gmail' | 'outlook', autoSummarise: boolean) => {
    saveSettings({
      ...settings,
      [provider]: { ...settings[provider], autoSummarise }
    });
  }, [settings, saveSettings]);

  const handleNotificationToggle = useCallback((setting: 'showToast' | 'showBadge', enabled: boolean) => {
    saveSettings({
      ...settings,
      notifications: { ...settings.notifications, [setting]: enabled }
    });
  }, [settings, saveSettings]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-gray-800">Real-time Notifications</h2>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <span className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
              {getStatusText(connectionStatus)}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4">
          Receive instant notifications when new emails arrive. Only message identifiers are sent through our servers;
          full email content is fetched directly from your email provider when needed.
        </p>
        
        {lastError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{lastError}</p>
          </div>
        )}
      </div>

      {/* Gmail Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Gmail Notifications</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.gmail.enabled}
              onChange={(e) => handleProviderToggle('gmail', e.target.checked)}
              disabled={isLoading.gmail}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.gmail.autoSummarise}
              onChange={(e) => handleAutoSummariseToggle('gmail', e.target.checked)}
              disabled={!settings.gmail.enabled}
              className="mr-3 disabled:opacity-50"
            />
            <span className={`text-gray-700 ${!settings.gmail.enabled ? 'opacity-50' : ''}`}>
              Automatically summarise new emails
            </span>
          </label>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Requires Gmail OAuth authentication and Google Cloud Pub/Sub configuration.
        </p>
        
        {isLoading.gmail && (
          <div className="mt-2 text-sm text-blue-600">
            <span className="animate-pulse">Setting up Gmail notifications...</span>
          </div>
        )}
      </div>

      {/* Outlook Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Outlook Notifications</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.outlook.enabled}
              onChange={(e) => handleProviderToggle('outlook', e.target.checked)}
              disabled={isLoading.outlook}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.outlook.autoSummarise}
              onChange={(e) => handleAutoSummariseToggle('outlook', e.target.checked)}
              disabled={!settings.outlook.enabled}
              className="mr-3 disabled:opacity-50"
            />
            <span className={`text-gray-700 ${!settings.outlook.enabled ? 'opacity-50' : ''}`}>
              Automatically summarise new emails
            </span>
          </label>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Requires Outlook OAuth authentication and Microsoft Graph API access.
        </p>
        
        {isLoading.outlook && (
          <div className="mt-2 text-sm text-blue-600">
            <span className="animate-pulse">Setting up Outlook notifications...</span>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Notification Preferences</h3>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.showToast}
              onChange={(e) => handleNotificationToggle('showToast', e.target.checked)}
              className="mr-3"
            />
            <span className="text-gray-700">Show browser notifications</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.showBadge}
              onChange={(e) => handleNotificationToggle('showBadge', e.target.checked)}
              className="mr-3"
            />
            <span className="text-gray-700">Show notification badge</span>
          </label>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-2">How Webhook Notifications Work</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>• <strong>Gmail</strong>: Uses Google Pub/Sub to receive push notifications when emails arrive</p>
          <p>• <strong>Outlook</strong>: Uses Microsoft Graph subscriptions to monitor inbox changes</p>
          <p>• <strong>Privacy</strong>: Only message IDs are transmitted; full content stays with your email provider</p>
          <p>• <strong>Real-time</strong>: Notifications appear within seconds of email arrival</p>
        </div>
      </div>
    </div>
  );
}