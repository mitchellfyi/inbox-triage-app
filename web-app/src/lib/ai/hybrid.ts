/**
 * Hybrid AI processing decision logic
 * Determines when to use local vs cloud processing based on model availability,
 * content size, and user preferences
 */

import { SummariserAvailability, checkSummariserAvailability } from './summarizer';
import { PromptAvailability, checkPromptAvailability } from './promptDrafts';
import { MultimodalAvailability, checkMultimodalAvailability } from './multimodal';
import type { ProcessingMode } from '../../types/preferences';

export interface HybridDecisionContext {
  processingMode: ProcessingMode;
  contentText: string;
  operationType: 'summarise' | 'draft' | 'multimodal';
}

export interface HybridDecision {
  useLocal: boolean;
  reason: string;
  canFallback: boolean;
}

// Token limits for local models (conservative estimates)
const TOKEN_LIMITS = {
  SUMMARIZER: 4000,  // Characters, roughly 1000 tokens
  PROMPT: 8000,      // Characters, roughly 2000 tokens  
  MULTIMODAL: 6000   // Characters, roughly 1500 tokens
} as const;

/**
 * Estimate token count from character count (rough approximation: 4 chars = 1 token)
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if content exceeds token limits for the given operation
 */
function exceedsTokenLimit(text: string, operationType: HybridDecisionContext['operationType']): boolean {
  const operationMap = {
    'summarise': 'SUMMARIZER',
    'draft': 'PROMPT',
    'multimodal': 'MULTIMODAL'
  } as const;
  
  const limitKey = operationMap[operationType];
  const limit = TOKEN_LIMITS[limitKey];
  return text.length > limit;
}

/**
 * Check availability of local AI models for the given operation
 */
async function checkLocalAvailability(operationType: HybridDecisionContext['operationType']): Promise<boolean> {
  try {
    switch (operationType) {
      case 'summarise':
        const summarizerAvailability = await checkSummariserAvailability();
        return summarizerAvailability === SummariserAvailability.READILY_AVAILABLE;
        
      case 'draft':
        const promptAvailability = await checkPromptAvailability();
        return promptAvailability === PromptAvailability.READILY_AVAILABLE;
        
      case 'multimodal':
        const multimodalAvailability = await checkMultimodalAvailability();
        return multimodalAvailability === MultimodalAvailability.READILY_AVAILABLE;
        
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking ${operationType} availability:`, error);
    return false;
  }
}

/**
 * Make a decision on whether to use local or hybrid processing
 */
export async function makeHybridDecision(context: HybridDecisionContext): Promise<HybridDecision> {
  const { processingMode, contentText, operationType } = context;
  
  // If user selected on-device only mode, never use hybrid
  if (processingMode === 'on-device') {
    const localAvailable = await checkLocalAvailability(operationType);
    const withinLimits = !exceedsTokenLimit(contentText, operationType);
    
    if (!localAvailable) {
      return {
        useLocal: false,
        reason: `Local ${operationType} model is not available on this device`,
        canFallback: false
      };
    }
    
    if (!withinLimits) {
      return {
        useLocal: false,
        reason: `Content is too large for local ${operationType} processing (${estimateTokenCount(contentText)} estimated tokens)`,
        canFallback: false
      };
    }
    
    return {
      useLocal: true,
      reason: 'Using local processing as requested',
      canFallback: false
    };
  }
  
  // In hybrid mode, check local availability and limits first
  const localAvailable = await checkLocalAvailability(operationType);
  const withinLimits = !exceedsTokenLimit(contentText, operationType);
  
  if (localAvailable && withinLimits) {
    return {
      useLocal: true,
      reason: 'Local processing available and within limits',
      canFallback: true
    };
  }
  
  // Fall back to cloud processing
  let reason = 'Using secure cloud processing: ';
  if (!localAvailable && !withinLimits) {
    reason += `local model unavailable and content exceeds limits (${estimateTokenCount(contentText)} estimated tokens)`;
  } else if (!localAvailable) {
    reason += 'local model is not available on this device';
  } else {
    reason += `content exceeds local processing limits (${estimateTokenCount(contentText)} estimated tokens)`;
  }
  
  return {
    useLocal: false,
    reason,
    canFallback: true
  };
}

/**
 * Call the hybrid fallback API endpoint
 */
export async function callHybridFallback(
  operationType: 'summarise' | 'draft',
  text: string,
  options?: Record<string, unknown>
): Promise<unknown> {
  try {
    const response = await fetch('/api/fallback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: operationType,
        text,
        options: options || {}
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Hybrid fallback API call failed:', error);
    throw new Error(
      error instanceof Error 
        ? `Cloud processing failed: ${error.message}`
        : 'Cloud processing failed due to unknown error'
    );
  }
}