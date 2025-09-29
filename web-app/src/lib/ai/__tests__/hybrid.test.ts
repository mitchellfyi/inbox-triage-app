/**
 * Tests for hybrid AI processing decision logic
 */

import { makeHybridDecision, callHybridFallback } from '../hybrid';

// Mock the AI availability check functions
jest.mock('../summarizer', () => ({
  SummariserAvailability: {
    READILY_AVAILABLE: 'readily',
    AFTER_DOWNLOAD: 'after-download',
    UNAVAILABLE: 'no'
  },
  checkSummariserAvailability: jest.fn()
}));

jest.mock('../promptDrafts', () => ({
  PromptAvailability: {
    READILY_AVAILABLE: 'readily',
    AFTER_DOWNLOAD: 'after-download',
    UNAVAILABLE: 'no'
  },
  checkPromptAvailability: jest.fn()
}));

jest.mock('../multimodal', () => ({
  MultimodalAvailability: {
    READILY_AVAILABLE: 'readily',
    AFTER_DOWNLOAD: 'after-download',
    UNAVAILABLE: 'no'
  },
  checkMultimodalAvailability: jest.fn()
}));

// Mock fetch for API tests
global.fetch = jest.fn();

const mockCheckSummariserAvailability = jest.fn();
const mockCheckPromptAvailability = jest.fn();
const mockCheckMultimodalAvailability = jest.fn();

// Mocked enums
const SummariserAvailability = {
  READILY_AVAILABLE: 'readily',
  AFTER_DOWNLOAD: 'after-download', 
  UNAVAILABLE: 'no'
} as const;

const PromptAvailability = {
  READILY_AVAILABLE: 'readily',
  AFTER_DOWNLOAD: 'after-download',
  UNAVAILABLE: 'no'
} as const;

const MultimodalAvailability = {
  READILY_AVAILABLE: 'readily',
  AFTER_DOWNLOAD: 'after-download',
  UNAVAILABLE: 'no'
} as const;

// Set up the mocks
jest.doMock('../summarizer', () => ({
  SummariserAvailability,
  checkSummariserAvailability: mockCheckSummariserAvailability
}));

jest.doMock('../promptDrafts', () => ({
  PromptAvailability,
  checkPromptAvailability: mockCheckPromptAvailability
}));

