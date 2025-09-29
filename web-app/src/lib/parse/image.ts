/**
 * Image parsing using Chrome's Language Model API
 * Note: Direct image processing is experimental and not currently available in stable Chrome
 */

import type { ParsedContent, ParseOptions } from '../../types/attachment';
import { cleanText } from './utils';

// Type definitions for Chrome's built-in AI Language Model API
// Note: Direct image processing is experimental and not currently available
declare global {
  interface AI {
    languageModel?: {
      capabilities(): Promise<{
        available: 'readily' | 'after-download' | 'no';
      }>;
      create(options?: {
        systemPrompt?: string;
        temperature?: number;
      }): Promise<{
        prompt(input: string): Promise<string>;
        destroy(): void;
      }>;
    };
  }
}

const DEFAULT_OPTIONS: Required<ParseOptions> = {
  maxPages: 1, // Not applicable for single images
  maxRows: 1000,
  includeImages: true,
};

/**
 * Parse image file and generate description using language model
 * Note: Direct image analysis is not currently supported in stable Chrome AI APIs
 */
export async function parseImage(file: File, options: ParseOptions = {}): Promise<ParsedContent> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const opts = { ...DEFAULT_OPTIONS, ...options };
  try {
    // Check if language model AI is available
    if (!window.ai?.languageModel) {
      throw new Error('Language model AI is not available on this device');
    }
    
    const capabilities = await window.ai.languageModel.capabilities();
    if (capabilities.available === 'no') {
      throw new Error('Language model AI is not available on this device');
    }
    
    // Validate that it's actually an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not a valid image');
    }
    
    // Create language model session
    const session = await window.ai.languageModel.create({
      systemPrompt: 'You are a helpful assistant that explains image analysis limitations to users.',
      temperature: 0.3
    });
    
    try {
      const response = await session.prompt(
        `I have uploaded an image file (${file.name}, ${file.type}, ${Math.round(file.size / 1024)}KB) that I would like to have described. However, Chrome's built-in AI APIs don't currently support direct image analysis in the stable release. Please provide a helpful explanation of this limitation and suggest alternative approaches for analyzing images, such as using online OCR tools for text extraction or image recognition services.`
      );
      
      if (!response || response.trim().length === 0) {
        throw new Error('No description could be generated for this image');
      }
      
      const cleanedDescription = cleanText(response);
      
      return {
        text: cleanedDescription,
        metadata: {
          imageDescription: cleanedDescription,
          limitationNotice: 'Direct image analysis not currently supported by Chrome AI APIs'
        },
      };
    } finally {
      session.destroy();
    }
  } catch (error) {
    console.error('Image parsing failed:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to parse image: ${error.message}`
        : 'Failed to parse image: Unknown error'
    );
  }
}

/**
 * Extract text from image (OCR-like functionality)
 * Note: Direct image text extraction is not currently supported in stable Chrome AI APIs
 */
export async function extractTextFromImage(file: File): Promise<ParsedContent> {
  try {
    // Check if language model AI is available
    if (!window.ai?.languageModel) {
      throw new Error('Language model AI is not available on this device');
    }
    
    const capabilities = await window.ai.languageModel.capabilities();
    if (capabilities.available === 'no') {
      throw new Error('Language model AI is not available on this device');
    }
    
    // Validate that it's actually an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not a valid image');
    }
    
    // Create language model session
    const session = await window.ai.languageModel.create({
      systemPrompt: 'You are a helpful assistant that explains OCR and text extraction limitations to users.',
      temperature: 0.3
    });
    
    try {
      const response = await session.prompt(
        `I have uploaded an image file (${file.name}, ${file.type}) that I would like to extract text from using OCR (Optical Character Recognition). However, Chrome's built-in AI APIs don't currently support direct image text extraction in the stable release. Please provide a helpful explanation of this limitation and suggest alternative approaches for extracting text from images, such as using online OCR services, Google Lens, or dedicated OCR applications.`
      );
      
      if (!response || response.trim().length === 0) {
        // Fallback to general image parsing
        return await parseImage(file);
      }
      
      const cleanedText = cleanText(response);
      
      return {
        text: cleanedText,
        metadata: {
          imageDescription: cleanedText,
          limitationNotice: 'Direct image text extraction not currently supported by Chrome AI APIs'
        },
      };
    } finally {
      session.destroy();
    }
  } catch (error) {
    console.error('Image text extraction failed:', error);
    // Fallback to general image description
    return await parseImage(file);
  }
}

/**
 * Check if image parsing (language model AI) is supported
 */
export async function isImageParsingSupported(): Promise<boolean> {
  try {
    if (!window.ai?.languageModel) {
      return false;
    }
    
    const capabilities = await window.ai.languageModel.capabilities();
    return capabilities.available !== 'no';
  } catch (error) {
    console.warn('Failed to check language model availability:', error);
    return false;
  }
}