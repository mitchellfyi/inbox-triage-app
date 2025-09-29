/**
 * Type definitions for Outlook/Microsoft Graph API integration and OAuth flows
 */

export interface OutlookOAuthConfig {
  clientId: string;
  authority: string;
  redirectUri: string;
  scopes: string[];
}

export interface OutlookTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  expires_at: number; // Unix timestamp when token expires
}

export interface OutlookMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  body: {
    contentType: 'text' | 'html';
    content: string;
  };
  sender: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  receivedDateTime: string;
  conversationId: string;
  internetMessageId: string;
  hasAttachments: boolean;
  attachments?: OutlookAttachment[];
}

export interface OutlookAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string; // Base64 encoded content
  '@odata.type': string;
}

export interface OutlookListResponse<T> {
  '@odata.context'?: string;
  '@odata.nextLink'?: string;
  value: T[];
}

export interface ImportedOutlookEmail {
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  date: Date;
  body: string;
  attachments: ImportedOutlookAttachment[];
  conversationId: string;
  messageId: string;
}

export interface ImportedOutlookAttachment {
  filename: string;
  mimeType: string;
  size: number;
  content: Uint8Array;
}

export interface OutlookAuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  tokens: OutlookTokens | null;
  userEmail: string | null;
  error: string | null;
}

export enum OutlookImportState {
  IDLE = 'idle',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  FETCHING_MESSAGES = 'fetching_messages',
  SELECTING_MESSAGE = 'selecting_message',
  IMPORTING_MESSAGE = 'importing_message',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface OutlookImportProgress {
  state: OutlookImportState;
  message: string;
  progress?: number; // 0-100 for progress indication
}

export interface OutlookUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}