/**
 * Image parsing using Chrome's Prompt API multimodal capabilities
 */

import type { ParsedContent, ParseOptions } from '../../types/attachment';
import { cleanText } from './utils';

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
}

const DEFAULT_OPTIONS: Required<ParseOptions> = {
  maxPages: 1, // Not applicable for single images
  maxRows: 1000,
  includeImages: true,
};

/**
 * Parse image file and generate description using multimodal AI
 */
export async function parseImage(file: File, options: ParseOptions = {}): Promise<ParsedContent> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const opts = { ...DEFAULT_OPTIONS, ...options };
  try {
    // Check if multimodal AI is available
    if (!window.ai?.prompt) {
      throw new Error('Multimodal AI is not available on this device');
    }
    
    const capabilities = await window.ai.prompt.capabilities();
    if (capabilities.available === 'no') {
      throw new Error('Multimodal AI is not available on this device');
    }
    
    // Validate that it's actually an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not a valid image');
    }
    
    // Create blob from file for AI processing
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    
    // Create prompt session
    const prompt = await window.ai.prompt.create();
    
    try {
      const response = await prompt.prompt(
        'Describe the contents of this image in detail. Include any text that is visible, objects, people, scenes, and relevant context. Be comprehensive but concise.',
        { images: [blob] }
      );
      
      if (!response || response.trim().length === 0) {
        throw new Error('No description could be generated for this image');
      }
      
      const cleanedDescription = cleanText(response);
      
      return {
        text: cleanedDescription,
        metadata: {
          imageDescription: cleanedDescription,
        },
      };
    } finally {
      prompt.destroy();
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
 * Extract text from image using OCR-like functionality via multimodal AI
 * This is optimized for images that primarily contain text
 */
export async function extractTextFromImage(file: File): Promise<ParsedContent> {
  try {
    // Check if multimodal AI is available
    if (!window.ai?.prompt) {
      throw new Error('Multimodal AI is not available on this device');
    }
    
    const capabilities = await window.ai.prompt.capabilities();
    if (capabilities.available === 'no') {
      throw new Error('Multimodal AI is not available on this device');
    }
    
    // Validate that it's actually an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not a valid image');
    }
    
    // Create blob from file for AI processing
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    
    // Create prompt session
    const prompt = await window.ai.prompt.create();
    
    try {
      const response = await prompt.prompt(
        'Extract all visible text from this image. Return only the text content, maintaining the original structure and formatting as much as possible. If there is no text, return "No text found".',
        { images: [blob] }
      );
      
      if (!response || response.trim().length === 0 || response.trim().toLowerCase() === 'no text found') {
        // Fallback to general description if no text found
        return await parseImage(file);
      }
      
      const cleanedText = cleanText(response);
      
      return {
        text: cleanedText,
        metadata: {
          imageDescription: `Text extracted from image: ${cleanedText}`,
        },
      };
    } finally {
      prompt.destroy();
    }
  } catch (error) {
    console.error('Image text extraction failed:', error);
    // Fallback to general image description
    return await parseImage(file);
  }
}

/**
 * Check if image parsing (multimodal AI) is supported
 */
export async function isImageParsingSupported(): Promise<boolean> {
  try {
    if (!window.ai?.prompt) {
      return false;
    }
    
    const capabilities = await window.ai.prompt.capabilities();
    return capabilities.available !== 'no';
  } catch (error) {
    console.warn('Failed to check image parsing availability:', error);
    return false;
  }
}