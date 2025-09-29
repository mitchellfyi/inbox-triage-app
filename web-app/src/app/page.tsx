'use client';

import React, { useState, useCallback, useEffect } from 'react';
import EmailThreadInput from '../components/EmailThreadInput';
import ThreadSummary from '../components/ThreadSummary';
import ReplyDrafts from '../components/ReplyDrafts';
import AttachmentSection from '../components/AttachmentSection';
import ImageQA from '../components/ImageQA';
import { 
  getTlDr, 
  getKeyPoints, 
  checkSummariserAvailability, 
  SummariserAvailability,
  type SummariserError 
} from '../lib/ai/summarizer';
import type { ParsedAttachment } from '../types/attachment';

export default function Home() {
  const [tldr, setTldr] = useState<string>();
  const [keyPoints, setKeyPoints] = useState<string[]>();
  const [threadContent, setThreadContent] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [availability, setAvailability] = useState<SummariserAvailability>();
  const [isDownloading, setIsDownloading] = useState(false);
  const [attachments, setAttachments] = useState<ParsedAttachment[]>([]);

  const handleTextSubmit = useCallback(async (text: string) => {
    // Store the thread content for draft generation
    setThreadContent(text);
    
    // Clear previous results and errors
    setTldr(undefined);
    setKeyPoints(undefined);
    setError(undefined);
    setIsLoading(true);

    try {
      // Check if model needs downloading
      const currentAvailability = await checkSummariserAvailability();
      setAvailability(currentAvailability);
      
      if (currentAvailability === SummariserAvailability.AFTER_DOWNLOAD) {
        setIsDownloading(true);
      }

      // Generate TL;DR and key points concurrently
      const [tldrResult, keyPointsResult] = await Promise.all([
        getTlDr(text),
        getKeyPoints(text)
      ]);

      setTldr(tldrResult.content);
      setKeyPoints(keyPointsResult.keyPoints);
    } catch (err) {
      console.error('Summarisation failed:', err);
      
      const summariserError = err as SummariserError;
      setError(summariserError.userMessage || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setIsDownloading(false);
    }
  }, []);

  // Check AI model availability on component mount and handle imported content
  useEffect(() => {
    async function checkAvailability() {
      try {
        const status = await checkSummariserAvailability();
        setAvailability(status);
      } catch (err) {
        console.error('Failed to check summariser availability:', err);
        setAvailability(SummariserAvailability.UNAVAILABLE);
      }
    }

    // Check for imported content from Gmail import
    function handleImportedContent() {
      const importedEmailContent = sessionStorage.getItem('importedEmailContent');
      const importedAttachmentsStr = sessionStorage.getItem('importedAttachments');
      
      if (importedEmailContent) {
        // Auto-populate the text input and start analysis
        handleTextSubmit(importedEmailContent);
        
        // Clear from session storage after use
        sessionStorage.removeItem('importedEmailContent');
      }
      
      if (importedAttachmentsStr) {
        try {
          const importedAttachments: ParsedAttachment[] = JSON.parse(importedAttachmentsStr);
          setAttachments(importedAttachments);
          
          // Clear from session storage after use
          sessionStorage.removeItem('importedAttachments');
        } catch (error) {
          console.error('Error parsing imported attachments:', error);
          sessionStorage.removeItem('importedAttachments');
        }
      }
    }

    checkAvailability();
    handleImportedContent();
  }, [handleTextSubmit]);

  const handleAttachmentsChange = useCallback((newAttachments: ParsedAttachment[]) => {
    setAttachments(newAttachments);
  }, []);

  const hasSummary = Boolean(tldr || (keyPoints && keyPoints.length > 0));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4">
        <main className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h1 className="text-4xl font-semibold text-gray-800 mb-4 text-center">
              Inbox Triage App
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto text-center">
              A web-based email triage companion that helps you summarise email
              threads, understand attachments and generate reply drafts — all
              running primarily on-device using Chrome&apos;s built-in AI.
            </p>
          </header>

          {/* Email Thread Input */}
          <EmailThreadInput 
            onTextSubmit={handleTextSubmit}
            isLoading={isLoading || isDownloading}
          />

          {/* Attachment Section */}
          <AttachmentSection
            onAttachmentsChange={handleAttachmentsChange}
            className="mb-8"
          />

          {/* Image Q&A Section */}
          <ImageQA className="mb-8" />

          {/* Thread Summary */}
          <ThreadSummary
            tldr={tldr}
            keyPoints={keyPoints}
            isLoading={isLoading}
            error={error}
            availability={availability}
            isDownloading={isDownloading}
          />

          {/* Reply Drafts */}
          <ReplyDrafts
            threadContent={threadContent}
            isLoading={isLoading}
            hasSummary={hasSummary}
          />
        </main>
      </div>
    </div>
  );
}
