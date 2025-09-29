/**
 * React Context for user preferences and instruction memory management
 * Provides state management with persistence and synchronisation
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  PreferencesData, 
  PreferencesContextState, 
  PreferencesContextActions, 
  PreferencesContext as PreferencesContextType,
  CustomInstruction,
  UserPreferences,
  DEFAULT_PREFERENCES_DATA
} from '../../types/preferences';
import { 
  savePreferencesToStorage, 
  loadPreferencesFromStorage, 
  clearPreferencesFromStorage,
  exportPreferencesData,
  importPreferencesData 
} from './storage';

// Action types for the reducer
type PreferencesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: PreferencesData }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_PREFERENCES' }
  | { type: 'ADD_INSTRUCTION'; payload: CustomInstruction }
  | { type: 'UPDATE_INSTRUCTION'; payload: { id: string; updates: Partial<CustomInstruction> } }
  | { type: 'DELETE_INSTRUCTION'; payload: string }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean };

// Initial state
const initialState: PreferencesContextState = {
  data: DEFAULT_PREFERENCES_DATA,
  isLoading: false,
  error: null,
  hasUnsavedChanges: false
};

/**
 * Generate a unique ID for custom instructions
 */
function generateInstructionId(): string {
  return `instr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Preferences reducer to handle state updates
 */
function preferencesReducer(state: PreferencesContextState, action: PreferencesAction): PreferencesContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        isLoading: false,
        error: null,
        hasUnsavedChanges: false
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        data: {
          ...state.data,
          preferences: {
            ...state.data.preferences,
            ...action.payload,
            updatedAt: Date.now()
          }
        },
        hasUnsavedChanges: true,
        error: null
      };

    case 'RESET_PREFERENCES':
      return {
        ...state,
        data: {
          ...DEFAULT_PREFERENCES_DATA,
          instructionMemory: state.data.instructionMemory // Keep instructions
        },
        hasUnsavedChanges: true,
        error: null
      };

    case 'ADD_INSTRUCTION':
      return {
        ...state,
        data: {
          ...state.data,
          instructionMemory: {
            ...state.data.instructionMemory,
            instructions: [
              ...state.data.instructionMemory.instructions,
              action.payload
            ],
            updatedAt: Date.now()
          }
        },
        hasUnsavedChanges: true,
        error: null
      };

    case 'UPDATE_INSTRUCTION':
      return {
        ...state,
        data: {
          ...state.data,
          instructionMemory: {
            ...state.data.instructionMemory,
            instructions: state.data.instructionMemory.instructions.map(instr =>
              instr.id === action.payload.id 
                ? { ...instr, ...action.payload.updates, updatedAt: Date.now() }
                : instr
            ),
            updatedAt: Date.now()
          }
        },
        hasUnsavedChanges: true,
        error: null
      };

    case 'DELETE_INSTRUCTION':
      return {
        ...state,
        data: {
          ...state.data,
          instructionMemory: {
            ...state.data.instructionMemory,
            instructions: state.data.instructionMemory.instructions.filter(
              instr => instr.id !== action.payload
            ),
            updatedAt: Date.now()
          }
        },
        hasUnsavedChanges: true,
        error: null
      };

    case 'SET_UNSAVED_CHANGES':
      return {
        ...state,
        hasUnsavedChanges: action.payload
      };

    default:
      return state;
  }
}

// Create the context
const PreferencesContext = createContext<PreferencesContextType | null>(null);

/**
 * PreferencesProvider component that wraps the app with preference management
 */
interface PreferencesProviderProps {
  children: React.ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [state, dispatch] = useReducer(preferencesReducer, initialState);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const data = await loadPreferencesFromStorage();
        dispatch({ type: 'SET_DATA', payload: data });
      } catch (error) {
        console.error('Failed to load preferences:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to load preferences' 
        });
      }
    };

    loadPreferences();
  }, []);

  // Auto-save when there are unsaved changes (debounced)
  useEffect(() => {
    if (!state.hasUnsavedChanges) return;

    const saveTimer = setTimeout(async () => {
      try {
        await savePreferencesToStorage(state.data);
        dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
        console.debug('Preferences auto-saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to save preferences' 
        });
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(saveTimer);
  }, [state.hasUnsavedChanges, state.data]);

  // Context actions
  const actions: PreferencesContextActions = {
    updatePreferences: (updates: Partial<UserPreferences>) => {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: updates });
    },

    resetPreferences: () => {
      dispatch({ type: 'RESET_PREFERENCES' });
    },

    addInstruction: (instruction: Omit<CustomInstruction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newInstruction: CustomInstruction = {
        ...instruction,
        id: generateInstructionId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      dispatch({ type: 'ADD_INSTRUCTION', payload: newInstruction });
    },

    updateInstruction: (id: string, updates: Partial<CustomInstruction>) => {
      dispatch({ type: 'UPDATE_INSTRUCTION', payload: { id, updates } });
    },

    deleteInstruction: (id: string) => {
      dispatch({ type: 'DELETE_INSTRUCTION', payload: id });
    },

    toggleInstruction: (id: string, enabled: boolean) => {
      dispatch({ type: 'UPDATE_INSTRUCTION', payload: { id, updates: { enabled } } });
    },

    exportData: async (): Promise<string> => {
      try {
        return await exportPreferencesData(state.data);
      } catch (error) {
        console.error('Export failed:', error);
        throw error;
      }
    },

    importData: async (jsonData: string): Promise<void> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const importedData = await importPreferencesData(jsonData);
        dispatch({ type: 'SET_DATA', payload: importedData });
      } catch (error) {
        console.error('Import failed:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to import preferences' 
        });
        throw error;
      }
    },

    clearAllData: async (): Promise<void> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        await clearPreferencesFromStorage();
        dispatch({ type: 'SET_DATA', payload: DEFAULT_PREFERENCES_DATA });
      } catch (error) {
        console.error('Clear data failed:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to clear preferences' 
        });
        throw error;
      }
    },

    saveToDisk: async (): Promise<void> => {
      try {
        await savePreferencesToStorage(state.data);
        dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
      } catch (error) {
        console.error('Save failed:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to save preferences' 
        });
        throw error;
      }
    },

    loadFromDisk: async (): Promise<void> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const data = await loadPreferencesFromStorage();
        dispatch({ type: 'SET_DATA', payload: data });
      } catch (error) {
        console.error('Load failed:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to load preferences' 
        });
        throw error;
      }
    }
  };

  const contextValue: PreferencesContextType = {
    ...state,
    ...actions
  };

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * Hook to use preferences context
 */
export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  
  return context;
}

/**
 * Hook to get enabled custom instructions for prompt building
 */
export function useEnabledInstructions(): CustomInstruction[] {
  const { data } = usePreferences();
  return data.instructionMemory.instructions.filter(instr => instr.enabled);
}