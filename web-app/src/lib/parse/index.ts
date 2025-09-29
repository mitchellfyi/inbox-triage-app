/**
 * Main parser module that routes files to appropriate parsers and handles summarisation
 */

import type { ParsedAttachment, ParsedContent, ParseOptions } from '../../types/attachment';
import { validateFile, generateAttachmentId, formatFileSize } from './utils';
import { getTlDr, getKeyPoints } from '../ai/summarizer';

/**
 * Parse a file based on its type and generate summaries
 */
export async function parseAttachment(
  file: File, 
  options: ParseOptions = {}
): Promise<ParsedAttachment> {
  // Validate the file
  const validation = validateFile(file);
  
  if (!validation.isSupported) {
    return {
      id: generateAttachmentId(),
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      content: { text: '' },
      isLoading: false,
      error: validation.error,
    };
  }
  
  const attachment: ParsedAttachment = {
    id: generateAttachmentId(),
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    content: { text: '' },
    isLoading: true,
  };
  
  try {
    // Parse content based on file type
    let content: ParsedContent;
    
    switch (validation.type!) {
      case 'pdf':
        const { parsePdf } = await import('./pdf');
        content = await parsePdf(file, options);
        break;
      case 'docx':
        const { parseDocx } = await import('./docx');
        content = await parseDocx(file, options);
        break;
      case 'xlsx':
      case 'xls':
      case 'csv':
        const { parseSpreadsheet } = await import('./xlsx');
        content = await parseSpreadsheet(file, options);
        break;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        const { parseImage } = await import('./image');
        content = await parseImage(file, options);
        break;
      default:
        throw new Error(`Unsupported file type: ${validation.type}`);
    }
    
    attachment.content = content;
    attachment.isLoading = false;
    
    // Generate summaries
    if (content.text && content.text.trim().length > 0) {
      try {
        const summary = await generateAttachmentSummary(content.text, file.name);
        attachment.summary = summary;
      } catch (summaryError) {
        console.warn('Failed to generate summary:', summaryError);
        // Continue without summary rather than failing the entire parsing
      }
    }
    
    return attachment;
  } catch (error) {
    console.error('Attachment parsing failed:', error);
    return {
      ...attachment,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to parse attachment',
    };
  }
}

/**
 * Generate TL;DR and key points summary for parsed attachment content
 */
async function generateAttachmentSummary(text: string, filename: string) {
  try {
    // Generate TL;DR and key points in parallel
    const [tldr, keyPoints] = await Promise.all([
      getTlDr(`File: ${filename}\n\n${text}`),
      getKeyPoints(`File: ${filename}\n\n${text}`),
    ]);
    
    // Generate one-line summary (use first sentence of TL;DR or first key point)
    const oneLineSummary = tldr.split(/[.!?]/)[0].trim() || 
                          keyPoints[0] || 
                          'Document processed successfully';
    
    return {
      tldr,
      keyPoints,
      oneLineSummary: oneLineSummary.length > 100 
        ? oneLineSummary.substring(0, 97) + '...' 
        : oneLineSummary,
    };
  } catch (error) {
    console.error('Summary generation failed:', error);
    throw error;
  }
}

/**
 * Parse multiple files in batch
 */
export async function parseAttachments(
  files: File[], 
  options: ParseOptions = {}
): Promise<ParsedAttachment[]> {
  const results: ParsedAttachment[] = [];
  
  // Process files sequentially to avoid overwhelming the AI APIs
  for (const file of files) {
    try {
      const result = await parseAttachment(file, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to parse ${file.name}:`, error);
      results.push({
        id: generateAttachmentId(),
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        content: { text: '' },
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to parse file',
      });
    }
  }
  
  return results;
}

/**
 * Get supported file types for display in UI
 */
export function getSupportedFileTypes(): { extensions: string[]; mimeTypes: string[] } {
  return {
    extensions: ['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.png', '.jpg', '.jpeg', '.webp'],
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ],
  };
}

/**
 * Format attachment info for display
 */
export function formatAttachmentInfo(attachment: ParsedAttachment): string {
  const typeLabel = attachment.type.split('/')[1]?.toUpperCase() || 'FILE';
  const sizeLabel = formatFileSize(attachment.size);
  return `${typeLabel} • ${sizeLabel}`;
}