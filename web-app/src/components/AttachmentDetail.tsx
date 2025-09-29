/**
 * Modal component to display detailed attachment information and summary
 */

import { useEffect } from 'react';
import type { ParsedAttachment } from '../types/attachment';
import { formatFileSize } from '../lib/parse/utils';

interface AttachmentDetailProps {
  attachment: ParsedAttachment;
  onClose: () => void;
}

export default function AttachmentDetail({ attachment, onClose }: AttachmentDetailProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getFileTypeLabel = (type: string): string => {
    const mimeType = type.toLowerCase();
    
    if (mimeType.includes('pdf')) return 'PDF Document';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word Document';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Excel Spreadsheet';
    if (mimeType.includes('csv')) return 'CSV File';
    if (mimeType.includes('image')) {
      const format = mimeType.split('/')[1]?.toUpperCase();
      return `${format} Image`;
    }
    
    return 'Document';
  };

  const formatMetadata = () => {
    const metadata = attachment.content.metadata;
    if (!metadata) return null;

    const items: string[] = [];
    
    if (metadata.pageCount) {
      items.push(`${metadata.pageCount} page${metadata.pageCount > 1 ? 's' : ''}`);
    }
    
    if (metadata.wordCount) {
      items.push(`${metadata.wordCount.toLocaleString()} words`);
    }
    
    if (metadata.sheetCount) {
      items.push(`${metadata.sheetCount} sheet${metadata.sheetCount > 1 ? 's' : ''}`);
    }
    
    return items.length > 0 ? items.join(' • ') : null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attachment-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="min-w-0 flex-grow">
            <h2 id="attachment-detail-title" className="text-xl font-semibold text-gray-900 truncate">
              {attachment.name}
            </h2>
            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
              <span>{getFileTypeLabel(attachment.type)}</span>
              <span>{formatFileSize(attachment.size)}</span>
              {formatMetadata() && <span>{formatMetadata()}</span>}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Close attachment details"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {attachment.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-800">Error Processing File</span>
              </div>
              <p className="mt-2 text-sm text-red-700">{attachment.error}</p>
            </div>
          ) : attachment.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-lg text-gray-600">Processing file...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Section */}
              {attachment.summary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed">{attachment.summary.tldr}</p>
                  </div>
                </div>
              )}

              {/* Key Points Section */}
              {attachment.summary?.keyPoints && attachment.summary.keyPoints.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Points</h3>
                  <ul className="space-y-2">
                    {attachment.summary.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sheet Information */}
              {attachment.content.metadata?.sheetNames && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Sheets</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {attachment.content.metadata.sheetNames.map((sheetName, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                        <span className="text-sm text-gray-700">{sheetName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Content Section (for debugging/transparency) */}
              {attachment.content.text && (
                <div>
                  <details className="group">
                    <summary className="cursor-pointer text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <span>Extracted Content</span>
                      <svg 
                        className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-90" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </summary>
                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                        {attachment.content.text}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}