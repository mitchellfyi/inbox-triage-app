/**
 * Microsoft Graph API client for fetching messages and attachments
 */

import { getValidAccessToken } from '../auth/outlook-oauth';
import type { 
  OutlookMessage, 
  OutlookAttachment,
  OutlookListResponse,
  ImportedOutlookEmail,
  ImportedOutlookAttachment,
  OutlookUser
} from '../../types/outlook';

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Make authenticated request to Microsoft Graph API
 */
async function makeGraphApiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getValidAccessToken();
  
  if (!accessToken) {
    throw new Error('No valid access token available. Please authenticate first.');
  }
  
  const url = `${GRAPH_API_BASE}${endpoint}`;
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
    let errorMessage = `Microsoft Graph API request failed: ${response.status} ${response.statusText}`;
    
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
 * Get current user profile information
 */
export async function getUserProfile(): Promise<OutlookUser> {
  return makeGraphApiRequest<OutlookUser>('/me?$select=id,displayName,mail,userPrincipalName');
}

/**
 * List messages from the inbox with basic information
 */
export async function listMessages(options: {
  top?: number;
  select?: string[];
  orderBy?: string;
} = {}): Promise<OutlookListResponse<OutlookMessage>> {
  const {
    top = 50,
    select = ['id', 'subject', 'bodyPreview', 'from', 'receivedDateTime', 'hasAttachments'],
    orderBy = 'receivedDateTime desc'
  } = options;

  const params = new URLSearchParams({
    '$top': top.toString(),
    '$select': select.join(','),
    '$orderby': orderBy
  });

  return makeGraphApiRequest<OutlookListResponse<OutlookMessage>>(
    `/me/mailFolders/inbox/messages?${params.toString()}`
  );
}

/**
 * Get a specific message by ID with full content
 */
export async function getMessage(messageId: string): Promise<OutlookMessage> {
  return makeGraphApiRequest<OutlookMessage>(
    `/me/messages/${messageId}?$expand=attachments`
  );
}

/**
 * Get attachments for a specific message
 */
export async function getAttachments(messageId: string): Promise<OutlookListResponse<OutlookAttachment>> {
  return makeGraphApiRequest<OutlookListResponse<OutlookAttachment>>(
    `/me/messages/${messageId}/attachments`
  );
}

/**
 * Download attachment content by ID
 */
export async function downloadAttachment(
  messageId: string, 
  attachmentId: string
): Promise<OutlookAttachment> {
  return makeGraphApiRequest<OutlookAttachment>(
    `/me/messages/${messageId}/attachments/${attachmentId}/$value`
  );
}

/**
 * Convert Outlook message to standardised email format
 */
export function convertMessageToEmail(message: OutlookMessage): ImportedOutlookEmail {
  // Extract plain text from HTML if needed
  let bodyText = message.body.content;
  if (message.body.contentType === 'html') {
    // Basic HTML to text conversion - remove tags
    bodyText = bodyText.replace(/<[^>]*>/g, '').trim();
    // Decode common HTML entities
    bodyText = bodyText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  const importedAttachments: ImportedOutlookAttachment[] = [];
  
  // Process attachments if they exist
  if (message.attachments) {
    for (const attachment of message.attachments) {
      if (attachment.contentBytes) {
        try {
          const contentBytes = atob(attachment.contentBytes);
          const uint8Array = new Uint8Array(contentBytes.length);
          for (let i = 0; i < contentBytes.length; i++) {
            uint8Array[i] = contentBytes.charCodeAt(i);
          }
          
          importedAttachments.push({
            filename: attachment.name,
            mimeType: attachment.contentType,
            size: attachment.size,
            content: uint8Array
          });
        } catch (error) {
          console.warn(`Failed to process attachment ${attachment.name}:`, error);
        }
      }
    }
  }

  return {
    subject: message.subject || '(No Subject)',
    from: message.from.emailAddress.address,
    to: message.toRecipients.map(recipient => recipient.emailAddress.address),
    cc: message.ccRecipients?.map(recipient => recipient.emailAddress.address),
    date: new Date(message.receivedDateTime),
    body: bodyText,
    attachments: importedAttachments,
    conversationId: message.conversationId,
    messageId: message.id
  };
}

/**
 * Get messages from a conversation/thread
 */
export async function getConversationMessages(conversationId: string): Promise<OutlookMessage[]> {
  const response = await makeGraphApiRequest<OutlookListResponse<OutlookMessage>>(
    `/me/messages?$filter=conversationId eq '${conversationId}'&$orderby=receivedDateTime asc&$expand=attachments`
  );
  
  return response.value;
}

/**
 * Convert multiple Outlook messages to email thread format
 */
export async function convertMessagesToThread(messages: OutlookMessage[]): Promise<ImportedOutlookEmail[]> {
  // Sort messages by date to maintain thread order
  const sortedMessages = messages.sort((a, b) => 
    new Date(a.receivedDateTime).getTime() - new Date(b.receivedDateTime).getTime()
  );

  return sortedMessages.map(convertMessageToEmail);
}