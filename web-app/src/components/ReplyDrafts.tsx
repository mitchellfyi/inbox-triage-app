'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { generateDrafts, checkPromptAvailability, PromptAvailability, type Draft, type DraftTone, type PromptError } from '../lib/ai/promptDrafts';
import GuidanceBar from './GuidanceBar';

interface ReplyDraftsProps {
  /** The email thread content to generate replies for */
  threadContent?: string;
  /** Loading state from parent component */
  isLoading?: boolean;
  /** Whether the thread summary is available */
  hasSummary?: boolean;
}

const TONE_OPTIONS: { value: DraftTone; label: string; description: string }[] = [
  { value: 'neutral', label: 'Neutral', description: 'Professional and balanced' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'assertive', label: 'Assertive', description: 'Confident and direct' },
  { value: 'formal', label: 'Formal', description: 'Highly professional' }
];

const DRAFT_TYPES = [
  { label: 'Short Reply', description: 'Brief acknowledgment or quick response' },
  { label: 'Medium Reply', description: 'Includes clarifications or additional context' },
  { label: 'Comprehensive Reply', description: 'Detailed response with next steps' }
];

/**
 * Component for generating and displaying reply drafts with tone control and guidance
 */
export default function ReplyDrafts({ threadContent, isLoading = false, hasSummary = false }: ReplyDraftsProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedTone, setSelectedTone] = useState<DraftTone>('neutral');
  const [guidance, setGuidance] = useState('');
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [availability, setAvailability] = useState<PromptAvailability>();
  const [isDownloading, setIsDownloading] = useState(false);

  // Check AI model availability on component mount
  useEffect(() => {
    async function checkAvailability() {
      try {
        const status = await checkPromptAvailability();
        setAvailability(status);
      } catch (err) {
        console.error('Failed to check prompt availability:', err);
        setAvailability(PromptAvailability.UNAVAILABLE);
      }
    }

    checkAvailability();
  }, []);

  // Debounced draft generation
  useEffect(() => {
    if (!threadContent || !hasSummary) return;

    const timeoutId = setTimeout(() => {
      handleGenerateDrafts();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTone, guidance, threadContent, hasSummary]);

  const handleGenerateDrafts = useCallback(async () => {
    if (!threadContent || isDraftLoading) return;

    setError(undefined);
    setIsDraftLoading(true);

    try {
      // Check if model needs downloading
      const currentAvailability = await checkPromptAvailability();
      setAvailability(currentAvailability);
      
      if (currentAvailability === PromptAvailability.AFTER_DOWNLOAD) {
        setIsDownloading(true);
      }

      const generatedDrafts = await generateDrafts(threadContent, selectedTone, guidance);
      setDrafts(generatedDrafts);
    } catch (err) {
      console.error('Draft generation failed:', err);
      
      const promptError = err as PromptError;
      setError(promptError.userMessage || 'An unexpected error occurred');
      setDrafts([]);
    } finally {
      setIsDraftLoading(false);
      setIsDownloading(false);
    }
  }, [threadContent, selectedTone, guidance, isDraftLoading]);

  const handleCopyDraft = useCallback(async (draft: Draft) => {
    try {
      await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy draft:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `Subject: ${draft.subject}\n\n${draft.body}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }, []);

  // Don't render if no thread content or summary
  if (!threadContent || !hasSummary) {
    return null;
  }

  // Show unavailable state
  if (availability === PromptAvailability.UNAVAILABLE) {
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
              Draft Generation Unavailable
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Reply Drafts</h2>
      
      {/* Controls */}
      <div className="space-y-4 mb-6">
        {/* Tone Selector */}
        <div>
          <label htmlFor="tone-select" className="block text-sm font-medium text-gray-700 mb-2">
            Tone
          </label>
          <select
            id="tone-select"
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value as DraftTone)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isDraftLoading || isLoading}
          >
            {TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* Guidance Input */}
        <GuidanceBar
          value={guidance}
          onChange={setGuidance}
          disabled={isDraftLoading || isLoading}
          maxLength={500}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 mb-6" role="alert">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Draft Generation Failed
              </h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(isDraftLoading || isDownloading) && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6" role="status" aria-live="polite">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                {isDownloading ? 'Downloading language model...' : 'Generating reply drafts...'}
              </h3>
              <p className="text-sm text-blue-700">
                {isDownloading 
                  ? 'This may take a few moments for the first use.' 
                  : 'Please wait while we create your drafts.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Drafts Display */}
      {drafts.length > 0 && !isDraftLoading && !isDownloading && (
        <div className="space-y-4">
          {drafts.map((draft, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  {DRAFT_TYPES[index]?.label || `Draft ${index + 1}`}
                </h3>
                <button
                  onClick={() => handleCopyDraft(draft)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
              
              {DRAFT_TYPES[index] && (
                <p className="text-xs text-gray-500 mb-3">
                  {DRAFT_TYPES[index].description}
                </p>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                  <div className="bg-gray-50 rounded p-2 text-sm text-gray-800">
                    {draft.subject}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Body</label>
                  <div className="bg-gray-50 rounded p-3 text-sm text-gray-800 whitespace-pre-wrap">
                    {draft.body}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}