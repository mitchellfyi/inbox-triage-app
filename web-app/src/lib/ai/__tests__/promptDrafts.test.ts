/**
 * Tests for Chrome LanguageModel (Prompt) API wrapper
 */

import {
  generateDrafts,
  checkPromptAvailability,
  PromptAvailability,
  type DraftTone
} from '../promptDrafts';

// Mock the Chrome AI API
const mockSession = {
  prompt: jest.fn(),
  destroy: jest.fn()
};

const mockLanguageModel = {
  capabilities: jest.fn(),
  create: jest.fn()
};

const mockAI = {
  languageModel: mockLanguageModel
};

// Mock window.ai
Object.defineProperty(window, 'ai', {
  writable: true,
  value: mockAI
});

describe('checkPromptAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns readily available when API supports it', async () => {
    mockLanguageModel.capabilities.mockResolvedValue({ available: 'readily' });
    
    const result = await checkPromptAvailability();
    
    expect(result).toBe(PromptAvailability.READILY_AVAILABLE);
    expect(mockLanguageModel.capabilities).toHaveBeenCalledTimes(1);
  });

  it('returns after download when model needs downloading', async () => {
    mockLanguageModel.capabilities.mockResolvedValue({ available: 'after-download' });
    
    const result = await checkPromptAvailability();
    
    expect(result).toBe(PromptAvailability.AFTER_DOWNLOAD);
  });

  it('returns unavailable when API is not present', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).ai = undefined;
    
    const result = await checkPromptAvailability();
    
    expect(result).toBe(PromptAvailability.UNAVAILABLE);
    
    // Restore for other tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).ai = mockAI;
  });

  it('returns unavailable on error', async () => {
    mockLanguageModel.capabilities.mockRejectedValue(new Error('Network error'));
    
    const result = await checkPromptAvailability();
    
    expect(result).toBe(PromptAvailability.UNAVAILABLE);
  });
});

