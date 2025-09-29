/**
 * Tests for user preferences storage functionality
 */

import {
  savePreferencesToStorage,
  loadPreferencesFromStorage,
  clearPreferencesFromStorage,
  exportPreferencesData,
  importPreferencesData,
  hasStoredPreferences
} from '../storage';

import { DEFAULT_PREFERENCES_DATA, STORAGE_KEYS } from '../../../types/preferences';

// Mock localStorage
const mockStorage: Record<string, string> = {};

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    }
  },
  writable: true
});

describe('preferences storage', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    jest.clearAllMocks();
  });

  describe('savePreferencesToStorage', () => {
    it('should save preferences data to localStorage', async () => {
      const testData = {
        ...DEFAULT_PREFERENCES_DATA,
        preferences: {
          ...DEFAULT_PREFERENCES_DATA.preferences,
          defaultTone: 'friendly' as const
        }
      };

      await savePreferencesToStorage(testData);

      expect(mockStorage[STORAGE_KEYS.PREFERENCES]).toBeDefined();
      const stored = JSON.parse(mockStorage[STORAGE_KEYS.PREFERENCES]);
      expect(stored.preferences.defaultTone).toBe('friendly');
      expect(stored.preferences.updatedAt).toBeDefined();
    });

    it('should update timestamps when saving', async () => {
      const originalTime = Date.now() - 1000;
      const testData = {
        ...DEFAULT_PREFERENCES_DATA,
        preferences: {
          ...DEFAULT_PREFERENCES_DATA.preferences,
          updatedAt: originalTime
        }
      };

      await savePreferencesToStorage(testData);

      const stored = JSON.parse(mockStorage[STORAGE_KEYS.PREFERENCES]);
      expect(stored.preferences.updatedAt).toBeGreaterThan(originalTime);
    });
  });

  describe('loadPreferencesFromStorage', () => {
    it('should load preferences from localStorage', async () => {
      const testData = {
        ...DEFAULT_PREFERENCES_DATA,
        preferences: {
          ...DEFAULT_PREFERENCES_DATA.preferences,
          defaultTone: 'formal' as const
        }
      };

      mockStorage[STORAGE_KEYS.PREFERENCES] = JSON.stringify(testData);

      const loaded = await loadPreferencesFromStorage();
      expect(loaded.preferences.defaultTone).toBe('formal');
    });

    it('should return defaults when no stored data', async () => {
      const loaded = await loadPreferencesFromStorage();
      expect(loaded).toEqual(DEFAULT_PREFERENCES_DATA);
    });

    it('should return defaults when stored data is invalid', async () => {
      mockStorage[STORAGE_KEYS.PREFERENCES] = 'invalid json';

      const loaded = await loadPreferencesFromStorage();
      expect(loaded).toEqual(DEFAULT_PREFERENCES_DATA);
    });

    it('should return defaults when data structure is invalid', async () => {
      const invalidData = { invalid: 'data' };
      mockStorage[STORAGE_KEYS.PREFERENCES] = JSON.stringify(invalidData);

      const loaded = await loadPreferencesFromStorage();
      expect(loaded).toEqual(DEFAULT_PREFERENCES_DATA);
    });
  });

  describe('clearPreferencesFromStorage', () => {
    it('should remove preferences from localStorage', async () => {
      mockStorage[STORAGE_KEYS.PREFERENCES] = JSON.stringify(DEFAULT_PREFERENCES_DATA);

      await clearPreferencesFromStorage();

      expect(mockStorage[STORAGE_KEYS.PREFERENCES]).toBeUndefined();
    });
  });

  describe('exportPreferencesData', () => {
    it('should export preferences as JSON string', async () => {
      const testData = {
        ...DEFAULT_PREFERENCES_DATA,
        preferences: {
          ...DEFAULT_PREFERENCES_DATA.preferences,
          defaultTone: 'assertive' as const
        }
      };

      const exported = await exportPreferencesData(testData);
      const parsed = JSON.parse(exported);

      expect(parsed.preferences.defaultTone).toBe('assertive');
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.exportVersion).toBe('1.0.0');
    });
  });

  describe('importPreferencesData', () => {
    it('should import valid preferences JSON', async () => {
      const exportData = {
        preferences: {
          ...DEFAULT_PREFERENCES_DATA.preferences,
          defaultTone: 'friendly' as const
        },
        instructionMemory: DEFAULT_PREFERENCES_DATA.instructionMemory,
        version: '1.0.0',
        exportedAt: Date.now(),
        exportVersion: '1.0.0'
      };

      const imported = await importPreferencesData(JSON.stringify(exportData));
      expect(imported.preferences.defaultTone).toBe('friendly');
    });

    it('should handle direct preferences format', async () => {
      const directData = {
        preferences: {
          ...DEFAULT_PREFERENCES_DATA.preferences,
          defaultTone: 'formal' as const
        },
        instructionMemory: DEFAULT_PREFERENCES_DATA.instructionMemory,
        version: '1.0.0'
      };

      const imported = await importPreferencesData(JSON.stringify(directData));
      expect(imported.preferences.defaultTone).toBe('formal');
    });

    it('should throw error for invalid JSON', async () => {
      await expect(importPreferencesData('invalid json')).rejects.toThrow();
    });

    it('should throw error for invalid data structure', async () => {
      const invalidData = { invalid: 'structure' };
      await expect(importPreferencesData(JSON.stringify(invalidData))).rejects.toThrow();
    });
  });

  describe('hasStoredPreferences', () => {
    it('should return true when preferences exist', () => {
      mockStorage[STORAGE_KEYS.PREFERENCES] = JSON.stringify(DEFAULT_PREFERENCES_DATA);
      expect(hasStoredPreferences()).toBe(true);
    });

    it('should return false when no preferences exist', () => {
      expect(hasStoredPreferences()).toBe(false);
    });
  });
});