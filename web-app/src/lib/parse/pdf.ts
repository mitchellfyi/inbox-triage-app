/**
 * PDF parsing using PDF.js with fallback to image processing for scanned pages
 */

import * as pdfjsLib from 'pdfjs-dist';
import type { ParsedContent, ParseOptions } from '../../types/attachment';
import { cleanText, truncateText } from './utils';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

const DEFAULT_OPTIONS: Required<ParseOptions> = {
  maxPages: 100,
  maxRows: 1000,
  includeImages: true,
};

/**
 * Parse PDF file and extract text content
 */
export async function parsePdf(file: File, options: ParseOptions = {}): Promise<ParsedContent> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const totalPages = Math.min(pdf.numPages, opts.maxPages);
    const textPages: string[] = [];
    let totalTextLength = 0;
    
    // Process pages sequentially to avoid memory issues
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text from page
        const pageText = textContent.items
          .map((item: { str?: string }) => {
            if ('str' in item && item.str) {
              return item.str;
            }
            return '';
          })
          .join(' ')
          .trim();
        
        // If text extraction failed and page appears to be scanned, try image processing
        if (pageText.length < 50 && opts.includeImages) {
          const imageText = await extractTextFromPageImage(page);
          if (imageText) {
            textPages.push(imageText);
            totalTextLength += imageText.length;
            continue;
          }
        }
        
        if (pageText.length > 0) {
          textPages.push(pageText);
          totalTextLength += pageText.length;
        }
        
        // Break if we've extracted enough content (roughly 100k characters)
        if (totalTextLength > 100000) {
          break;
        }
      } catch (pageError) {
        console.warn(`Failed to process PDF page ${pageNum}:`, pageError);
        continue;
      }
    }
    
    if (textPages.length === 0) {
      throw new Error('No text content could be extracted from this PDF');
    }
    
    const fullText = textPages.join('\n\n');
    const cleanedText = cleanText(fullText);
    
    // Truncate if too long (keeping roughly 50k characters for processing)
    const finalText = cleanedText.length > 50000 
      ? truncateText(cleanedText, 8000) 
      : cleanedText;
    
    return {
      text: finalText,
      metadata: {
        pageCount: totalPages,
        wordCount: finalText.split(/\s+/).length,
      },
    };
  } catch (error) {
    console.error('PDF parsing failed:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to parse PDF: ${error.message}`
        : 'Failed to parse PDF: Unknown error'
    );
  }
}

// Type definitions for PDF.js interfaces
interface PDFPageViewport {
  width: number;
  height: number;
}

interface PDFPage {
  getViewport(options: { scale: number }): PDFPageViewport;
  render(options: { 
    canvasContext: CanvasRenderingContext2D; 
    viewport: PDFPageViewport 
  }): { promise: Promise<void> };
}

/**
 * Extract text from a page by rendering it as an image and using multimodal AI
 * This is a fallback for scanned PDFs or pages with no extractable text
 */
async function extractTextFromPageImage(page: PDFPage): Promise<string | null> {
  try {
    // Check if multimodal AI is available
    if (!window.ai?.prompt) {
      return null;
    }
    
    // Render page to canvas
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    
    // Convert canvas to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png', 0.8);
    });
    
    if (!blob) return null;
    
    // Use AI to extract text from image
    const prompt = await window.ai.prompt.create();
    
    try {
      const response = await prompt.prompt(
        'Extract all visible text from this image. Return only the text content, maintaining the original structure and formatting as much as possible.',
        { images: [blob] }
      );
      
      return response.trim();
    } finally {
      prompt.destroy();
    }
  } catch (error) {
    console.warn('Failed to extract text from page image:', error);
    return null;
  }
}

/**
 * Check if PDF parsing is supported in the current environment
 */
export function isPdfParsingSupported(): boolean {
  return typeof window !== 'undefined' && 'Worker' in window;
}