describe('generateDrafts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguageModel.capabilities.mockResolvedValue({ available: 'readily' });
    mockLanguageModel.create.mockResolvedValue(mockSession);
  });

  const validResponse = {
    drafts: [
      {
        subject: 'Re: Meeting Tomorrow',
        body: 'Dear John,\n\nThank you for the invitation. I will attend.\n\nBest regards,\nAlice'
      },
      {
        subject: 'Re: Meeting Tomorrow',
        body: 'Dear John,\n\nThank you for the meeting invitation. I confirm my attendance and look forward to discussing the project details.\n\nBest regards,\nAlice'
      },
      {
        subject: 'Re: Meeting Tomorrow',
        body: 'Dear John,\n\nThank you for the meeting invitation. I confirm my attendance for tomorrow\'s session. I have reviewed the agenda and prepared some questions about the project timeline and resource allocation that I\'d like to discuss.\n\nBest regards,\nAlice'
      }
    ]
  };

  it('generates drafts successfully with default parameters', async () => {
    mockSession.prompt.mockResolvedValue(JSON.stringify(validResponse));
    
    const result = await generateDrafts('Meeting tomorrow at 3pm. Please confirm.');
    
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      subject: 'Re: Meeting Tomorrow',
      body: 'Dear John,\n\nThank you for the invitation. I will attend.\n\nBest regards,\nAlice'
    });
    expect(mockSession.destroy).toHaveBeenCalledTimes(1);
  });

  it('generates drafts with custom tone and guidance', async () => {
    mockSession.prompt.mockResolvedValue(JSON.stringify(validResponse));
    
    const result = await generateDrafts(
      'Meeting tomorrow at 3pm. Please confirm.',
      'friendly',
      'Ask about the agenda'
    );
    
    expect(result).toHaveLength(3);
    expect(mockLanguageModel.create).toHaveBeenCalledWith({
      systemPrompt: expect.stringContaining('warm and approachable'),
      temperature: 0.7
    });
    expect(mockSession.prompt).toHaveBeenCalledWith(
      expect.stringContaining('Meeting tomorrow at 3pm'),
      { responseConstraint: expect.any(String) }
    );
  });

  it('validates all tone options work', async () => {
    mockSession.prompt.mockResolvedValue(JSON.stringify(validResponse));
    
    const tones: DraftTone[] = ['neutral', 'friendly', 'assertive', 'formal'];
    
    for (const tone of tones) {
      await generateDrafts('Test message', tone);
      expect(mockLanguageModel.create).toHaveBeenCalledWith({
        systemPrompt: expect.any(String),
        temperature: 0.7
      });
    }
    
    expect(mockLanguageModel.create).toHaveBeenCalledTimes(4);
  });

  it('throws error for empty input', async () => {
    try {
      await generateDrafts('');
      fail('Should have thrown');
    } catch (error: unknown) {
      const err = error as { userMessage: string; code: string };
      expect(err.userMessage).toContain('generate drafts');
      expect(err.code).toBe('UNKNOWN');
    }
  });

  it('throws error when API is unavailable', async () => {
    mockLanguageModel.capabilities.mockResolvedValue({ available: 'no' });
    
    try {
      await generateDrafts('Test message');
      fail('Should have thrown');
    } catch (error: unknown) {
      const err = error as { userMessage: string; code: string };
      expect(err.userMessage).toContain('unavailable');
      expect(err.code).toBe('UNAVAILABLE');
    }
  });

  it('handles invalid JSON response', async () => {
    mockSession.prompt.mockResolvedValue('invalid json response');
    
    try {
      await generateDrafts('Test message');
      fail('Should have thrown');
    } catch (error: unknown) {
      const err = error as { userMessage: string; code: string };
      expect(err.userMessage).toContain('structured drafts');
      expect(err.code).toBe('INVALID_JSON');
    }
  });

  it('handles invalid response structure - wrong number of drafts', async () => {
    const invalidResponse = {
      drafts: [
        { subject: 'Re: Test', body: 'Test body' }
      ]
    };
    mockSession.prompt.mockResolvedValue(JSON.stringify(invalidResponse));
    
    try {
      await generateDrafts('Test message');
      fail('Should have thrown');
    } catch (error: unknown) {
      const err = error as { userMessage: string; code: string };
      expect(err.userMessage).toContain('structured drafts');
      expect(err.code).toBe('INVALID_JSON');
    }
  });

  it('handles invalid draft structure - missing fields', async () => {
    const invalidResponse = {
      drafts: [
        { subject: 'Re: Test' }, // missing body
        { body: 'Test body' }, // missing subject
        { subject: 'Re: Test', body: 'Test body' }
      ]
    };
    mockSession.prompt.mockResolvedValue(JSON.stringify(invalidResponse));
    
    try {
      await generateDrafts('Test message');
      fail('Should have thrown');
    } catch (error: unknown) {
      const err = error as { userMessage: string; code: string };
      expect(err.userMessage).toContain('structured drafts');
      expect(err.code).toBe('INVALID_JSON');
    }
  });

  it('handles token limit errors appropriately', async () => {
    mockSession.prompt.mockRejectedValue(new Error('token limit exceeded'));
    
    try {
      await generateDrafts('Test message');
      fail('Should have thrown');
    } catch (error: unknown) {
      const err = error as { userMessage: string; code: string };
      expect(err.userMessage).toContain('too long for draft generation');
      expect(err.code).toBe('TOKEN_LIMIT');
    }
  });

  it('handles network errors appropriately', async () => {
    mockSession.prompt.mockRejectedValue(new Error('network connection failed'));
    
    try {
      await generateDrafts('Test message');
      fail('Should have thrown');
    } catch (error: unknown) {
      const err = error as { userMessage: string; code: string };
      expect(err.userMessage).toContain('Network error');
      expect(err.code).toBe('NETWORK_ERROR');
    }
  });

  it('always destroys the session even on errors', async () => {
    mockSession.prompt.mockRejectedValue(new Error('Some error'));
    
    try {
      await generateDrafts('Test message');
      fail('Should have thrown');
    } catch {
      // Expected to throw
    }
    
    expect(mockSession.destroy).toHaveBeenCalledTimes(1);
  });

  it('trims whitespace from subject and body', async () => {
    const responseWithWhitespace = {
      drafts: [
        { subject: '  Re: Test  ', body: '  Dear John,\n\nTest body.\n\nBest,\nAlice  ' },
        { subject: 'Re: Test', body: 'Dear John,\n\nTest body.\n\nBest,\nAlice' },
        { subject: 'Re: Test', body: 'Dear John,\n\nTest body.\n\nBest,\nAlice' }
      ]
    };
    mockSession.prompt.mockResolvedValue(JSON.stringify(responseWithWhitespace));
    
    const result = await generateDrafts('Test message');
    
    expect(result[0].subject).toBe('Re: Test');
    expect(result[0].body).toBe('Dear John,\n\nTest body.\n\nBest,\nAlice');
  });
});