'use client';

import React from 'react';
import { SummariserAvailability } from '../lib/ai/summarizer';

interface ThreadSummaryProps {
  /** The TL;DR summary text */
  tldr?: string;
  /** Array of key points */
  keyPoints?: string[];
  /** Loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Current availability status */
  availability?: SummariserAvailability;
  /** Whether model is downloading */
  isDownloading?: boolean;
}

/**
 * Component that displays thread summary with TL;DR and key points
 * Handles loading states, errors, and model availability messaging
 */
export default function ThreadSummary({
  tldr,
  keyPoints,
  isLoading = false,
  error,
  availability,
  isDownloading = false
}: ThreadSummaryProps) {
  // Show error state first (highest priority)
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6 mb-6" role="alert">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800 mb-1">
              Summarisation Failed
            </h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading || isDownloading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6" role="status" aria-live="polite">
        <div className="flex items-center space-x-3 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <h2 className="text-lg font-semibold text-gray-800">
            {isDownloading ? 'Downloading summariser model...' : 'Generating summary...'}
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          {isDownloading 
            ? 'This may take a few moments for the first use.' 
            : 'Please wait while we analyse your thread.'}
        </p>
      </div>
    );
  }

  // Show unavailable state
  if (availability === SummariserAvailability.UNAVAILABLE) {
    return (
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6 mb-6" role="status">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              Summariser Unavailable
            </h3>
            <p className="text-sm text-yellow-700">
              Chrome&apos;s built-in AI is not available on this device. 
              Please try using a supported Chrome version or enable hybrid mode for server-side processing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if no content to show
  if (!tldr && (!keyPoints || keyPoints.length === 0)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Thread Summary</h2>
      
      {/* TL;DR Section */}
      {tldr && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
            TL;DR
          </h3>
          <div className="bg-blue-50 rounded-md p-4 border-l-4 border-blue-400">
            <p className="text-gray-800 leading-relaxed">{tldr}</p>
          </div>
        </div>
      )}

      {/* Key Points Section */}
      {keyPoints && keyPoints.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
            Key Points
          </h3>
          <ul className="space-y-2">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2"></span>
                <span className="text-gray-800 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}