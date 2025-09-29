/**
 * Chrome Prompt API wrapper for multimodal image Q&A functionality
 * Enables users to ask questions about uploaded images using built-in AI
 */

// Type definitions for Chrome's built-in AI Prompt API with multimodal support
declare global {
  interface AI {
    prompt?: {
      capabilities(): Promise<{
        available: 'readily' | 'after-download' | 'no';
      }>;
      create(): Promise<{
        prompt(input: string, options?: { images?: Blob[] }): Promise<string>;
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
function createMultimodalError(error: Error, operation: string): MultimodalError {
  let code: MultimodalError['code'] = 'UNKNOWN';
  let userMessage = 'An unexpected error occurred while processing your image question.';

  if (error.message.toLowerCase().includes('unavailable') || 
      error.message.toLowerCase().includes('not available')) {
    code = 'UNAVAILABLE';
    userMessage = 'Multimodal AI is not available on this device. Please ensure you\'re using Chrome with AI features enabled.';
  } else if (error.message.toLowerCase().includes('token') || 
             error.message.toLowerCase().includes('too long')) {
    code = 'TOKEN_LIMIT';
    userMessage = 'The image or question is too large to process locally. Please try with a smaller image or shorter question.';
  } else if (error.message.toLowerCase().includes('network') || 
             error.message.toLowerCase().includes('connection')) {
    code = 'NETWORK_ERROR';
    userMessage = 'Network error occurred while processing the image. Please try again.';
  } else if (error.message.toLowerCase().includes('format') || 
             error.message.toLowerCase().includes('unsupported')) {
    code = 'UNSUPPORTED_FORMAT';
    userMessage = 'Unsupported image format. Please use PNG, JPG, or WebP format.';
  } else if (error.message.toLowerCase().includes('no answer could be generated')) {
    code = 'UNKNOWN';
    userMessage = 'No answer could be generated for this image and question. Please try a different image or question.';
  }

  const multimodalError = new Error(userMessage) as MultimodalError;
  multimodalError.code = code;
  multimodalError.userMessage = userMessage;
  multimodalError.name = 'MultimodalError';
  (multimodalError as any).cause = error;

  return multimodalError;
}

/**
 * Check if Chrome's Prompt API with multimodal support is available
 */
export async function checkMultimodalAvailability(): Promise<MultimodalAvailability> {
  try {
    if (!window.ai?.prompt) {
      return MultimodalAvailability.UNAVAILABLE;
    }

    const capabilities = await window.ai.prompt.capabilities();
    return capabilities.available as MultimodalAvailability;
  } catch (error) {
    console.error('Error checking multimodal availability:', error);
    return MultimodalAvailability.UNAVAILABLE;
  }
}

/**
 * Ask a question about an image using Chrome's built-in multimodal AI
 * @param image The image file as a Blob
 * @param question The question to ask about the image
 * @returns Promise resolving to the AI's answer
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
    if (!window.ai?.prompt) {
      throw new Error('Multimodal API not available');
    }

    // Create prompt session
    const prompt = await window.ai.prompt.create();

    try {
      // Create a comprehensive prompt for better responses
      const systemPrompt = `Analyse the uploaded image carefully and answer the following question: "${question.trim()}"

Please provide a clear, detailed answer based on what you can see in the image. If the image contains text, charts, diagrams, or other visual elements, describe them as relevant to the question. Be specific and accurate in your response.`;

      const response = await prompt.prompt(systemPrompt, { images: [image] });
      
      if (!response || response.trim().length === 0) {
        throw new Error('No answer could be generated for this image and question');
      }
      
      return response.trim();
    } finally {
      prompt.destroy();
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
    return summary;
  } catch (summaryError) {
    console.warn('Failed to summarise long response, returning original:', summaryError);
    // Return original answer if summarisation fails
    return answer;
  }
}