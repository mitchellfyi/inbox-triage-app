/**
 * Type definitions for Gmail API integration and OAuth flows
 */

export interface GmailOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  expires_at: number; // Unix timestamp when token expires
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
}

export interface GmailThread {
  id: string;
  snippet: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload: GmailMessagePayload;
}

export interface GmailMessagePayload {
  partId: string;
  mimeType: string;
  filename: string;
  headers: GmailHeader[];
  body: GmailMessageBody;
  parts?: GmailMessagePayload[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessageBody {
  size: number;
  data?: string; // Base64url encoded
  attachmentId?: string;
}

export interface GmailAttachment {
  partId: string;
  filename: string;
  mimeType: string;
  size: number;
  data: string; // Base64url encoded content
}

export interface GmailListResponse<T> {
  resultSizeEstimate?: number;
  nextPageToken?: string;
  data: T[];
}

export interface ImportedEmail {
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  date: Date;
  body: string;
  attachments: ImportedAttachment[];
  threadId: string;
  messageId: string;
}

export interface ImportedAttachment {
  filename: string;
  mimeType: string;
  size: number;
  content: Uint8Array;
}

export interface GmailAuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  tokens: OAuthTokens | null;
  userEmail: string | null;
  error: string | null;
}

export enum GmailImportState {
  IDLE = 'idle',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  FETCHING_THREADS = 'fetching_threads',
  SELECTING_THREAD = 'selecting_thread',
  IMPORTING_THREAD = 'importing_thread',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface GmailImportProgress {
  state: GmailImportState;
  message: string;
  progress?: number; // 0-100 for progress indication
}