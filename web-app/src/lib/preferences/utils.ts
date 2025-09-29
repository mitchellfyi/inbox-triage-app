/**
 * Utilities for integrating user preferences with AI draft generation
 * Handles prompt building with custom instructions and default preferences
 */

import { UserPreferences, CustomInstruction } from '../../types/preferences';
import { DraftTone } from '../ai/promptDrafts';

/**
 * Build enhanced system prompt with user preferences and custom instructions
 */
export function buildEnhancedPrompt(
  baseTone: DraftTone,
  guidance: string,
  preferences: UserPreferences,
  customInstructions: CustomInstruction[]
): { tone: DraftTone; guidance: string } {
  // Use user's preferred tone if none explicitly provided
  const effectiveTone = baseTone !== 'neutral' ? baseTone : preferences.defaultTone;
  
  // Start with base guidance
  let enhancedGuidance = guidance.trim();
  
  // Add default guidance if no specific guidance provided
  if (!enhancedGuidance && preferences.defaultGuidance) {
    enhancedGuidance = preferences.defaultGuidance;
  }
  
  // Add custom instructions
  const enabledInstructions = customInstructions.filter(instr => instr.enabled);
  if (enabledInstructions.length > 0) {
    const instructionTexts = enabledInstructions
      .map(instr => `- ${instr.content}`)
      .join('\n');
    
    const instructionsSection = `\nCustom instructions:\n${instructionTexts}`;
    enhancedGuidance = enhancedGuidance 
      ? `${enhancedGuidance}${instructionsSection}`
      : instructionsSection.trim();
  }
  
  // Add signature if configured
  if (preferences.signature.trim()) {
    const signatureSection = `\nDefault signature: ${preferences.signature}`;
    enhancedGuidance = enhancedGuidance 
      ? `${enhancedGuidance}${signatureSection}`
      : signatureSection.trim();
  }
  
  return {
    tone: effectiveTone,
    guidance: enhancedGuidance
  };
}

/**
 * Get user's processing mode preference
 */
export function getProcessingMode(preferences: UserPreferences): 'on-device' | 'hybrid' {
  return preferences.processingMode;
}

/**
 * Get user's language preference for localisation
 */
export function getLanguagePreference(preferences: UserPreferences): string {
  return preferences.defaultLanguage;
}

/**
 * Check if cloud sync is enabled for the user
 */
export function isCloudSyncEnabled(preferences: UserPreferences): boolean {
  return preferences.cloudSyncEnabled;
}

/**
 * Get accessibility preferences for UI adaptation
 */
export function getAccessibilityPreferences(preferences: UserPreferences) {
  return preferences.accessibility;
}

/**
 * Format custom instructions for display
 */
export function formatInstructionsForDisplay(instructions: CustomInstruction[]): string {
  const enabled = instructions.filter(instr => instr.enabled);
  
  if (enabled.length === 0) {
    return 'No custom instructions enabled';
  }
  
  if (enabled.length === 1) {
    return `1 custom instruction: "${enabled[0].name}"`;
  }
  
  return `${enabled.length} custom instructions enabled`;
}

/**
 * Validate that custom instruction content is appropriate
 */
export function validateInstructionContent(content: string): { isValid: boolean; error?: string } {
  const trimmed = content.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Instruction content cannot be empty' };
  }
  
  if (trimmed.length > 500) {
    return { isValid: false, error: 'Instruction content must be 500 characters or less' };
  }
  
  // Check for potentially problematic content
  const problematicPatterns = [
    /ignore previous instructions/i,
    /disregard.*(above|previous|earlier)/i,
    /system prompt/i,
    /override.*settings/i
  ];
  
  for (const pattern of problematicPatterns) {
    if (pattern.test(trimmed)) {
      return { 
        isValid: false, 
        error: 'Instruction content contains potentially problematic language' 
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Get summary of active preferences for display
 */
export function getPreferencesSummary(
  preferences: UserPreferences,
  instructions: CustomInstruction[]
): string {
  const parts = [];
  
  // Processing mode
  parts.push(`Mode: ${preferences.processingMode === 'on-device' ? 'On-device' : 'Hybrid'}`);
  
  // Default tone
  parts.push(`Tone: ${preferences.defaultTone}`);
  
  // Instructions count
  const enabledCount = instructions.filter(instr => instr.enabled).length;
  if (enabledCount > 0) {
    parts.push(`${enabledCount} custom instruction${enabledCount === 1 ? '' : 's'}`);
  }
  
  // Default guidance
  if (preferences.defaultGuidance.trim()) {
    parts.push('Default guidance set');
  }
  
  // Signature
  if (preferences.signature.trim()) {
    parts.push('Signature configured');
  }
  
  return parts.join(' • ');
}