jest.doMock('../multimodal', () => ({
  MultimodalAvailability,
  checkMultimodalAvailability: mockCheckMultimodalAvailability
}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('makeHybridDecision', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('on-device mode', () => {
    it('uses local processing when available and within limits', async () => {
      mockCheckSummariserAvailability.mockResolvedValue(SummariserAvailability.READILY_AVAILABLE);
      
      const decision = await makeHybridDecision({
        processingMode: 'on-device',
        contentText: 'Short text that should be processable locally',
        operationType: 'summarise'
      });

      expect(decision).toEqual({
        useLocal: true,
        reason: 'Using local processing as requested',
        canFallback: false
      });
    });

    it('rejects when model unavailable in on-device mode', async () => {
      mockCheckSummariserAvailability.mockResolvedValue(SummariserAvailability.UNAVAILABLE);
      
      const decision = await makeHybridDecision({
        processingMode: 'on-device',
        contentText: 'Some text',
        operationType: 'summarise'
      });

      expect(decision).toEqual({
        useLocal: false,
        reason: 'Local summarise model is not available on this device',
        canFallback: false
      });
    });

    it('rejects when content exceeds token limits in on-device mode', async () => {
      mockCheckSummariserAvailability.mockResolvedValue(SummariserAvailability.READILY_AVAILABLE);
      
      // Create text that exceeds the SUMMARIZER limit of 4000 chars
      const longText = 'a'.repeat(5000);
      
      const decision = await makeHybridDecision({
        processingMode: 'on-device',
        contentText: longText,
        operationType: 'summarise'
      });

      expect(decision.useLocal).toBe(false);
      expect(decision.canFallback).toBe(false);
      expect(decision.reason).toContain('too large for local summarise processing');
    });
  });

  describe('hybrid mode', () => {
    it('uses local processing when available and within limits', async () => {
      mockCheckPromptAvailability.mockResolvedValue(PromptAvailability.READILY_AVAILABLE);
      
      const decision = await makeHybridDecision({
        processingMode: 'hybrid',
        contentText: 'Short text for draft generation',
        operationType: 'draft'
      });

      expect(decision).toEqual({
        useLocal: true,
        reason: 'Local processing available and within limits',
        canFallback: true
      });
    });

    it('falls back to cloud when model unavailable', async () => {
      mockCheckPromptAvailability.mockResolvedValue(PromptAvailability.UNAVAILABLE);
      
      const decision = await makeHybridDecision({
        processingMode: 'hybrid',
        contentText: 'Text for processing',
        operationType: 'draft'
      });

      expect(decision.useLocal).toBe(false);
      expect(decision.canFallback).toBe(true);
      expect(decision.reason).toContain('local model is not available on this device');
    });

    it('falls back to cloud when content exceeds limits', async () => {
      mockCheckMultimodalAvailability.mockResolvedValue(MultimodalAvailability.READILY_AVAILABLE);
      
      // Create text that exceeds the MULTIMODAL limit of 6000 chars
      const longText = 'a'.repeat(7000);
      
      const decision = await makeHybridDecision({
        processingMode: 'hybrid',
        contentText: longText,
        operationType: 'multimodal'
      });

      expect(decision.useLocal).toBe(false);
      expect(decision.canFallback).toBe(true);
      expect(decision.reason).toContain('content exceeds local processing limits');
    });

    it('falls back to cloud when both model unavailable and content too large', async () => {
      mockCheckSummariserAvailability.mockResolvedValue(SummariserAvailability.UNAVAILABLE);
      
      const longText = 'a'.repeat(5000);
      
      const decision = await makeHybridDecision({
        processingMode: 'hybrid',
        contentText: longText,
        operationType: 'summarise'
      });

      expect(decision.useLocal).toBe(false);
      expect(decision.canFallback).toBe(true);
      expect(decision.reason).toContain('local model unavailable and content exceeds limits');
    });
  });

  describe('error handling', () => {
    it('handles availability check errors gracefully', async () => {
      mockCheckSummariserAvailability.mockRejectedValue(new Error('Network error'));
      
      const decision = await makeHybridDecision({
        processingMode: 'hybrid',
        contentText: 'Some text',
        operationType: 'summarise'
      });

      expect(decision.useLocal).toBe(false);
      expect(decision.canFallback).toBe(true);
      expect(decision.reason).toContain('local model is not available on this device');
    });
  });
});

describe('callHybridFallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully calls summarise endpoint', async () => {
    const mockResponse = {
      tldr: 'This is a test summary',
      keyPoints: ['Point 1', 'Point 2'],
      processed: true
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response);

    const result = await callHybridFallback('summarise', 'Test text content');

    expect(mockFetch).toHaveBeenCalledWith('/api/fallback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'summarise',
        text: 'Test text content',
        options: {}
      })
    });

    expect(result).toEqual(mockResponse);
  });

  it('successfully calls draft endpoint with options', async () => {
    const mockResponse = {
      drafts: [
        { subject: 'Re: Test', body: 'Test reply' }
      ],
      processed: true
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response);

    const result = await callHybridFallback('draft', 'Test email thread', {
      tone: 'friendly',
      guidance: 'Be polite'
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/fallback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'draft',
        text: 'Test email thread',
        options: {
          tone: 'friendly',
          guidance: 'Be polite'
        }
      })
    });

    expect(result).toEqual(mockResponse);
  });

  it('handles server errors appropriately', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' })
    } as Response);

    await expect(
      callHybridFallback('summarise', 'Test text')
    ).rejects.toThrow('Cloud processing failed: Internal server error');
  });

  it('handles network errors appropriately', async () => {
    mockFetch.mockRejectedValue(new Error('Network connection failed'));

    await expect(
      callHybridFallback('summarise', 'Test text')
    ).rejects.toThrow('Cloud processing failed: Network connection failed');
  });

  it('handles malformed server responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.reject(new Error('Invalid JSON'))
    } as Response);

    await expect(
      callHybridFallback('summarise', 'Test text')
    ).rejects.toThrow('Cloud processing failed: Unknown server error');
  });
});