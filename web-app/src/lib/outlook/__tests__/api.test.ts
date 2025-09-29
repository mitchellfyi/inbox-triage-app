/**
 * @jest-environment jsdom
 */

import { convertMessageToEmail } from '../api';
import type { OutlookMessage } from '../../../types/outlook';

describe('Outlook API', () => {
  describe('convertMessageToEmail', () => {
    it('should convert Outlook message to email format', () => {
      const outlookMessage: OutlookMessage = {
        id: 'message123',
        subject: 'Test Subject',
        bodyPreview: 'Test preview',
        body: {
          contentType: 'text',
          content: 'This is a test message body.'
        },
        sender: {
          emailAddress: {
            name: 'John Sender',
            address: 'john@sender.com'
          }
        },
        from: {
          emailAddress: {
            name: 'John Sender',
            address: 'john@sender.com'
          }
        },
        toRecipients: [
          {
            emailAddress: {
              name: 'Jane Recipient',
              address: 'jane@recipient.com'
            }
          }
        ],
        ccRecipients: [
          {
            emailAddress: {
              name: 'Bob CC',
              address: 'bob@cc.com'
            }
          }
        ],
        receivedDateTime: '2024-01-15T10:30:00Z',
        conversationId: 'conv123',
        internetMessageId: 'msg123',
        hasAttachments: false
      };

      const result = convertMessageToEmail(outlookMessage);

      expect(result.subject).toBe('Test Subject');
      expect(result.from).toBe('john@sender.com');
      expect(result.to).toEqual(['jane@recipient.com']);
      expect(result.cc).toEqual(['bob@cc.com']);
      expect(result.body).toBe('This is a test message body.');
      expect(result.conversationId).toBe('conv123');
      expect(result.messageId).toBe('message123');
      expect(result.attachments).toEqual([]);
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should handle HTML content type', () => {
      const outlookMessage: OutlookMessage = {
        id: 'message123',
        subject: 'HTML Test',
        bodyPreview: 'HTML preview',
        body: {
          contentType: 'html',
          content: '<p>This is <strong>HTML</strong> content with &amp; entities.</p>'
        },
        sender: {
          emailAddress: {
            name: 'John Sender',
            address: 'john@sender.com'
          }
        },
        from: {
          emailAddress: {
            name: 'John Sender',
            address: 'john@sender.com'
          }
        },
        toRecipients: [
          {
            emailAddress: {
              name: 'Jane Recipient',
              address: 'jane@recipient.com'
            }
          }
        ],
        receivedDateTime: '2024-01-15T10:30:00Z',
        conversationId: 'conv123',
        internetMessageId: 'msg123',
        hasAttachments: false
      };

      const result = convertMessageToEmail(outlookMessage);

      expect(result.body).toBe('This is HTML content with & entities.');
    });

    it('should handle messages with no subject', () => {
      const outlookMessage: OutlookMessage = {
        id: 'message123',
        subject: '',
        bodyPreview: 'No subject preview',
        body: {
          contentType: 'text',
          content: 'Message with no subject.'
        },
        sender: {
          emailAddress: {
            name: 'John Sender',
            address: 'john@sender.com'
          }
        },
        from: {
          emailAddress: {
            name: 'John Sender',
            address: 'john@sender.com'
          }
        },
        toRecipients: [
          {
            emailAddress: {
              name: 'Jane Recipient',
              address: 'jane@recipient.com'
            }
          }
        ],
        receivedDateTime: '2024-01-15T10:30:00Z',
        conversationId: 'conv123',
        internetMessageId: 'msg123',
        hasAttachments: false
      };

      const result = convertMessageToEmail(outlookMessage);

      expect(result.subject).toBe('(No Subject)');
    });

    it('should handle messages with attachments', () => {
      const outlookMessage: OutlookMessage = {
        id: 'message123',
        subject: 'With Attachments',
        bodyPreview: 'Has attachments',
        body: {
          contentType: 'text',
          content: 'Message with attachments.'
        },
        sender: {
          emailAddress: {
            name: 'John Sender',
            address: 'john@sender.com'
          }
        },
        from: {
          emailAddress: {
            name: 'John Sender',
            address: 'john@sender.com'
          }
        },
        toRecipients: [
          {
            emailAddress: {
              name: 'Jane Recipient',
              address: 'jane@recipient.com'
            }
          }
        ],
        receivedDateTime: '2024-01-15T10:30:00Z',
        conversationId: 'conv123',
        internetMessageId: 'msg123',
        hasAttachments: true,
        attachments: [
          {
            id: 'att1',
            name: 'test.pdf',
            contentType: 'application/pdf',
            size: 1024,
            contentBytes: 'VGVzdCBQREYgY29udGVudA==', // "Test PDF content" in base64
            '@odata.type': '#microsoft.graph.fileAttachment'
          }
        ]
      };

      const result = convertMessageToEmail(outlookMessage);

      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].filename).toBe('test.pdf');
      expect(result.attachments[0].mimeType).toBe('application/pdf');
      expect(result.attachments[0].size).toBe(1024);
      expect(result.attachments[0].content).toBeInstanceOf(Uint8Array);
    });
  });
});