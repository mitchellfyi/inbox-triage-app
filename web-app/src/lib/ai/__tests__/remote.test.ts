/**
 * Tests for remote AI API integration
 */

import { summariseRemote, draftRemote, testCustomModelKey } from '../remote';
import type { CustomModelKey } from '../../../types/preferences';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Remote AI API Integration', () => {
  const testKey: CustomModelKey = {
    id: 'test-key-1',
    name: 'Test Gemini Key',
    provider: 'gemini',
    apiKey: 'test_api_key_12345',
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('summariseRemote', () => {
    it('should successfully summarise text using Gemini API', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '{"tldr": "Test summary", "keyPoints": ["Point 1", "Point 2"]}'
            }]
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await summariseRemote('Test email content', testKey);

      expect(result).toEqual({
        tldr: 'Test summary',
        keyPoints: ['Point 1', 'Point 2'],
        usedRemote: true,
        provider: 'gemini'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should handle OpenAI API calls', async () => {
      const openaiKey: CustomModelKey = { ...testKey, provider: 'openai' };
      const mockResponse = {
        choices: [{
          message: {
            content: '{"tldr": "OpenAI summary", "keyPoints": ["Point A", "Point B"]}'
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await summariseRemote('Test email', openaiKey);

      expect(result.provider).toBe('openai');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_api_key_12345'
          })
        })
      );
    });

    it('should handle Anthropic API calls', async () => {
      const anthropicKey: CustomModelKey = { ...testKey, provider: 'anthropic' };
      const mockResponse = {
        content: [{
          text: '{"tldr": "Claude summary", "keyPoints": ["Point X", "Point Y"]}'
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await summariseRemote('Test email', anthropicKey);

      expect(result.provider).toBe('anthropic');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test_api_key_12345'
          })
        })
      );
    });

    it('should throw error for invalid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      } as Response);

      await expect(summariseRemote('Test email', testKey))
        .rejects
        .toMatchObject({
          code: 'INVALID_KEY',
          userMessage: expect.stringContaining('Invalid API key')
        });
    });

    it('should throw error for empty input', async () => {
      await expect(summariseRemote('', testKey))
        .rejects
        .toThrow('Empty input text for summarisation');
    });

    it('should throw error for empty API key', async () => {
      const emptyKey = { ...testKey, apiKey: '' };
      
      await expect(summariseRemote('Test email', emptyKey))
        .rejects
        .toThrow('Empty API key');
    });
  });

  describe('draftRemote', () => {
    it('should generate drafts using custom key', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                drafts: [
                  { subject: 'Re: Test', body: 'Draft 1' },
                  { subject: 'Re: Test 2', body: 'Draft 2' },
                  { subject: 'Re: Test 3', body: 'Draft 3' }
                ]
              })
            }]
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await draftRemote('Test email', testKey, 'friendly', 'Be helpful');

      expect(result).toEqual({
        drafts: [
          { subject: 'Re: Test', body: 'Draft 1' },
          { subject: 'Re: Test 2', body: 'Draft 2' },
          { subject: 'Re: Test 3', body: 'Draft 3' }
        ],
        usedRemote: true,
        provider: 'gemini'
      });
    });

    it('should handle invalid draft response structure', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '{"drafts": [{"subject": "Re: Test"}]}' // Missing body
            }]
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await expect(draftRemote('Test email', testKey))
        .rejects
        .toMatchObject({
          userMessage: expect.stringContaining('API error')
        });
    });
  });

  describe('testCustomModelKey', () => {
    it('should return true for valid key', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '{"tldr": "Test works", "keyPoints": ["Success"]}'
            }]
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await testCustomModelKey(testKey);
      expect(result).toBe(true);
    });

    it('should return false for invalid key', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await testCustomModelKey(testKey);
      expect(result).toBe(false);
    });
  });
});