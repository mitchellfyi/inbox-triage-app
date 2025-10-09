/**
 * Chrome Translator API wrapper for multilingual support
 * Provides on-device translation capabilities matching the extension functionality
 */

// Type definitions for Chrome's built-in Translator API
declare global {
  interface Translator {
    availability(): Promise<'readily' | 'after-download' | 'no'>;
    create(options?: {
      sourceLanguage?: string;
      targetLanguage: string;
      signal?: AbortSignal;
    }): Promise<{
      translate(input: string): Promise<string>;
      destroy(): void;
    }>;
  }

  var Translator: Translator;
}

export enum TranslatorAvailability {
  READILY_AVAILABLE = 'readily',
  AFTER_DOWNLOAD = 'after-download', 
  UNAVAILABLE = 'no'
}

export interface TranslatorError extends Error {
  code: 'UNAVAILABLE' | 'LANGUAGE_NOT_SUPPORTED' | 'TRANSLATION_FAILED' | 'UNKNOWN';
  userMessage: string;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  usedHybrid: boolean;
  reason?: string;
}

// Supported languages matching the extension
export const SUPPORTED_LANGUAGES = [
  { code: 'none', name: 'No Translation (Original)', nativeName: 'Original' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
];

/**
 * Check if Chrome's Translator API is available
 */
export async function checkTranslatorAvailability(): Promise<TranslatorAvailability> {
  try {
    if (!('Translator' in self)) {
      return TranslatorAvailability.UNAVAILABLE;
    }

    const availability = await Translator.availability();
    return availability as TranslatorAvailability;
  } catch (error) {
    console.error('Error checking translator availability:', error);
    return TranslatorAvailability.UNAVAILABLE;
  }
}

/**
 * Create a user-friendly error with appropriate messaging
 */
function createTranslatorError(originalError: unknown, operation: string): TranslatorError {
  const error = new Error(`Failed to ${operation}`) as TranslatorError;
  
  if (originalError instanceof Error) {
    if (originalError.message.includes('language') || originalError.message.includes('unsupported')) {
      error.code = 'LANGUAGE_NOT_SUPPORTED';
      error.userMessage = 'The selected language is not supported for translation';
    } else if (originalError.message.includes('translation') || originalError.message.includes('failed')) {
      error.code = 'TRANSLATION_FAILED';
      error.userMessage = 'Translation failed. Please try again or select a different language';
    } else {
      error.code = 'UNKNOWN';
      error.userMessage = `Unable to ${operation}. Please try again`;
    }
  } else {
    error.code = 'UNAVAILABLE';
    error.userMessage = 'Translator is currently unavailable on this device';
  }
  
  return error;
}

/**
 * Translate text using Chrome's built-in Translator API
 * @param text The text to translate
 * @param targetLanguage The target language code (e.g., 'es', 'fr', 'de')
 * @param sourceLanguage Optional source language code for better accuracy
 * @returns Promise resolving to a TranslationResult
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> {
  // Input validation
  if (!text || text.trim().length === 0) {
    throw createTranslatorError(new Error('Empty input'), 'translate text');
  }

  if (targetLanguage === 'none') {
    return {
      translatedText: text,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage: 'none',
      usedHybrid: false,
      reason: 'No translation requested'
    };
  }

  // Check if language is supported
  const supportedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
  if (!supportedLanguage) {
    throw createTranslatorError(new Error(`Unsupported language: ${targetLanguage}`), 'translate text');
  }

  try {
    if (!('Translator' in self)) {
      throw new Error('Translator API not available');
    }

    const translator = await Translator.create({
      sourceLanguage,
      targetLanguage
    });

    try {
      const translatedText = await translator.translate(text);
      
      return {
        translatedText: translatedText.trim(),
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
        usedHybrid: false,
        reason: `Translated using Chrome's built-in Translator API`
      };
    } finally {
      translator.destroy();
    }
  } catch (error) {
    console.error('Translation failed:', error);
    throw createTranslatorError(error, 'translate text');
  }
}

/**
 * Translate multiple texts in batch
 * @param texts Array of texts to translate
 * @param targetLanguage The target language code
 * @param sourceLanguage Optional source language code
 * @returns Promise resolving to an array of TranslationResults
 */
export async function translateTexts(
  texts: string[],
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult[]> {
  if (targetLanguage === 'none') {
    return texts.map(text => ({
      translatedText: text,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage: 'none',
      usedHybrid: false,
      reason: 'No translation requested'
    }));
  }

  try {
    if (!('Translator' in self)) {
      throw new Error('Translator API not available');
    }

    const translator = await Translator.create({
      sourceLanguage,
      targetLanguage
    });

    try {
      const results = await Promise.all(
        texts.map(async (text) => {
          if (!text || text.trim().length === 0) {
            return {
              translatedText: text,
              sourceLanguage: sourceLanguage || 'auto',
              targetLanguage,
              usedHybrid: false,
              reason: 'Empty text, no translation needed'
            };
          }

          const translatedText = await translator.translate(text);
          return {
            translatedText: translatedText.trim(),
            sourceLanguage: sourceLanguage || 'auto',
            targetLanguage,
            usedHybrid: false,
            reason: `Translated using Chrome's built-in Translator API`
          };
        })
      );

      return results;
    } finally {
      translator.destroy();
    }
  } catch (error) {
    console.error('Batch translation failed:', error);
    throw createTranslatorError(error, 'translate texts');
  }
}

/**
 * Get language name by code
 * @param code Language code (e.g., 'es', 'fr')
 * @returns Language name or code if not found
 */
export function getLanguageName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language ? language.name : code;
}

/**
 * Get native language name by code
 * @param code Language code (e.g., 'es', 'fr')
 * @returns Native language name or code if not found
 */
export function getNativeLanguageName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language ? language.nativeName : code;
}
