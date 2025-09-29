/**
 * File upload component with drag-and-drop support for attachments
 */

import { useCallback, useState } from 'react';
import { getSupportedFileTypes } from '../lib/parse';

interface AttachmentUploadProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
}

export default function AttachmentUpload({
  onFilesSelected,
  isUploading = false,
  disabled = false,
  maxFiles = 10,
  className = '',
}: AttachmentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const supportedTypes = getSupportedFileTypes();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setDragCounter(0);
    
    if (disabled || isUploading) return;

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      const fileArray = Array.from(files).slice(0, maxFiles);
      onFilesSelected(fileArray);
    }
  }, [disabled, isUploading, maxFiles, onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isUploading) return;
    
    const { files } = e.target;
    if (files && files.length > 0) {
      const fileArray = Array.from(files).slice(0, maxFiles);
      onFilesSelected(fileArray);
    }
    
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [disabled, isUploading, maxFiles, onFilesSelected]);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || isUploading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:bg-gray-50'
          }
        `}
        onDrag={handleDrag}
        onDragStart={handleDrag}
        onDragEnd={handleDrag}
        onDragOver={handleDrag}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-disabled={disabled || isUploading}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
            document.getElementById('attachment-file-input')?.click();
          }
        }}
      >
        {/* Upload Icon */}
        <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {/* Upload Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            {isUploading ? 'Processing files...' : 'Upload attachments'}
          </h3>
          <p className="text-sm text-gray-600">
            {isUploading 
              ? 'Please wait while we process your files'
              : 'Drag and drop files here, or click to browse'
            }
          </p>
        </div>

        {/* Supported formats */}
        <div className="mt-4 text-xs text-gray-500">
          <p>Supported formats: PDF, DOCX, XLSX, XLS, CSV, PNG, JPG, WebP</p>
          <p>Maximum file size: 50MB per file • Maximum {maxFiles} files</p>
        </div>

        {/* Loading indicator */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        id="attachment-file-input"
        type="file"
        multiple
        accept={supportedTypes.mimeTypes.join(',')}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
        aria-label="Select attachment files"
      />
    </div>
  );
}