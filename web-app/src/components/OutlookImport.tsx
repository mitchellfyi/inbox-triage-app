/**
 * Outlook Import component with OAuth authentication and message selection
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  initializeMsal,
  signInWithPopup,
  isAuthenticated, 
  signOut,
  getCurrentAccount
} from '../lib/auth/outlook-oauth';
import { 
  listMessages, 
  getMessage, 
  convertMessageToEmail,
  getUserProfile 
} from '../lib/outlook/api';
import { parseAttachments } from '../lib/parse';
import { 
  OutlookImportState
} from '../types/outlook';
import type { 
  OutlookImportProgress, 
  ImportedOutlookEmail,
  OutlookMessage
} from '../types/outlook';
import type { ParsedAttachment } from '../types/attachment';

interface OutlookImportProps {
  onImportComplete: (emails: ImportedOutlookEmail[], attachments: ParsedAttachment[]) => void;
  onError: (error: string) => void;
}

interface MessageListItem {
  id: string;
  subject: string;
  bodyPreview: string;
  from: string;
  date: string;
  hasAttachments: boolean;
}

export default function OutlookImport({ onImportComplete, onError }: OutlookImportProps) {
  const [state, setState] = useState<OutlookImportState>(OutlookImportState.IDLE);
  const [progress, setProgress] = useState<OutlookImportProgress>({
    state: OutlookImportState.IDLE,
    message: 'Ready to connect to Outlook'
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadUserProfile = useCallback(async () => {
    try {
      const account = getCurrentAccount();
      if (account) {
        setUserEmail(account.username);
      } else {
        const profile = await getUserProfile();
        setUserEmail(profile.mail || profile.userPrincipalName);
      }
    } catch (error) {
      console.warn('Failed to load user profile:', error);
      // Not critical, continue without profile
    }
  }, []);

  // Initialize MSAL on component mount
  useEffect(() => {
    const initMsal = async () => {
      try {
        await initializeMsal();
        setIsInitialized(true);
        
        // Check if user is already authenticated
        if (isAuthenticated()) {
          setState(OutlookImportState.AUTHENTICATED);
          setProgress({
            state: OutlookImportState.AUTHENTICATED,
            message: 'Connected to Outlook'
          });
          await loadUserProfile();
        }
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
        onError('Failed to initialize Outlook authentication');
      }
    };

    initMsal();
  }, [onError, loadUserProfile]);

  const handleSignIn = useCallback(async () => {
    if (!isInitialized) {
      onError('Outlook authentication not initialized');
      return;
    }

    setState(OutlookImportState.AUTHENTICATING);
    setProgress({
      state: OutlookImportState.AUTHENTICATING,
      message: 'Connecting to Outlook...',
      progress: 20
    });

    try {
      await signInWithPopup();
      
      setState(OutlookImportState.AUTHENTICATED);
      setProgress({
        state: OutlookImportState.AUTHENTICATED,
        message: 'Successfully connected to Outlook',
        progress: 100
      });

      await loadUserProfile();
    } catch (error) {
      console.error('Authentication failed:', error);
      setState(OutlookImportState.ERROR);
      setProgress({
        state: OutlookImportState.ERROR,
        message: 'Authentication failed'
      });
      onError(`Failed to connect to Outlook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isInitialized, onError, loadUserProfile]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setState(OutlookImportState.IDLE);
      setProgress({
        state: OutlookImportState.IDLE,
        message: 'Ready to connect to Outlook'
      });
      setUserEmail(null);
      setMessages([]);
      setSelectedMessageId(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      onError('Failed to sign out from Outlook');
    }
  }, [onError]);

  const handleFetchMessages = useCallback(async () => {
    setState(OutlookImportState.FETCHING_MESSAGES);
    setProgress({
      state: OutlookImportState.FETCHING_MESSAGES,
      message: 'Fetching recent messages...',
      progress: 30
    });

    try {
      const response = await listMessages({
        top: 50,
        select: ['id', 'subject', 'bodyPreview', 'from', 'receivedDateTime', 'hasAttachments']
      });

      const messageItems: MessageListItem[] = response.value.map(msg => ({
        id: msg.id,
        subject: msg.subject || '(No Subject)',
        bodyPreview: msg.bodyPreview || '',
        from: msg.from?.emailAddress?.address || 'Unknown',
        date: new Date(msg.receivedDateTime).toLocaleString('en-GB'),
        hasAttachments: msg.hasAttachments || false
      }));

      setMessages(messageItems);
      setState(OutlookImportState.SELECTING_MESSAGE);
      setProgress({
        state: OutlookImportState.SELECTING_MESSAGE,
        message: `Found ${messageItems.length} recent messages`,
        progress: 60
      });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setState(OutlookImportState.ERROR);
      setProgress({
        state: OutlookImportState.ERROR,
        message: 'Failed to fetch messages'
      });
      onError(`Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [onError]);

  const handleImportMessage = useCallback(async (messageId: string) => {
    if (!messageId) return;

    setState(OutlookImportState.IMPORTING_MESSAGE);
    setProgress({
      state: OutlookImportState.IMPORTING_MESSAGE,
      message: 'Importing selected message...',
      progress: 80
    });

    try {
      // Get the full message with attachments
      const message: OutlookMessage = await getMessage(messageId);
      
      // Convert to standardised format
      const importedEmail = convertMessageToEmail(message);
      
      // Parse attachments if any
      const parsedAttachments: ParsedAttachment[] = [];
      
      for (const attachment of importedEmail.attachments) {
        try {
          const parsed = await parseAttachments([{
            name: attachment.filename,
            type: attachment.mimeType,
            size: attachment.size,
            lastModified: Date.now(),
            // Convert Uint8Array back to File-like object
            arrayBuffer: () => Promise.resolve(new Uint8Array(attachment.content).buffer),
            text: () => Promise.resolve(''),
            stream: () => new ReadableStream()
          } as File]);
          
          parsedAttachments.push(...parsed);
        } catch (error) {
          console.warn(`Failed to parse attachment ${attachment.filename}:`, error);
          // Continue with other attachments
        }
      }

      setState(OutlookImportState.COMPLETED);
      setProgress({
        state: OutlookImportState.COMPLETED,
        message: 'Import completed successfully',
        progress: 100
      });

      onImportComplete([importedEmail], parsedAttachments);
    } catch (error) {
      console.error('Failed to import message:', error);
      setState(OutlookImportState.ERROR);
      setProgress({
        state: OutlookImportState.ERROR,
        message: 'Failed to import message'
      });
      onError(`Failed to import message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [onError, onImportComplete]);

  const renderContent = () => {
    if (!isInitialized) {
      return (
        <div className="text-center py-4">
          <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-orange-600 rounded-full" role="status" aria-label="Loading">
            <span className="sr-only">Initializing Outlook authentication...</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">Initializing Outlook authentication...</p>
        </div>
      );
    }

    switch (state) {
      case OutlookImportState.IDLE:
        return (
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              Connect to your Outlook account to import email threads and attachments.
            </p>
            <button
              onClick={handleSignIn}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Sign in with Microsoft
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Read-only access to your emails
            </p>
          </div>
        );

      case OutlookImportState.AUTHENTICATING:
        return (
          <div className="text-center py-4">
            <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-orange-600 rounded-full" role="status" aria-label="Loading">
              <span className="sr-only">Connecting to Outlook...</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">Connecting to Outlook...</p>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress || 0}%` }}
              />
            </div>
          </div>
        );

      case OutlookImportState.AUTHENTICATED:
        return (
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium mb-2">Connected to Outlook</p>
            {userEmail && (
              <p className="text-sm text-gray-600 mb-4">{userEmail}</p>
            )}
            <div className="space-y-2">
              <button
                onClick={handleFetchMessages}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Fetch Recent Messages
              </button>
              <button
                onClick={handleSignOut}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        );

      case OutlookImportState.FETCHING_MESSAGES:
        return (
          <div className="text-center py-4">
            <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-orange-600 rounded-full" role="status" aria-label="Loading">
              <span className="sr-only">Fetching messages...</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">Fetching recent messages...</p>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress || 0}%` }}
              />
            </div>
          </div>
        );

      case OutlookImportState.SELECTING_MESSAGE:
        return (
          <div>
            <div className="mb-4 text-center">
              <p className="font-medium text-gray-800 mb-2">Select a message to import</p>
              <p className="text-sm text-gray-600">Choose an email to analyse and generate drafts</p>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMessageId === message.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMessageId(message.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {message.subject}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        From: {message.from}
                      </div>
                      <div className="text-xs text-gray-500">
                        {message.date}
                      </div>
                      {message.bodyPreview && (
                        <div className="text-xs text-gray-600 mt-1 truncate">
                          {message.bodyPreview}
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {message.hasAttachments && (
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => selectedMessageId && handleImportMessage(selectedMessageId)}
                disabled={!selectedMessageId}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Import Selected Message
              </button>
              <button
                onClick={() => {
                  setState(OutlookImportState.AUTHENTICATED);
                  setMessages([]);
                  setSelectedMessageId(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        );

      case OutlookImportState.IMPORTING_MESSAGE:
        return (
          <div className="text-center py-4">
            <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-orange-600 rounded-full" role="status" aria-label="Loading">
              <span className="sr-only">Importing message...</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">Importing message and attachments...</p>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress || 0}%` }}
              />
            </div>
          </div>
        );

      case OutlookImportState.COMPLETED:
        return (
          <div className="text-center py-4">
            <div className="mb-4">
              <svg className="mx-auto h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium mb-2">Import completed successfully!</p>
            <p className="text-sm text-gray-600">Redirecting to analysis...</p>
          </div>
        );

      case OutlookImportState.ERROR:
        return (
          <div className="text-center py-4">
            <div className="mb-4">
              <svg className="mx-auto h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-2">Import failed</p>
            <p className="text-sm text-gray-600 mb-4">{progress.message}</p>
            <button
              onClick={() => {
                setState(OutlookImportState.IDLE);
                setProgress({
                  state: OutlookImportState.IDLE,
                  message: 'Ready to connect to Outlook'
                });
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
    </div>
  );
}