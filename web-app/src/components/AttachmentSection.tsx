/**
 * Main attachment section component that handles file upload and displays attachments
 */

import { useState, useCallback } from 'react';
import AttachmentUpload from './AttachmentUpload';
import AttachmentList from './AttachmentList';
import type { ParsedAttachment } from '../types/attachment';
import { parseAttachments } from '../lib/parse';

interface AttachmentSectionProps {
  className?: string;
  onAttachmentsChange?: (attachments: ParsedAttachment[]) => void;
}

export default function AttachmentSection({ 
  className = '',
  onAttachmentsChange 
}: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<ParsedAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Create initial attachment objects for immediate display
      const initialAttachments = files.map((file) => ({
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        content: { text: '' },
        isLoading: true,
      }));

      // Update state with loading attachments
      const updatedAttachments = [...attachments, ...initialAttachments];
      setAttachments(updatedAttachments);
      onAttachmentsChange?.(updatedAttachments);

      // Process files
      const parsedAttachments = await parseAttachments(files);
      
      // Replace temporary attachments with parsed results
      const finalAttachments = [
        ...attachments,
        ...parsedAttachments,
      ];
      
      setAttachments(finalAttachments);
      onAttachmentsChange?.(finalAttachments);
    } catch (error) {
      console.error('Failed to process attachments:', error);
      
      // Create error attachments for files that couldn't be processed
      const errorAttachments = files.map((file) => ({
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        content: { text: '' },
        isLoading: false,
        error: 'Failed to process file. Please try again.',
      }));

      const finalAttachments = [...attachments, ...errorAttachments];
      setAttachments(finalAttachments);
      onAttachmentsChange?.(finalAttachments);
    } finally {
      setIsProcessing(false);
    }
  }, [attachments, onAttachmentsChange]);

  const handleRemoveAttachment = useCallback((id: string) => {
    const updatedAttachments = attachments.filter(attachment => attachment.id !== id);
    setAttachments(updatedAttachments);
    onAttachmentsChange?.(updatedAttachments);
  }, [attachments, onAttachmentsChange]);

  const handleClearAll = useCallback(() => {
    setAttachments([]);
    onAttachmentsChange?.([]);
  }, [onAttachmentsChange]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Attachments</h2>
        {attachments.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={isProcessing}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Upload Section */}
      <AttachmentUpload
        onFilesSelected={handleFilesSelected}
        isUploading={isProcessing}
        maxFiles={10}
      />

      {/* Attachments List */}
      {attachments.length > 0 && (
        <AttachmentList
          attachments={attachments}
          onRemove={handleRemoveAttachment}
        />
      )}

      {/* Processing Status */}
      {isProcessing && attachments.some(a => a.isLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Processing attachments</h3>
              <p className="text-sm text-blue-700">
                This may take a few moments for large files. We&apos;re extracting content and generating summaries.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {attachments.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">
            Upload attachments to extract content and generate automatic summaries.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            All processing happens on your device to protect your privacy.
          </p>
        </div>
      )}
    </div>
  );
}