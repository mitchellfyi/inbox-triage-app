/**
 * Local storage utilities for user preferences and instruction memory
 * Privacy-first storage with optional cloud sync
 */

import { 
  PreferencesData, 
  PreferencesError,
  DEFAULT_PREFERENCES_DATA,
  STORAGE_KEYS 
} from '../../types/preferences';

/**
 * Check if localStorage is available and functional
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a preferences error with user-friendly messaging
 */
function createPreferencesError(
  originalError: unknown, 
  operation: string,
  code: PreferencesError['code'] = 'STORAGE_ERROR'
): PreferencesError {
  const error = new Error(`Preferences ${operation} failed`) as PreferencesError;
  error.code = code;
  error.cause = originalError;
  
  switch (code) {
    case 'STORAGE_ERROR':
      error.userMessage = 'Unable to access local storage. Please check your browser settings.';
      break;
    case 'VALIDATION_ERROR':
      error.userMessage = 'Invalid preferences data format.';
      break;
    case 'IMPORT_ERROR':
      error.userMessage = 'Unable to import preferences. Please check the file format.';
      break;
    case 'SYNC_ERROR':
      error.userMessage = 'Cloud synchronisation temporarily unavailable.';
      break;
    default:
      error.userMessage = `Preferences ${operation} encountered an error.`;
  }
  
  return error;
}

/**
 * Validate preferences data structure
 */
function validatePreferencesData(data: unknown): data is PreferencesData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  
  // Check required top-level properties
  if (!d.preferences || !d.instructionMemory || !d.version) return false;
  
  // Basic validation of preferences structure
  const prefs = d.preferences;
  if (!prefs.processingMode || !prefs.defaultTone || !prefs.defaultLanguage) return false;
  if (!prefs.accessibility || typeof prefs.createdAt !== 'number') return false;
  
  // Basic validation of instruction memory
  const memory = d.instructionMemory;
  if (!Array.isArray(memory.instructions) || typeof memory.maxInstructions !== 'number') return false;
  
  return true;
}

/**
 * Save preferences data to localStorage
 */
export async function savePreferencesToStorage(data: PreferencesData): Promise<void> {
  if (!isLocalStorageAvailable()) {
    throw createPreferencesError(
      new Error('localStorage not available'), 
      'save',
      'STORAGE_ERROR'
    );
  }
  
  try {
    // Update timestamps
    const dataWithTimestamp = {
      ...data,
      preferences: {
        ...data.preferences,
        updatedAt: Date.now()
      },
      instructionMemory: {
        ...data.instructionMemory,
        updatedAt: Date.now()
      }
    };
    
    const serialised = JSON.stringify(dataWithTimestamp);
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, serialised);
    
    console.debug('Preferences saved to localStorage');
  } catch (error) {
    console.error('Failed to save preferences:', error);
    throw createPreferencesError(error, 'save');
  }
}

/**
 * Load preferences data from localStorage
 */
export async function loadPreferencesFromStorage(): Promise<PreferencesData> {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, using defaults');
    return DEFAULT_PREFERENCES_DATA;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    
    if (!stored) {
      console.debug('No stored preferences found, using defaults');
      return DEFAULT_PREFERENCES_DATA;
    }
    
    const parsed = JSON.parse(stored);
    
    if (!validatePreferencesData(parsed)) {
      console.warn('Invalid stored preferences format, using defaults');
      return DEFAULT_PREFERENCES_DATA;
    }
    
    console.debug('Preferences loaded from localStorage');
    return parsed;
  } catch (error) {
    console.error('Failed to load preferences:', error);
    console.warn('Using default preferences due to load error');
    return DEFAULT_PREFERENCES_DATA;
  }
}

/**
 * Clear all preferences data from localStorage
 */
export async function clearPreferencesFromStorage(): Promise<void> {
  if (!isLocalStorageAvailable()) {
    throw createPreferencesError(
      new Error('localStorage not available'), 
      'save',
      'STORAGE_ERROR'
    );
  }
  
  try {
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    console.debug('Preferences cleared from localStorage');
  } catch (error) {
    console.error('Failed to clear preferences:', error);
    throw createPreferencesError(error, 'clear');
  }
}

/**
 * Export preferences data as JSON string
 */
export async function exportPreferencesData(data: PreferencesData): Promise<string> {
  try {
    const exportData = {
      ...data,
      exportedAt: Date.now(),
      exportVersion: '1.0.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Failed to export preferences:', error);
    throw createPreferencesError(error, 'export');
  }
}

/**
 * Import preferences data from JSON string
 */
export async function importPreferencesData(jsonData: string): Promise<PreferencesData> {
  try {
    const parsed = JSON.parse(jsonData);
    
    // Handle export format (with exportedAt, exportVersion)
    const dataToValidate = parsed.exportedAt ? {
      preferences: parsed.preferences,
      instructionMemory: parsed.instructionMemory,
      version: parsed.version
    } : parsed;
    
    if (!validatePreferencesData(dataToValidate)) {
      throw createPreferencesError(
        new Error('Invalid data format'),
        'import',
        'VALIDATION_ERROR'
      );
    }
    
    console.debug('Preferences imported successfully');
    return dataToValidate;
  } catch (error) {
    console.error('Failed to import preferences:', error);
    
    if (error instanceof SyntaxError) {
      throw createPreferencesError(error, 'import', 'IMPORT_ERROR');
    }
    
    throw createPreferencesError(error, 'import');
  }
}

/**
 * Check if there are any stored preferences
 */
export function hasStoredPreferences(): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    return localStorage.getItem(STORAGE_KEYS.PREFERENCES) !== null;
  } catch {
    return false;
  }
}