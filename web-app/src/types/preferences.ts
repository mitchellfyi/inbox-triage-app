/**
 * Type definitions for user preferences and instruction memory
 * Supports local storage with optional cloud sync
 */

export type ProcessingMode = 'on-device' | 'hybrid';
export type DraftTone = 'neutral' | 'friendly' | 'assertive' | 'formal';
export type Language = 'en-GB' | 'en-US'; // British English default

export interface CustomInstruction {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimised: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface UserPreferences {
  // Core AI processing preferences
  processingMode: ProcessingMode;
  defaultTone: DraftTone;
  defaultLanguage: Language;
  
  // Default content
  defaultGuidance: string;
  signature: string;
  
  // Accessibility
  accessibility: AccessibilityPreferences;
  
  // Privacy and storage
  cloudSyncEnabled: boolean;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export interface InstructionMemory {
  instructions: CustomInstruction[];
  maxInstructions: number; // Default: 50
  updatedAt: number;
}

export interface PreferencesData {
  preferences: UserPreferences;
  instructionMemory: InstructionMemory;
  version: string; // For future migration support
}

export interface PreferencesContextState {
  data: PreferencesData;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

export interface PreferencesContextActions {
  // Preferences management
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  
  // Instruction memory management
  addInstruction: (instruction: Omit<CustomInstruction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInstruction: (id: string, updates: Partial<CustomInstruction>) => void;
  deleteInstruction: (id: string) => void;
  toggleInstruction: (id: string, enabled: boolean) => void;
  
  // Data management
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  
  // Persistence
  saveToDisk: () => Promise<void>;
  loadFromDisk: () => Promise<void>;
}

export type PreferencesContext = PreferencesContextState & PreferencesContextActions;

// Default values
export const DEFAULT_PREFERENCES: UserPreferences = {
  processingMode: 'on-device',
  defaultTone: 'neutral',
  defaultLanguage: 'en-GB',
  defaultGuidance: '',
  signature: '',
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimised: false,
    fontSize: 'medium'
  },
  cloudSyncEnabled: false,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const DEFAULT_INSTRUCTION_MEMORY: InstructionMemory = {
  instructions: [],
  maxInstructions: 50,
  updatedAt: Date.now()
};

export const DEFAULT_PREFERENCES_DATA: PreferencesData = {
  preferences: DEFAULT_PREFERENCES,
  instructionMemory: DEFAULT_INSTRUCTION_MEMORY,
  version: '1.0.0'
};

// Storage keys
export const STORAGE_KEYS = {
  PREFERENCES: 'inbox-triage-preferences',
  INSTRUCTION_MEMORY: 'inbox-triage-instruction-memory'
} as const;

// Error types
export interface PreferencesError extends Error {
  code: 'STORAGE_ERROR' | 'VALIDATION_ERROR' | 'IMPORT_ERROR' | 'SYNC_ERROR';
  userMessage: string;
}