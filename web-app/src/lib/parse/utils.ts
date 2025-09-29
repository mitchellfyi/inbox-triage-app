/**
 * Utility functions for file parsing and validation
 */

import type { FileTypeValidation, SupportedFileType } from '../../types/attachment';

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  pdf: 50 * 1024 * 1024, // 50MB
  docx: 10 * 1024 * 1024, // 10MB
  xlsx: 10 * 1024 * 1024, // 10MB
  xls: 10 * 1024 * 1024, // 10MB
  csv: 5 * 1024 * 1024, // 5MB
  png: 10 * 1024 * 1024, // 10MB
  jpg: 10 * 1024 * 1024, // 10MB
  jpeg: 10 * 1024 * 1024, // 10MB
  webp: 10 * 1024 * 1024, // 10MB
} as const;

// Supported MIME types
export const SUPPORTED_MIME_TYPES: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'text/csv': 'csv',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
};

// File extensions
export const SUPPORTED_EXTENSIONS: Record<string, SupportedFileType> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.xlsx': 'xlsx',
  '.xls': 'xls',
  '.csv': 'csv',
  '.png': 'png',
  '.jpg': 'jpg',
  '.jpeg': 'jpg',
  '.webp': 'webp',
};

/**
 * Validate file type and size
 */
export function validateFile(file: File): FileTypeValidation {
  // Check MIME type first
  let fileType = SUPPORTED_MIME_TYPES[file.type];
  
  // If MIME type not recognised, check extension
  if (!fileType) {
    const extension = getFileExtension(file.name);
    fileType = SUPPORTED_EXTENSIONS[extension];
  }
  
  if (!fileType) {
    return {
      isSupported: false,
      maxSize: 0,
      error: `Unsupported file type: ${file.type || 'unknown'}. Supported types: PDF, DOCX, XLSX, XLS, CSV, PNG, JPG, WebP`,
    };
  }
  
  const maxSize = FILE_SIZE_LIMITS[fileType];
  
  if (file.size > maxSize) {
    return {
      isSupported: false,
      type: fileType,
      maxSize,
      error: `File too large: ${formatFileSize(file.size)}. Maximum size for ${fileType.toUpperCase()} files is ${formatFileSize(maxSize)}`,
    };
  }
  
  return {
    isSupported: true,
    type: fileType,
    maxSize,
  };
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : '';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a unique ID for attachments
 */
export function generateAttachmentId(): string {
  return `attachment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Truncate text to a maximum number of words
 */
export function truncateText(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Clean extracted text by removing excessive whitespace
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Limit consecutive newlines to max 2
    .trim();
}