/**
 * Chrome Summarizer API wrapper for email thread summarisation
 * Provides TL;DR and key points extraction with availability checks and hybrid fallback
 */

import { makeHybridDecision, callHybridFallback } from './hybrid';
import { summariseRemote } from './remote';
import type { ProcessingMode, CustomModelKey } from '../../types/preferences';

// Type definitions for Chrome's built-in AI Summarizer API
declare global {
  interface AI {
    summarizer?: {
      capabilities(): Promise<{
        available: 'readily' | 'after-download' | 'no';
      }>;
      create(options?: {
        type?: 'tl;dr' | 'key-points' | 'teaser' | 'headline';
        format?: 'plain-text' | 'markdown';
        length?: 'short' | 'medium' | 'long';
      }): Promise<{
        summarize(input: string, options?: { context?: string }): Promise<string>;
        destroy(): void;
      }>;
    };
  }
  
  interface Window {
    ai?: AI;
  }
}

export enum SummariserAvailability {
  READILY_AVAILABLE = 'readily',
  AFTER_DOWNLOAD = 'after-download', 
  UNAVAILABLE = 'no'
}

export interface SummariserError extends Error {
  code: 'UNAVAILABLE' | 'TOKEN_LIMIT' | 'NETWORK_ERROR' | 'HYBRID_FALLBACK' | 'UNKNOWN';
  userMessage: string;
}

export interface SummariserResult {
  content: string;
  usedHybrid: boolean;
  usedCustomKey?: boolean;
  provider?: string;
  reason?: string;
}

/**
 * Check if Chrome's Summarizer API is available
 */
export async function checkSummariserAvailability(): Promise<SummariserAvailability> {
  try {
    if (!window.ai?.summarizer) {
      return SummariserAvailability.UNAVAILABLE;
    }

    const capabilities = await window.ai.summarizer.capabilities();
    return capabilities.available as SummariserAvailability;
  } catch (error) {
    console.error('Error checking summariser availability:', error);
    return SummariserAvailability.UNAVAILABLE;
  }
}

/**
 * Create a user-friendly error with appropriate messaging
 */
function createSummariserError(originalError: unknown, operation: string): SummariserError {
  const error = new Error(`Failed to ${operation}`) as SummariserError;
  
  if (originalError instanceof Error) {
    if (originalError.message.includes('token') || originalError.message.includes('length')) {
      error.code = 'TOKEN_LIMIT';
      error.userMessage = 'This thread is too long to summarise locally; please shorten it or enable hybrid mode';
    } else if (originalError.message.includes('network') || originalError.message.includes('connection')) {
      error.code = 'NETWORK_ERROR'; 
      error.userMessage = 'Network error occurred. Please check your connection and try again';
    } else if (originalError.message.includes('Cloud processing failed') || originalError.message.includes('hybrid')) {
      error.code = 'HYBRID_FALLBACK';
      error.userMessage = 'Cloud processing failed. Please try again or check your connection';
    } else {
      error.code = 'UNKNOWN';
      error.userMessage = `Unable to ${operation}. Please try again or enable hybrid mode`;
    }
  } else {
    error.code = 'UNAVAILABLE';
    error.userMessage = 'Summariser is currently unavailable on this device';
  }
  
  return error;
}

/**
 * Generate a TL;DR summary for the given text with hybrid fallback support
 * @param text The email thread or text content to summarise
 * @param processingMode User's processing mode preference
 * @param customKey Optional custom model key for external providers
 * @returns Promise resolving to a SummariserResult with TL;DR summary
 */
