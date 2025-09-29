/**
 * Gmail Import component with OAuth authentication and thread selection
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  generateAuthUrl, 
  exchangeCodeForTokens, 
  isAuthenticated, 
  signOut 
} from '../lib/auth/gmail-oauth';
import { 
  listThreads, 
  getThread, 
  convertThreadToEmail, 
  getUserProfile 
} from '../lib/gmail/api';
import { parseAttachments } from '../lib/parse';
import type { 
  GmailImportState, 
  GmailImportProgress, 
  ImportedEmail 
} from '../types/gmail';
import type { ParsedAttachment } from '../types/attachment';

interface GmailImportProps {
  onImportComplete: (emails: ImportedEmail[], attachments: ParsedAttachment[]) => void;
  onError: (error: string) => void;
}

interface ThreadListItem {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export default function GmailImport({ onImportComplete, onError }: GmailImportProps) {
  const [state, setState] = useState<GmailImportState>(GmailImportState.IDLE);
  const [progress, setProgress] = useState<GmailImportProgress>({
    state: GmailImportState.IDLE,
    message: 'Ready to connect to Gmail'
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Check authentication status on mount
  useEffect(() => {
    if (isAuthenticated()) {
      setState(GmailImportState.AUTHENTICATED);
      setProgress({
        state: GmailImportState.AUTHENTICATED,
        message: 'Connected to Gmail'
      });
      loadUserProfile();
      loadThreads();
    }
  }, [loadUserProfile, loadThreads]);

  // Handle OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      setProgress({
        state: GmailImportState.ERROR,
        message: `Authentication failed: ${error}`
      });
      setState(GmailImportState.ERROR);
      return;
    }

    if (code && state) {
      handleOAuthCallback(code, state);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleOAuthCallback]);

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      setUserEmail(profile.emailAddress);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }, []);

  const loadThreads = useCallback(async (query?: string) => {
    try {
      setState(GmailImportState.FETCHING_THREADS);
      setProgress({
        state: GmailImportState.FETCHING_THREADS,
        message: 'Loading email threads...'
      });

      const response = await listThreads(20, query);
      
      // Get additional details for each thread to display better preview
      const threadsWithDetails: ThreadListItem[] = [];
      
      for (const thread of response.data) {
        try {
          const fullThread = await getThread(thread.id);
          const firstMessage = fullThread.messages[0];
          
          if (firstMessage) {
            const headers = firstMessage.payload.headers || [];
            const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'No subject';
            const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown sender';
            const dateString = headers.find(h => h.name.toLowerCase() === 'date')?.value;
            
            let formattedDate = '';
            if (dateString) {
              try {
                const date = new Date(dateString);
                formattedDate = date.toLocaleDateString();
              } catch {
                formattedDate = dateString;
              }
            }

            threadsWithDetails.push({
              id: thread.id,
              snippet: thread.snippet,
              subject,
              from,
              date: formattedDate
            });
          } else {
            threadsWithDetails.push({
              id: thread.id,
              snippet: thread.snippet
            });
          }
        } catch (error) {
          console.error(`Error loading thread details for ${thread.id}:`, error);
          // Add thread with basic info if detail loading fails
          threadsWithDetails.push({
            id: thread.id,
            snippet: thread.snippet
          });
        }
      }

      setThreads(threadsWithDetails);
      setState(GmailImportState.SELECTING_THREAD);
      setProgress({
        state: GmailImportState.SELECTING_THREAD,
        message: `Loaded ${threadsWithDetails.length} email threads`
      });
    } catch (error) {
      console.error('Error loading threads:', error);
      setState(GmailImportState.ERROR);
      setProgress({
        state: GmailImportState.ERROR,
        message: `Failed to load threads: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      onError(`Failed to load Gmail threads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [onError]);

  const handleOAuthCallback = useCallback(async (code: string, state: string) => {
    try {
      setState(GmailImportState.AUTHENTICATING);
      setProgress({
        state: GmailImportState.AUTHENTICATING,
        message: 'Completing authentication...'
      });

      await exchangeCodeForTokens(code, state);
      
      setState(GmailImportState.AUTHENTICATED);
      setProgress({
        state: GmailImportState.AUTHENTICATED,
        message: 'Successfully connected to Gmail'
      });

      await loadUserProfile();
      await loadThreads();
    } catch (error) {
      console.error('OAuth callback error:', error);
      setState(GmailImportState.ERROR);
      setProgress({
        state: GmailImportState.ERROR,
        message: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      onError(`Gmail authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [loadUserProfile, loadThreads, onError]);

  const handleSignIn = useCallback(async () => {
    try {
      setState(GmailImportState.AUTHENTICATING);
      setProgress({
        state: GmailImportState.AUTHENTICATING,
        message: 'Redirecting to Google authentication...'
      });

      const authUrl = await generateAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Sign in error:', error);
      setState(GmailImportState.ERROR);
      setProgress({
        state: GmailImportState.ERROR,
        message: `Failed to start authentication: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      onError(`Failed to start Gmail authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [onError]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setState(GmailImportState.IDLE);
      setProgress({
        state: GmailImportState.IDLE,
        message: 'Signed out from Gmail'
      });
      setUserEmail(null);
      setThreads([]);
      setSelectedThreadId(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Still reset state even if sign out fails
      setState(GmailImportState.IDLE);
      setProgress({
        state: GmailImportState.IDLE,
        message: 'Signed out from Gmail'
      });
      setUserEmail(null);
      setThreads([]);
      setSelectedThreadId(null);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      await loadThreads(searchQuery.trim());
    } else {
      await loadThreads();
    }
  }, [searchQuery, loadThreads]);

  const handleImportThread = useCallback(async (threadId: string) => {
    try {
      setState(GmailImportState.IMPORTING_THREAD);
      setProgress({
        state: GmailImportState.IMPORTING_THREAD,
        message: 'Importing email thread and attachments...',
        progress: 20
      });

      // Fetch the full thread data
      const thread = await getThread(threadId);
      
      setProgress({
        state: GmailImportState.IMPORTING_THREAD,
        message: 'Converting thread to standard format...',
        progress: 40
      });

      // Convert to standardised email format
      const emails = await convertThreadToEmail(thread);

      setProgress({
        state: GmailImportState.IMPORTING_THREAD,
        message: 'Processing attachments...',
        progress: 60
      });

      // Process all attachments through the existing parsing pipeline
      const allAttachments: ParsedAttachment[] = [];
      
      for (const email of emails) {
        if (email.attachments.length > 0) {
          for (const attachment of email.attachments) {
            try {
              // Convert ImportedAttachment to File object for parsing
              const file = new File([attachment.content], attachment.filename, {
                type: attachment.mimeType
              });
              
              const parsed = await parseAttachments([file]);
              allAttachments.push(...parsed);
            } catch (error) {
              console.error(`Failed to parse attachment ${attachment.filename}:`, error);
              // Continue with other attachments even if one fails
            }
          }
        }
      }

      setProgress({
        state: GmailImportState.COMPLETED,
        message: `Successfully imported ${emails.length} messages with ${allAttachments.length} attachments`,
        progress: 100
      });

      setState(GmailImportState.COMPLETED);
      onImportComplete(emails, allAttachments);

    } catch (error) {
      console.error('Error importing thread:', error);
      setState(GmailImportState.ERROR);
      setProgress({
        state: GmailImportState.ERROR,
        message: `Failed to import thread: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      onError(`Failed to import Gmail thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [onImportComplete, onError]);

  // Render sign-in screen
  if (state === GmailImportState.IDLE || state === GmailImportState.AUTHENTICATING) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Connect to Gmail
          </h3>
          <p className="text-gray-600 mb-4">
            Sign in with your Google account to import email threads and attachments.
            We request read-only access to your Gmail.
          </p>
        </div>

        {progress.message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">{progress.message}</p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleSignIn}
            disabled={state === GmailImportState.AUTHENTICATING}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {state === GmailImportState.AUTHENTICATING ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>
            By signing in, you grant read-only access to your Gmail account.
            Your emails are processed locally and not stored on our servers.
          </p>
        </div>
      </div>
    );
  }

  // Render authenticated interface
  return (
    <div className="space-y-6">
      {/* User info and sign out */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-800">Gmail Connected</h3>
          {userEmail && (
            <p className="text-sm text-gray-600">Signed in as {userEmail}</p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Sign Out
        </button>
      </div>

      {/* Progress indicator */}
      {progress.message && (
        <div className={`border rounded-lg p-3 ${
          state === GmailImportState.ERROR 
            ? 'bg-red-50 border-red-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-sm ${
            state === GmailImportState.ERROR ? 'text-red-700' : 'text-blue-700'
          }`}>
            {progress.message}
          </p>
          {progress.progress !== undefined && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Search and thread selection */}
      {state === GmailImportState.SELECTING_THREAD && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search emails (e.g., from:someone@example.com, subject:important)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedThreadId === thread.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedThreadId(thread.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {thread.subject || 'No subject'}
                    </p>
                    {thread.from && (
                      <p className="text-sm text-gray-600 truncate">
                        From: {thread.from}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {thread.snippet}
                    </p>
                  </div>
                  {thread.date && (
                    <p className="text-xs text-gray-500 ml-2">
                      {thread.date}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {threads.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No email threads found. Try adjusting your search query.
              </p>
            )}
          </div>

          {selectedThreadId && (
            <div className="text-center">
              <button
                onClick={() => handleImportThread(selectedThreadId)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Import Selected Thread
              </button>
            </div>
          )}
        </div>
      )}

      {/* Import completed */}
      {state === GmailImportState.COMPLETED && (
        <div className="text-center space-y-4">
          <div className="text-green-600">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-800">
            Import Completed Successfully!
          </p>
          <p className="text-gray-600">
            Your email thread and attachments have been imported and are ready for analysis.
          </p>
          <button
            onClick={() => {
              setState(GmailImportState.SELECTING_THREAD);
              setSelectedThreadId(null);
              setProgress({
                state: GmailImportState.SELECTING_THREAD,
                message: `${threads.length} email threads available`
              });
            }}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Import Another Thread
          </button>
        </div>
      )}
    </div>
  );
}