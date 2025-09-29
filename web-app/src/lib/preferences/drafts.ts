/**
 * Enhanced draft generation with user preferences integration
 * Extends the base promptDrafts functionality with preference-aware prompt building
 */

import { UserPreferences, CustomInstruction } from '../../types/preferences';
import { 
  generateDrafts as baseGenerateDrafts, 
  DraftTone, 
  DraftResult 
} from '../ai/promptDrafts';
import { buildEnhancedPrompt } from './utils';

/**
 * Generate drafts with user preferences applied
 * Integrates custom instructions, default guidance, and preferred tone
 */
export async function generateDraftsWithPreferences(
  text: string,
  options: {
    tone?: DraftTone;
    guidance?: string;
    preferences: UserPreferences;
    customInstructions: CustomInstruction[];
  }
): Promise<DraftResult> {
  const { tone = 'neutral', guidance = '', preferences, customInstructions } = options;
  
  // Build enhanced prompt with preferences
  const { tone: effectiveTone, guidance: enhancedGuidance } = buildEnhancedPrompt(
    tone,
    guidance,
    preferences,
    customInstructions
  );
  
  // Use the base generation function with enhanced parameters and processing mode
  return baseGenerateDrafts(text, effectiveTone, enhancedGuidance, preferences.processingMode);
}