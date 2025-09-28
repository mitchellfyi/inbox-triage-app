/**
 * Type definitions for email attachment parsing and summarisation
 */

export interface AttachmentMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
}

export interface ParsedContent {
  text: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    sheetCount?: number;
    sheetNames?: string[];
    imageDescription?: string;
  };
}

export interface AttachmentSummary {
  tldr: string;
  keyPoints: string[];
  oneLineSummary: string;
}

export interface ParsedAttachment extends AttachmentMetadata {
  content: ParsedContent;
  summary?: AttachmentSummary;
  isLoading: boolean;
  error?: string;
}

export type SupportedFileType = 'pdf' | 'docx' | 'xlsx' | 'xls' | 'csv' | 'png' | 'jpg' | 'jpeg' | 'webp';

export interface FileTypeValidation {
  isSupported: boolean;
  type?: SupportedFileType;
  maxSize: number;
  error?: string;
}

export interface ParseOptions {
  maxPages?: number;
  maxRows?: number;
  includeImages?: boolean;
}