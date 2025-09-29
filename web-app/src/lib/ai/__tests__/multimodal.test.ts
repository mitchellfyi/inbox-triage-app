/**
 * Unit tests for Chrome Language Model API wrapper (multimodal fallback)
 */
import { 
  askImageQuestion, 
  askImageQuestionWithSummary,
  checkMultimodalAvailability,
  MultimodalAvailability 
} from '../multimodal';

// Mock the Language Model API
const mockSession = {
  prompt: jest.fn(),
  destroy: jest.fn()
};

const mockAI = {
  languageModel: {
    capabilities: jest.fn(),
    create: jest.fn().mockResolvedValue(mockSession)
  }
};

// Mock the summarizer module
jest.mock('../summarizer', () => ({
  getTlDr: jest.fn().mockResolvedValue({ content: 'This is a summarised response.' })
}));

// Setup global mocks
beforeAll(() => {
  Object.defineProperty(window, 'ai', {
    value: mockAI,
    writable: true
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('checkMultimodalAvailability', () => {
  it('returns readily available when API is ready', async () => {
    mockAI.languageModel.capabilities.mockResolvedValue({ available: 'readily' });
    
    const result = await checkMultimodalAvailability();
    
    expect(result).toBe(MultimodalAvailability.READILY_AVAILABLE);
    expect(mockAI.languageModel.capabilities).toHaveBeenCalled();
  });

  it('returns after download when model needs downloading', async () => {
    mockAI.languageModel.capabilities.mockResolvedValue({ available: 'after-download' });
    
    const result = await checkMultimodalAvailability();
    
    expect(result).toBe(MultimodalAvailability.AFTER_DOWNLOAD);
  });

  it('returns unavailable when API is not supported', async () => {
    mockAI.languageModel.capabilities.mockResolvedValue({ available: 'no' });
    
    const result = await checkMultimodalAvailability();
    
    expect(result).toBe(MultimodalAvailability.UNAVAILABLE);
  });

  it('handles missing AI API gracefully', async () => {
    Object.defineProperty(window, 'ai', { value: undefined, writable: true });
    
    const result = await checkMultimodalAvailability();
    
    expect(result).toBe(MultimodalAvailability.UNAVAILABLE);
    
    // Restore mock
    Object.defineProperty(window, 'ai', { value: mockAI, writable: true });
  });

  it('handles API errors gracefully', async () => {
    mockAI.languageModel.capabilities.mockRejectedValue(new Error('Network error'));
    
    const result = await checkMultimodalAvailability();
    
    expect(result).toBe(MultimodalAvailability.UNAVAILABLE);
  });
});

describe('askImageQuestion', () => {
  const createTestImage = (type = 'image/png') => {
    return new Blob(['test image content'], { type });
  };

  beforeEach(() => {
    mockAI.languageModel.capabilities.mockResolvedValue({ available: 'readily' });
  });

  it('successfully processes image question', async () => {
    const testImage = createTestImage();
    const testQuestion = 'What do you see in this image?';
    const expectedResponse = 'I understand you want to analyze an image, but Chrome\'s built-in AI APIs don\'t currently support direct image analysis in the stable release. Here are some alternative approaches...';
    
    mockSession.prompt.mockResolvedValue(expectedResponse);
    
    const result = await askImageQuestion(testImage, testQuestion);
    
    expect(result).toBe(expectedResponse);
    expect(mockAI.languageModel.create).toHaveBeenCalledWith({
      systemPrompt: expect.stringContaining('helpful assistant'),
      temperature: 0.3
    });
    expect(mockSession.prompt).toHaveBeenCalledWith(
      expect.stringContaining(testQuestion)
    );
    expect(mockSession.destroy).toHaveBeenCalled();
  });

  it('validates image input', async () => {
    const testQuestion = 'What is this?';
    
    // Test with null image
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(askImageQuestion(null as any, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('image'),
        code: 'UNKNOWN'
      });
    
    // Test with empty blob
    const emptyBlob = new Blob([]);
    await expect(askImageQuestion(emptyBlob, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('image'),
        code: 'UNKNOWN'
      });
  });

  it('validates question input', async () => {
    const testImage = createTestImage();
    
    // Test with empty question
    await expect(askImageQuestion(testImage, ''))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('question'),
        code: 'UNKNOWN'
      });
    
    // Test with null question
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(askImageQuestion(testImage, null as any))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('question'),
        code: 'UNKNOWN'
      });
  });

  it('validates image format', async () => {
    const testQuestion = 'What is this?';
    
    // Test with unsupported format
    const unsupportedImage = new Blob(['content'], { type: 'image/gif' });
    await expect(askImageQuestion(unsupportedImage, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('Direct image analysis is not currently supported'),
        code: 'UNSUPPORTED_FORMAT'
      });
    
    // Test with non-image format
    const textFile = new Blob(['content'], { type: 'text/plain' });
    await expect(askImageQuestion(textFile, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('Direct image analysis is not currently supported'),
        code: 'UNSUPPORTED_FORMAT'
      });
  });

  it('supports all expected image formats', async () => {
    const testQuestion = 'What is this?';
    const expectedResponse = 'Test response explaining limitations';
    mockSession.prompt.mockResolvedValue(expectedResponse);
    
    const formats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    
    for (const format of formats) {
      const testImage = createTestImage(format);
      const result = await askImageQuestion(testImage, testQuestion);
      expect(result).toBe(expectedResponse);
    }
  });

  it('handles API unavailability', async () => {
    mockAI.languageModel.capabilities.mockResolvedValue({ available: 'no' });
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    await expect(askImageQuestion(testImage, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('not available'),
        code: 'UNAVAILABLE'
      });
  });

  it('handles API errors gracefully', async () => {
    mockSession.prompt.mockRejectedValue(new Error('token limit exceeded'));
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    await expect(askImageQuestion(testImage, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('too long to process'),
        code: 'TOKEN_LIMIT'
      });
  });

  it('handles network errors appropriately', async () => {
    mockSession.prompt.mockRejectedValue(new Error('network connection failed'));
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    await expect(askImageQuestion(testImage, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('Network error'),
        code: 'NETWORK_ERROR'
      });
  });

  it('always destroys session instance', async () => {
    mockSession.prompt.mockRejectedValue(new Error('Test error'));
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    try {
      await askImageQuestion(testImage, testQuestion);
    } catch {
      // Expected to throw
    }
    
    expect(mockSession.destroy).toHaveBeenCalled();
  });

  it('handles empty responses from AI', async () => {
    mockSession.prompt.mockResolvedValue('');
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    await expect(askImageQuestion(testImage, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('No response could be generated'),
        code: 'UNKNOWN'
      });
  });
});

