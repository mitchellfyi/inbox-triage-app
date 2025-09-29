'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GmailImport from '../../components/GmailImport';
import OutlookImport from '../../components/OutlookImport';
import type { ImportedEmail } from '../../types/gmail';
import type { ImportedOutlookEmail } from '../../types/outlook';
import type { ParsedAttachment } from '../../types/attachment';

export default function ImportPage() {
  const router = useRouter();
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportComplete = useCallback((emails: ImportedEmail[] | ImportedOutlookEmail[], attachments: ParsedAttachment[]) => {
    // Combine email content into a single thread for analysis
    const combinedContent = emails.map(email => {
      const header = `From: ${email.from}\nTo: ${email.to.join(', ')}\nSubject: ${email.subject}\nDate: ${email.date.toLocaleString()}\n\n`;
      return header + email.body;
    }).join('\n\n---\n\n');

    // Store the imported data in sessionStorage so it can be accessed on the home page
    sessionStorage.setItem('importedEmailContent', combinedContent);
    
    if (attachments.length > 0) {
      sessionStorage.setItem('importedAttachments', JSON.stringify(attachments));
    }

    // Navigate to home page to show the analysis
    router.push('/');
  }, [router]);

  const handleImportError = useCallback((error: string) => {
    setImportError(error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <main className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 mb-4">
            Import Emails
          </h1>
          <p className="text-gray-600">
            Import email threads and attachments from Gmail or Outlook using OAuth authentication.
          </p>
        </header>

        {importError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Import Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{importError}</p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => setImportError(null)}
                    className="text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <h2 className="text-xl font-medium text-gray-800 mb-4 text-center">Gmail Import</h2>
              <GmailImport 
                onImportComplete={handleImportComplete}
                onError={handleImportError}
              />
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <h2 className="text-xl font-medium text-gray-800 mb-4 text-center">Outlook Import</h2>
              <OutlookImport 
                onImportComplete={handleImportComplete}
                onError={handleImportError}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Privacy Notice</h3>
          <p className="text-sm text-blue-700">
            When you connect your email account, we only request read-only permissions. 
            Your emails are processed locally on your device using Chrome&apos;s built-in AI capabilities. 
            No email content is sent to external servers unless you explicitly enable hybrid processing mode.
          </p>
        </div>
      </main>
    </div>
  );
}