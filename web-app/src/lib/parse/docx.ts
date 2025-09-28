/**
 * DOCX parsing using mammoth.js to convert to plain text
 */

import mammoth from 'mammoth';
import type { ParsedContent, ParseOptions } from '../../types/attachment';
import { cleanText, truncateText } from './utils';

const DEFAULT_OPTIONS: Required<ParseOptions> = {
  maxPages: 100, // Not applicable for DOCX but kept for consistency
  maxRows: 1000,
  includeImages: false, // DOCX images require separate handling
};

/**
 * Parse DOCX file and extract text content
 */
export async function parseDocx(file: File, options: ParseOptions = {}): Promise<ParsedContent> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Convert DOCX to HTML first, then extract text
    const result = await mammoth.convertToHtml({ arrayBuffer }, {
      convertImage: mammoth.images.ignoreAllImages, // Skip images for now
    });
    
    if (result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages);
    }
    
    // Convert HTML to plain text while preserving structure
    const htmlText = result.value;
    const plainText = htmlToPlainText(htmlText);
    
    if (!plainText || plainText.trim().length === 0) {
      throw new Error('No text content could be extracted from this DOCX file');
    }
    
    const cleanedText = cleanText(plainText);
    
    // Truncate if too long (keeping roughly 50k characters for processing)
    const finalText = cleanedText.length > 50000 
      ? truncateText(cleanedText, 8000) 
      : cleanedText;
    
    const wordCount = finalText.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      text: finalText,
      metadata: {
        wordCount,
      },
    };
  } catch (error) {
    console.error('DOCX parsing failed:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to parse DOCX: ${error.message}`
        : 'Failed to parse DOCX: Unknown error'
    );
  }
}

/**
 * Convert HTML to plain text while preserving basic structure
 */
function htmlToPlainText(html: string): string {
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Replace some HTML elements with meaningful text equivalents
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      let result = '';
      
      // Handle specific elements
      switch (element.tagName.toLowerCase()) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          result = '\n\n' + Array.from(element.childNodes).map(processNode).join('') + '\n';
          break;
        case 'p':
          result = '\n' + Array.from(element.childNodes).map(processNode).join('') + '\n';
          break;
        case 'br':
          result = '\n';
          break;
        case 'li':
          result = '\n• ' + Array.from(element.childNodes).map(processNode).join('');
          break;
        case 'table':
          result = '\n' + processTable(element) + '\n';
          break;
        default:
          result = Array.from(element.childNodes).map(processNode).join('');
      }
      
      return result;
    }
    
    return '';
  };
  
  return processNode(tempDiv);
}

/**
 * Process HTML table elements to extract structured data
 */
function processTable(table: Element): string {
  const rows = Array.from(table.querySelectorAll('tr'));
  return rows.map(row => {
    const cells = Array.from(row.querySelectorAll('td, th'));
    return cells.map(cell => cell.textContent?.trim() || '').join(' | ');
  }).join('\n');
}

/**
 * Check if DOCX parsing is supported in the current environment
 */
export function isDocxParsingSupported(): boolean {
  return typeof window !== 'undefined';
}