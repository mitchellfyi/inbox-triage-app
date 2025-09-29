/**
 * @jest-environment jsdom
 */

import { listThreads, getThread, getMessage, getUserProfile } from '../api';
import * as gmailOauth from '../../auth/gmail-oauth';
import type { GmailThread, GmailMessage } from '../../../types/gmail';

// Mock the OAuth module
jest.mock('../../auth/gmail-oauth');
const mockGetValidAccessToken = gmailOauth.getValidAccessToken as jest.MockedFunction<typeof gmailOauth.getValidAccessToken>;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Gmail API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValidAccessToken.mockResolvedValue('test-access-token');
  });

  describe('Authentication', () => {
    it('should throw error when no valid access token is available', async () => {
      mockGetValidAccessToken.mockResolvedValue(null);

      await expect(listThreads()).rejects.toThrow(
        'No valid access token available. Please authenticate first.'
      );
    });

    it('should include authorization header in requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ threads: [] })
      });

      await listThreads();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gmail.googleapis.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-access-token'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: () => Promise.resolve(JSON.stringify({
          error: { message: 'Insufficient permissions' }
        }))
      });

      await expect(listThreads()).rejects.toThrow('Insufficient permissions');
    });

    it('should handle malformed error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Invalid JSON')
      });

      await expect(listThreads()).rejects.toThrow(
        'Gmail API request failed: 500 Internal Server Error'
      );
    });
  });

  describe('listThreads', () => {
    const mockThreadsResponse = {
      threads: [
        { id: 'thread-1', snippet: 'Test snippet 1', historyId: '123' },
        { id: 'thread-2', snippet: 'Test snippet 2', historyId: '124' }
      ],
      nextPageToken: 'next-page-token',
      resultSizeEstimate: 2
    };

    it('should list threads successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockThreadsResponse)
      });

      const result = await listThreads(10);

      expect(result).toEqual({
        data: mockThreadsResponse.threads,
        nextPageToken: 'next-page-token',
        resultSizeEstimate: 2
      });
    });

    it('should handle query parameter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ threads: [] })
      });

      await listThreads(10, 'from:test@example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=from%3Atest%40example.com'),
        expect.any(Object)
      );
    });

    it('should handle pagination', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ threads: [] })
      });

      await listThreads(10, undefined, 'page-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('pageToken=page-token'),
        expect.any(Object)
      );
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });

      const result = await listThreads();

      expect(result).toEqual({
        data: [],
        nextPageToken: undefined,
        resultSizeEstimate: undefined
      });
    });
  });

  describe('getThread', () => {
    const mockThread: GmailThread = {
      id: 'thread-1',
      snippet: 'Test thread snippet',
      historyId: '123',
      messages: [
        {
          id: 'msg-1',
          threadId: 'thread-1',
          snippet: 'Test message',
          internalDate: '1672531200000',
          payload: {
            partId: '',
            mimeType: 'multipart/mixed',
            filename: '',
            headers: [
              { name: 'Subject', value: 'Test Subject' },
              { name: 'From', value: 'test@example.com' }
            ],
            body: { size: 0 },
            parts: []
          }
        }
      ]
    };

    it('should get thread details successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockThread)
      });

      const result = await getThread('thread-1');

      expect(result).toEqual(mockThread);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/threads/thread-1?format=full'),
        expect.any(Object)
      );
    });
  });

  describe('getMessage', () => {
    const mockMessage: GmailMessage = {
      id: 'msg-1',
      threadId: 'thread-1',
      snippet: 'Test message',
      internalDate: '1672531200000',
      payload: {
        partId: '',
        mimeType: 'text/plain',
        filename: '',
        headers: [
          { name: 'Subject', value: 'Test Subject' }
        ],
        body: {
          size: 10,
          data: 'VGVzdCBtZXNzYWdl' // base64url for "Test message"
        }
      }
    };

    it('should get message successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessage)
      });

      const result = await getMessage('msg-1');

      expect(result).toEqual(mockMessage);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/messages/msg-1?format=full'),
        expect.any(Object)
      );
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockProfile = { emailAddress: 'user@example.com' };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProfile)
      });

      const result = await getUserProfile();

      expect(result).toEqual(mockProfile);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/profile'),
        expect.any(Object)
      );
    });
  });
});