describe('askImageQuestionWithSummary', () => {
  const createTestImage = (type = 'image/png') => {
    return new Blob(['test image content'], { type });
  };

  beforeEach(() => {
    mockAI.languageModel.capabilities.mockResolvedValue({ available: 'readily' });
  });

  it('returns original answer if within length limit', async () => {
    const shortResponse = 'This is a short response.';
    mockSession.prompt.mockResolvedValue(shortResponse);
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    const result = await askImageQuestionWithSummary(testImage, testQuestion, 100);
    
    expect(result).toBe(shortResponse);
  });

  it('summarises long responses', async () => {
    const longResponse = 'This is a very long response that exceeds the maximum length limit and should be summarised using the TL;DR functionality to provide a more concise answer for the user.';
    const summarisedResponse = 'This is a summarised response.';
    
    mockSession.prompt.mockResolvedValue(longResponse);
    
    const { getTlDr } = await import('../summarizer');
    (getTlDr as jest.Mock).mockResolvedValue({ content: summarisedResponse });
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    const result = await askImageQuestionWithSummary(testImage, testQuestion, 50);
    
    expect(result).toBe(summarisedResponse);
    expect(getTlDr).toHaveBeenCalledWith(longResponse);
  });

  it('falls back to original answer if summarisation fails', async () => {
    const longResponse = 'This is a very long response that should be summarised but summarisation will fail.';
    
    mockSession.prompt.mockResolvedValue(longResponse);
    
    const { getTlDr } = await import('../summarizer');
    (getTlDr as jest.Mock).mockRejectedValue(new Error('Summarisation failed'));
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    const result = await askImageQuestionWithSummary(testImage, testQuestion, 50);
    
    expect(result).toBe(longResponse);
  });
});