'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  checkTranslatorAvailability, 
  TranslatorAvailability, 
  SUPPORTED_LANGUAGES,
  type TranslatorError 
} from '../lib/ai/translator';

interface TranslationSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function TranslationSelector({ 
  selectedLanguage, 
  onLanguageChange, 
  disabled = false,
  className = ''
}: TranslationSelectorProps) {
  const [availability, setAvailability] = useState<TranslatorAvailability>();
  const [isChecking, setIsChecking] = useState(true);

  // Check translator availability on mount
  useEffect(() => {
    async function checkAvailability() {
      try {
        const status = await checkTranslatorAvailability();
        setAvailability(status);
      } catch (error) {
        console.error('Failed to check translator availability:', error);
        setAvailability(TranslatorAvailability.UNAVAILABLE);
      } finally {
        setIsChecking(false);
      }
    }

    checkAvailability();
  }, []);

  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onLanguageChange(e.target.value);
  }, [onLanguageChange]);

  if (isChecking) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Translation Language
        </label>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Checking translator availability...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Translation Language
      </label>
      <select
        value={selectedLanguage}
        onChange={handleLanguageChange}
        disabled={disabled || availability === TranslatorAvailability.UNAVAILABLE}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name} {language.nativeName !== language.name ? `(${language.nativeName})` : ''}
          </option>
        ))}
      </select>
      
      {availability === TranslatorAvailability.UNAVAILABLE && (
        <p className="text-xs text-yellow-600 mt-1">
          Translation requires Chrome 138+ with Translator API enabled
        </p>
      )}
      
      {availability === TranslatorAvailability.AFTER_DOWNLOAD && (
        <p className="text-xs text-blue-600 mt-1">
          Translator model will download on first use
        </p>
      )}
      
      {availability === TranslatorAvailability.READILY_AVAILABLE && (
        <p className="text-xs text-green-600 mt-1">
          Translation ready - all processing happens on-device
        </p>
      )}
    </div>
  );
}
