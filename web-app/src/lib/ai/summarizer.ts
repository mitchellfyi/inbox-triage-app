/**
 * Chrome Summarizer API wrapper for email thread summarisation
 * Provides TL;DR and key points extraction with availability checks and error handling
 */

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
  code: 'UNAVAILABLE' | 'TOKEN_LIMIT' | 'NETWORK_ERROR' | 'UNKNOWN';
  userMessage: string;
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
 * Generate a TL;DR summary for the given text
 * @param text The email thread or text content to summarise
 * @returns Promise resolving to a concise TL;DR summary
 */
export async function getTlDr(text: string): Promise<string> {
  // Input validation
  if (!text || text.trim().length === 0) {
    throw createSummariserError(new Error('Empty input'), 'generate TL;DR');
  }

  // Check availability
  const availability = await checkSummariserAvailability();
  if (availability === SummariserAvailability.UNAVAILABLE) {
    throw createSummariserError(new Error('Unavailable'), 'generate TL;DR');
  }

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
      
      return summary.trim();
    } finally {
      summarizer.destroy();
    }
  } catch (error) {
    console.error('TL;DR generation failed:', error);
    throw createSummariserError(error, 'generate TL;DR');
  }
}

/**
 * Extract key points from the given text
 * @param text The email thread or text content to analyse  
 * @returns Promise resolving to an array of key points (max 5)
 */
export async function getKeyPoints(text: string): Promise<string[]> {
  // Input validation
  if (!text || text.trim().length === 0) {
    throw createSummariserError(new Error('Empty input'), 'extract key points');
  }

  // Check availability
  const availability = await checkSummariserAvailability();
  if (availability === SummariserAvailability.UNAVAILABLE) {
    throw createSummariserError(new Error('Unavailable'), 'extract key points');
  }

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

      return points;
    } finally {
      summarizer.destroy();
    }
  } catch (error) {
    console.error('Key points extraction failed:', error);
    throw createSummariserError(error, 'extract key points');
  }
}