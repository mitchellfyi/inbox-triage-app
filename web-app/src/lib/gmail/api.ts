/**
 * Gmail API client for fetching threads, messages, and attachments
 */

import { getValidAccessToken } from '../auth/gmail-oauth';
import type { 
  GmailThread, 
  GmailMessage, 
  GmailListResponse,
  ImportedEmail,
  ImportedAttachment
} from '../../types/gmail';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

/**
 * Make authenticated request to Gmail API
 */
async function makeGmailApiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getValidAccessToken();
  
  if (!accessToken) {
    throw new Error('No valid access token available. Please authenticate first.');
  }
  
  const url = `${GMAIL_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Gmail API request failed: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Use default error message if JSON parsing fails
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * List email threads with optional query filtering
 */
export async function listThreads(
  maxResults: number = 10,
  query?: string,
  pageToken?: string
): Promise<GmailListResponse<{ id: string; snippet: string; historyId: string }>> {
  const params = new URLSearchParams({
    maxResults: maxResults.toString()
  });
  
  if (query) {
    params.append('q', query);
  }
  
  if (pageToken) {
    params.append('pageToken', pageToken);
  }
  
  const response = await makeGmailApiRequest<{
    threads?: { id: string; snippet: string; historyId: string }[];
    nextPageToken?: string;
    resultSizeEstimate?: number;
  }>(`/users/me/threads?${params.toString()}`);
  
  return {
    data: response.threads || [],
    nextPageToken: response.nextPageToken,
    resultSizeEstimate: response.resultSizeEstimate
  };
}

/**
 * Get detailed thread information including all messages
 */
export async function getThread(threadId: string): Promise<GmailThread> {
  const response = await makeGmailApiRequest<GmailThread>(
    `/users/me/threads/${threadId}?format=full`
  );
  
  return response;
}

/**
 * Get a specific message with full content
 */
export async function getMessage(messageId: string): Promise<GmailMessage> {
  const response = await makeGmailApiRequest<GmailMessage>(
    `/users/me/messages/${messageId}?format=full`
  );
  
  return response;
}

/**
 * Get attachment content by attachment ID
 */
export async function getAttachment(
  messageId: string, 
  attachmentId: string
): Promise<{ size: number; data: string }> {
  const response = await makeGmailApiRequest<{ size: number; data: string }>(
    `/users/me/messages/${messageId}/attachments/${attachmentId}`
  );
  
  return response;
}

/**
 * Decode base64url encoded content
 */
function decodeBase64Url(data: string): string {
  // Convert base64url to base64
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if necessary
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  
  try {
    return atob(padded);
  } catch (error) {
    console.error('Failed to decode base64url data:', error);
    return '';
  }
}

/**
 * Decode base64url to Uint8Array for binary content
 */
function decodeBase64UrlToBytes(data: string): Uint8Array {
  const decoded = decodeBase64Url(data);
  const bytes = new Uint8Array(decoded.length);
  
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Extract text content from message payload parts
 */
function extractTextContent(payload: GmailMessagePayload): string {
  let textContent = '';
  
  // If this part has body data directly
  if (payload.body?.data) {
    if (payload.mimeType?.startsWith('text/')) {
      textContent += decodeBase64Url(payload.body.data);
    }
  }
  
  // Recursively process parts
  if (payload.parts) {
    for (const part of payload.parts) {
      textContent += extractTextContent(part);
    }
  }
  
  return textContent;
}

/**
 * Extract header value by name
 */
function getHeaderValue(headers: Array<{ name: string; value: string }>, name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

/**
 * Parse email addresses from header value
 */
function parseEmailAddresses(headerValue: string): string[] {
  if (!headerValue) return [];
  
  // Simple email extraction - in production, consider using a proper email parser
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = headerValue.match(emailRegex);
  return matches || [];
}

/**
 * Extract attachments from message payload
 */
async function extractAttachments(
  messageId: string,
  payload: GmailMessagePayload,
  attachments: ImportedAttachment[] = []
): Promise<ImportedAttachment[]> {
  // Check if this part is an attachment
  if (payload.filename && payload.body?.attachmentId) {
    try {
      const attachmentData = await getAttachment(messageId, payload.body.attachmentId);
      const content = decodeBase64UrlToBytes(attachmentData.data);
      
      attachments.push({
        filename: payload.filename,
        mimeType: payload.mimeType || 'application/octet-stream',
        size: attachmentData.size,
        content
      });
    } catch (error) {
      console.error(`Failed to fetch attachment ${payload.filename}:`, error);
    }
  }
  
  // Recursively process parts
  if (payload.parts) {
    for (const part of payload.parts) {
      await extractAttachments(messageId, part, attachments);
    }
  }
  
  return attachments;
}

/**
 * Convert Gmail thread to standardised email format
 */
export async function convertThreadToEmail(thread: GmailThread): Promise<ImportedEmail[]> {
  const emails: ImportedEmail[] = [];
  
  for (const message of thread.messages) {
    try {
      const headers = message.payload.headers || [];
      const subject = getHeaderValue(headers, 'subject');
      const from = getHeaderValue(headers, 'from');
      const to = parseEmailAddresses(getHeaderValue(headers, 'to'));
      const cc = parseEmailAddresses(getHeaderValue(headers, 'cc'));
      const dateString = getHeaderValue(headers, 'date');
      
      // Parse date
      let date: Date;
      try {
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
          // Fallback to internal date if date header is invalid
          date = new Date(parseInt(message.internalDate));
        }
      } catch {
        date = new Date(parseInt(message.internalDate));
      }
      
      // Extract text content
      const body = extractTextContent(message.payload);
      
      // Extract attachments
      const attachments = await extractAttachments(message.id, message.payload);
      
      emails.push({
        subject,
        from,
        to,
        cc: cc.length > 0 ? cc : undefined,
        date,
        body,
        attachments,
        threadId: thread.id,
        messageId: message.id
      });
    } catch (error) {
      console.error('Error processing message:', error);
      // Continue processing other messages even if one fails
    }
  }
  
  return emails;
}

/**
 * Search for threads with a query
 */
export async function searchThreads(
  query: string,
  maxResults: number = 10
): Promise<GmailListResponse<{ id: string; snippet: string; historyId: string }>> {
  return listThreads(maxResults, query);
}

/**
 * Get user profile information
 */
export async function getUserProfile(): Promise<{ emailAddress: string }> {
  const response = await makeGmailApiRequest<{ emailAddress: string }>('/users/me/profile');
  return response;
}