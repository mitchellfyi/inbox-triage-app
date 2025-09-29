/**
 * Privacy notification component for hybrid processing mode
 * Shows when cloud processing is being used with privacy information
 */

'use client';

import { useState } from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface PrivacyNotificationProps {
  /**
   * The reason why hybrid processing is being used
   */
  reason: string;
  
  /**
   * Whether the notification can be dismissed
   */
  dismissible?: boolean;
  
  /**
   * Callback when notification is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export default function PrivacyNotification({
  reason,
  dismissible = true,
  onDismiss,
  className = ''
}: PrivacyNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) {
    return null;
  }
  
  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };
  
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start">
        <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="text-sm text-blue-800">
            <strong className="font-medium">Using secure cloud summarisation</strong>
            <p className="mt-1 text-blue-700">
              {reason}
            </p>
            <p className="mt-2 text-xs text-blue-600">
              Only derived text is sent to our servers, never raw attachments or personal data.{' '}
              <a 
                href="/privacy" 
                className="underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about our privacy practices
              </a>
            </p>
          </div>
        </div>
        
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-3 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm"
            aria-label="Dismiss notification"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for managing privacy notification state
 */
export function usePrivacyNotification() {
  const [notification, setNotification] = useState<{
    visible: boolean;
    reason: string;
  }>({
    visible: false,
    reason: ''
  });
  
  const showNotification = (reason: string) => {
    setNotification({
      visible: true,
      reason
    });
  };
  
  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      visible: false
    }));
  };
  
  return {
    notification,
    showNotification,
    hideNotification
  };
}