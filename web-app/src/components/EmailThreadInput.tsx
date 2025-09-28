'use client';

import React, { useState, useCallback } from 'react';

interface EmailThreadInputProps {
  /** Callback when text is submitted for summarisation */
  onTextSubmit: (text: string) => void;
  /** Whether summarisation is currently in progress */
  isLoading?: boolean;
  /** Maximum character limit */
  maxLength?: number;
}

/**
 * Component for manual email thread text input
 * Provides textarea with validation, character count, and submit functionality
 */
export default function EmailThreadInput({ 
  onTextSubmit, 
  isLoading = false,
  maxLength = 50000 
}: EmailThreadInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    // Clear any previous errors
    setError(null);

    // Validate input
    if (!text.trim()) {
      setError('Please enter some text to summarise');
      return;
    }

    if (text.length > maxLength) {
      setError(`Text is too long. Maximum ${maxLength.toLocaleString()} characters allowed`);
      return;
    }

    // Submit the text
    onTextSubmit(text.trim());
  }, [text, onTextSubmit, maxLength]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [error]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Allow Ctrl+Enter to submit
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const remainingChars = maxLength - text.length;
  const isNearLimit = remainingChars < 1000;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Email Thread Input</h2>
        <div className={`text-sm ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'}`}>
          {text.length.toLocaleString()} / {maxLength.toLocaleString()} characters
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="thread-input" className="sr-only">
            Email thread text
          </label>
          <textarea
            id="thread-input"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Paste your email thread here..."
            disabled={isLoading}
            rows={12}
            className={`
              w-full px-4 py-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${isOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              ${isLoading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
            `}
            aria-describedby={error ? 'input-error' : 'input-help'}
          />
        </div>

        {error && (
          <div id="input-error" className="text-red-600 text-sm" role="alert">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div id="input-help" className="text-sm text-gray-500">
            Paste an email thread and click Summarise to get a TL;DR and key points.
            <br />
            <span className="text-gray-400">Tip: Use Ctrl+Enter to submit quickly</span>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading || !text.trim() || isOverLimit}
            className={`
              px-6 py-2 rounded-md font-medium transition-colors
              ${isLoading || !text.trim() || isOverLimit
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Summarising...</span>
              </span>
            ) : (
              'Summarise'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}