export async function getTlDr(
  text: string, 
  processingMode: ProcessingMode = 'on-device',
  customKey?: CustomModelKey
): Promise<SummariserResult> {
  // Input validation
  if (!text || text.trim().length === 0) {
    throw createSummariserError(new Error('Empty input'), 'generate TL;DR');
  }

  // Check if we should use custom key
  if (customKey && customKey.enabled) {
    try {
      const result = await summariseRemote(text, customKey);
      return {
        content: result.tldr,
        usedHybrid: false,
        usedCustomKey: true,
        provider: customKey.provider,
        reason: `Used custom ${customKey.provider} key: ${customKey.name}`
      };
    } catch (error) {
      console.error('Custom key summarisation failed:', error);
      // Fall through to regular processing
    }
  }

  // Make hybrid decision
  const decision = await makeHybridDecision({
    processingMode,
    contentText: text,
    operationType: 'summarise'
  });

  if (!decision.useLocal && !decision.canFallback) {
    throw createSummariserError(new Error(decision.reason), 'generate TL;DR');
  }

  if (!decision.useLocal && decision.canFallback) {
    // Use hybrid fallback
    try {
      const result = await callHybridFallback('summarise', text);
      if (result && typeof result === 'object' && 'tldr' in result) {
        return {
          content: (result as { tldr: string }).tldr,
          usedHybrid: true,
          reason: decision.reason
        };
      }
      throw new Error('Invalid response from hybrid service');
    } catch (error) {
      console.error('Hybrid TL;DR generation failed:', error);
      const hybridError = createSummariserError(error, 'generate TL;DR using cloud processing');
      hybridError.code = 'HYBRID_FALLBACK';
      throw hybridError;
    }
  }

  // Use local processing
  try {
    if (!window.ai?.summarizer) {
      throw new Error('Summarizer API not available');
    }

    const summarizer = await window.ai.summarizer.create({
      type: 'tl;dr',
      length: 'short',
      format: 'plain-text'
    });

    try {
      const summary = await summarizer.summarize(text, { 
        context: 'Email thread' 
      });
      
      return {
        content: summary.trim(),
        usedHybrid: false,
        usedCustomKey: false,
        reason: decision.reason
      };
    } finally {
      summarizer.destroy();
    }
  } catch (error) {
    console.error('TL;DR generation failed:', error);
    throw createSummariserError(error, 'generate TL;DR');
  }
}

/**
 * Extract key points from the given text with hybrid fallback support
 * @param text The email thread or text content to analyse  
 * @param processingMode User's processing mode preference
 * @param customKey Optional custom model key for external providers
 * @returns Promise resolving to a SummariserResult with key points array
 */
export async function getKeyPoints(
  text: string, 
  processingMode: ProcessingMode = 'on-device',
  customKey?: CustomModelKey
): Promise<SummariserResult & { keyPoints: string[] }> {
  // Input validation
  if (!text || text.trim().length === 0) {
    throw createSummariserError(new Error('Empty input'), 'extract key points');
  }

  // Check if we should use custom key
  if (customKey && customKey.enabled) {
    try {
      const result = await summariseRemote(text, customKey);
      return {
        content: result.keyPoints.join('\n'),
        keyPoints: result.keyPoints,
        usedHybrid: false,
        usedCustomKey: true,
        provider: customKey.provider,
        reason: `Used custom ${customKey.provider} key: ${customKey.name}`
      };
    } catch (error) {
      console.error('Custom key key points failed:', error);
      // Fall through to regular processing
    }
  }

  // Make hybrid decision
  const decision = await makeHybridDecision({
    processingMode,
    contentText: text,
    operationType: 'summarise'
  });

  if (!decision.useLocal && !decision.canFallback) {
    throw createSummariserError(new Error(decision.reason), 'extract key points');
  }

  if (!decision.useLocal && decision.canFallback) {
    // Use hybrid fallback
    try {
      const result = await callHybridFallback('summarise', text);
      if (result && typeof result === 'object' && 'keyPoints' in result) {
        const keyPoints = (result as { keyPoints: string[] }).keyPoints || [];
        return {
          content: keyPoints.join('\n'),
          keyPoints,
          usedHybrid: true,
          reason: decision.reason
        };
      }
      throw new Error('Invalid response from hybrid service');
    } catch (error) {
      console.error('Hybrid key points extraction failed:', error);
      const hybridError = createSummariserError(error, 'extract key points using cloud processing');
      hybridError.code = 'HYBRID_FALLBACK';
      throw hybridError;
    }
  }

  // Use local processing
  try {
    if (!window.ai?.summarizer) {
      throw new Error('Summarizer API not available');
    }

    const summarizer = await window.ai.summarizer.create({
      type: 'key-points',
      length: 'short',
      format: 'plain-text'
    });

    try {
      const keyPointsText = await summarizer.summarize(text, { 
        context: 'Email thread' 
      });
      
      // Parse the result into an array, limiting to 5 key points
      const points = keyPointsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[•\-\*]\s*/, '')) // Remove bullet points
        .filter(line => line.length > 0)
        .slice(0, 5); // Limit to 5 key points

      return {
        content: points.join('\n'),
        keyPoints: points,
        usedHybrid: false,
        usedCustomKey: false,
        reason: decision.reason
      };
    } finally {
      summarizer.destroy();
    }
  } catch (error) {
    console.error('Key points extraction failed:', error);
    throw createSummariserError(error, 'extract key points');
  }
}