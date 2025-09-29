/**
 * Chrome Prompt API wrapper for multimodal image Q&A functionality
 * Enables users to ask questions about uploaded images using built-in AI
 */

// Type definitions for Chrome's built-in AI Language Model API
// Note: Multimodal capabilities are experimental and not currently available in stable Chrome
declare global {
  interface AI {
    languageModel?: {
      capabilities(): Promise<{
        available: 'readily' | 'after-download' | 'no';
      }>;
      create(options?: {
        systemPrompt?: string;
        temperature?: number;
        topK?: number;
      }): Promise<{
        prompt(input: string): Promise<string>;
        destroy(): void;
      }>;
    };
  }
  
  interface Window {
    ai?: AI;
  }
}

export enum MultimodalAvailability {
  READILY_AVAILABLE = 'readily',
  AFTER_DOWNLOAD = 'after-download',
  UNAVAILABLE = 'no'
}

export interface MultimodalError extends Error {
  code: 'UNAVAILABLE' | 'UNSUPPORTED_FORMAT' | 'TOKEN_LIMIT' | 'NETWORK_ERROR' | 'UNKNOWN';
  userMessage: string;
}

/**
 * Create a structured error for multimodal operations
 */
function createMultimodalError(error: Error, _operation: string): MultimodalError {
  let code: MultimodalError['code'] = 'UNKNOWN';
  let userMessage = 'An unexpected error occurred while processing your image question.';

  if (error.message.toLowerCase().includes('unavailable') || 
      error.message.toLowerCase().includes('not available')) {
    code = 'UNAVAILABLE';
    userMessage = 'Language Model AI is not available on this device. Please ensure you\'re using Chrome with AI features enabled.';
  } else if (error.message.toLowerCase().includes('token') || 
             error.message.toLowerCase().includes('too long')) {
    code = 'TOKEN_LIMIT';
    userMessage = 'The question is too long to process locally. Please try with a shorter question.';
  } else if (error.message.toLowerCase().includes('network') || 
             error.message.toLowerCase().includes('connection')) {
    code = 'NETWORK_ERROR';
    userMessage = 'Network error occurred while processing your request. Please try again.';
  } else if (error.message.toLowerCase().includes('format') || 
             error.message.toLowerCase().includes('unsupported')) {
    code = 'UNSUPPORTED_FORMAT';
    userMessage = 'Note: Direct image analysis is not currently supported. Using text-based response instead.';
  } else if (error.message.toLowerCase().includes('no answer could be generated') || 
             error.message.toLowerCase().includes('no response could be generated')) {
    code = 'UNKNOWN';
    userMessage = 'No response could be generated for your question. Please try a different approach.';
  }

  const multimodalError = new Error(userMessage) as MultimodalError;
  multimodalError.code = code;
  multimodalError.userMessage = userMessage;
  multimodalError.name = 'MultimodalError';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (multimodalError as any).cause = error;

  return multimodalError;
}

/**
 * Check if Chrome's Language Model API is available
 * Note: Multimodal image processing is currently experimental and not supported
 */
export async function checkMultimodalAvailability(): Promise<MultimodalAvailability> {
  try {
    if (!window.ai?.languageModel) {
      return MultimodalAvailability.UNAVAILABLE;
    }

    const capabilities = await window.ai.languageModel.capabilities();
    return capabilities.available as MultimodalAvailability;
  } catch (error) {
    console.error('Error checking language model availability:', error);
    return MultimodalAvailability.UNAVAILABLE;
  }
}

/**
 * Ask a question about an image using Chrome's built-in language model
 * Note: This is a text-only fallback since multimodal image processing is experimental
 * @param image The image file as a Blob (currently not processed directly)
 * @param question The question to ask about the image
 * @returns Promise resolving to a text-only response explaining limitation
 */
export async function askImageQuestion(image: Blob, question: string): Promise<string> {
  // Input validation
  if (!image || image.size === 0) {
    throw createMultimodalError(new Error('No image provided'), 'ask image question');
  }

  if (!question || question.trim().length === 0) {
    throw createMultimodalError(new Error('Empty question'), 'ask image question');
  }

  // Validate image format
  if (!image.type.startsWith('image/')) {
    throw createMultimodalError(new Error('Unsupported format'), 'ask image question');
  }

  const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!supportedFormats.includes(image.type.toLowerCase())) {
    throw createMultimodalError(new Error('Unsupported format'), 'ask image question');
  }

  // Check availability
  const availability = await checkMultimodalAvailability();
  if (availability === MultimodalAvailability.UNAVAILABLE) {
    throw createMultimodalError(new Error('Unavailable'), 'ask image question');
  }

  try {
    // Note: Chrome's stable AI APIs don't currently support direct image processing
    // This implementation provides a helpful response explaining the limitation
    if (!window.ai?.languageModel) {
      throw new Error('Language Model API not available');
    }

    // Create language model session
    const session = await window.ai.languageModel.create({
      systemPrompt: 'You are a helpful assistant. Explain to users that direct image analysis is not currently available in Chrome\'s stable AI APIs.',
      temperature: 0.3
    });

    try {
      const prompt = `I have uploaded an image (${image.type}, ${Math.round(image.size / 1024)}KB) and want to ask: "${question.trim()}"

However, Chrome's built-in AI APIs don't currently support direct image analysis in the stable release. Please provide a helpful response explaining this limitation and suggest alternative approaches for analyzing images.`;

      const response = await session.prompt(prompt);
      
      if (!response || response.trim().length === 0) {
        throw new Error('No response could be generated');
      }
      
      return response.trim();
    } finally {
      session.destroy();
    }
  } catch (error) {
    console.error('Image question processing failed:', error);
    throw createMultimodalError(
      error instanceof Error ? error : new Error('Unknown error'),
      'ask image question'
    );
  }
}

/**
 * Ask a question about an image and optionally summarise the response if it's too long
 * @param image The image file as a Blob  
 * @param question The question to ask about the image
 * @param maxLength Maximum length for response (if exceeded, will attempt to summarise)
 * @returns Promise resolving to the AI's answer (potentially summarised)
 */
export async function askImageQuestionWithSummary(
  image: Blob, 
  question: string, 
  maxLength: number = 500
): Promise<string> {
  const answer = await askImageQuestion(image, question);
  
  // If answer is within acceptable length, return as-is
  if (answer.length <= maxLength) {
    return answer;
  }
  
  // Attempt to summarise the long answer
  try {
    // Import summarizer dynamically to avoid circular dependencies
    const { getTlDr } = await import('./summarizer');
    const summary = await getTlDr(answer);
    return summary.content; // Extract the content from SummariserResult
  } catch (summaryError) {
    console.warn('Failed to summarise long response, returning original:', summaryError);
    // Return original answer if summarisation fails
    return answer;
  }
}