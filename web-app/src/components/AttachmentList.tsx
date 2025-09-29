/**
 * Component to display a list of uploaded attachments with summaries
 */

import { useState } from 'react';
import type { ParsedAttachment } from '../types/attachment';
import { formatAttachmentInfo } from '../lib/parse';
import AttachmentDetail from './AttachmentDetail';

interface AttachmentListProps {
  attachments: ParsedAttachment[];
  onRemove?: (id: string) => void;
  className?: string;
}

export default function AttachmentList({
  attachments,
  onRemove,
  className = '',
}: AttachmentListProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<ParsedAttachment | null>(null);

  if (attachments.length === 0) {
    return null;
  }

  const getFileIcon = (type: string) => {
    const mimeType = type.toLowerCase();
    
    if (mimeType.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
      return (
        <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (mimeType.includes('image')) {
      return (
        <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // Default file icon
    return (
      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Attachments ({attachments.length})
        </h3>
        
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className={`
              bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200
              ${attachment.error 
                ? 'border-red-200 bg-red-50' 
                : 'hover:border-gray-300 hover:shadow-sm cursor-pointer'
              }
            `}
            onClick={() => !attachment.error && setSelectedAttachment(attachment)}
            role={attachment.error ? 'alert' : 'button'}
            tabIndex={attachment.error ? -1 : 0}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !attachment.error) {
                setSelectedAttachment(attachment);
              }
            }}
            aria-label={`View details for ${attachment.name}`}
          >
            <div className="flex items-start space-x-3">
              {/* File Icon */}
              <div className="flex-shrink-0">
                {getFileIcon(attachment.type)}
              </div>
              
              {/* File Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-grow">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {attachment.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatAttachmentInfo(attachment)}
                    </p>
                    
                    {/* Summary or Error */}
                    {attachment.error ? (
                      <div className="mt-2 flex items-center space-x-1">
                        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-red-600">{attachment.error}</span>
                      </div>
                    ) : attachment.isLoading ? (
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-xs text-gray-600">Processing...</span>
                      </div>
                    ) : attachment.summary ? (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {attachment.summary.oneLineSummary}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">Click to view details</p>
                    )}
                  </div>
                  
                  {/* Remove Button */}
                  {onRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(attachment.id);
                      }}
                      className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label={`Remove ${attachment.name}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attachment Detail Modal */}
      {selectedAttachment && (
        <AttachmentDetail
          attachment={selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}
    </>
  );
}