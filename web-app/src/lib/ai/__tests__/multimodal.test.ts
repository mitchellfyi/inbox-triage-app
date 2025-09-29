/**
 * Unit tests for Chrome Prompt API multimodal wrapper
 */
import { 
  askImageQuestion, 
  askImageQuestionWithSummary,
  checkMultimodalAvailability,
  MultimodalAvailability 
} from '../multimodal';

// Mock the Prompt API
const mockPrompt = {
  prompt: jest.fn(),
  destroy: jest.fn()
};

const mockAI = {
  prompt: {
    capabilities: jest.fn(),
    create: jest.fn().mockResolvedValue(mockPrompt)
  }
};

// Mock the summarizer module
jest.mock('../summarizer', () => ({
  getTlDr: jest.fn().mockResolvedValue('This is a summarised response.')
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
    mockAI.prompt.capabilities.mockResolvedValue({ available: 'readily' });
    
    const result = await checkMultimodalAvailability();
    
    expect(result).toBe(MultimodalAvailability.READILY_AVAILABLE);
    expect(mockAI.prompt.capabilities).toHaveBeenCalled();
  });

  it('returns after download when model needs downloading', async () => {
    mockAI.prompt.capabilities.mockResolvedValue({ available: 'after-download' });
    
    const result = await checkMultimodalAvailability();
    
    expect(result).toBe(MultimodalAvailability.AFTER_DOWNLOAD);
  });

  it('returns unavailable when API is not supported', async () => {
    mockAI.prompt.capabilities.mockResolvedValue({ available: 'no' });
    
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
    mockAI.prompt.capabilities.mockRejectedValue(new Error('Network error'));
    
    const result = await checkMultimodalAvailability();
    
    expect(result).toBe(MultimodalAvailability.UNAVAILABLE);
  });
});

describe('askImageQuestion', () => {
  const createTestImage = (type = 'image/png', size = 1000) => {
    return new Blob(['test image content'], { type });
  };

  beforeEach(() => {
    mockAI.prompt.capabilities.mockResolvedValue({ available: 'readily' });
  });

  it('successfully processes image question', async () => {
    const testImage = createTestImage();
    const testQuestion = 'What do you see in this image?';
    const expectedResponse = 'I can see a test image with various elements.';
    
    mockPrompt.prompt.mockResolvedValue(expectedResponse);
    
    const result = await askImageQuestion(testImage, testQuestion);
    
    expect(result).toBe(expectedResponse);
    expect(mockAI.prompt.create).toHaveBeenCalled();
    expect(mockPrompt.prompt).toHaveBeenCalledWith(
      expect.stringContaining(testQuestion),
      { images: [testImage] }
    );
    expect(mockPrompt.destroy).toHaveBeenCalled();
  });

  it('validates image input', async () => {
    const testQuestion = 'What is this?';
    
    // Test with null image
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
        userMessage: expect.stringContaining('Unsupported image format'),
        code: 'UNSUPPORTED_FORMAT'
      });
    
    // Test with non-image format
    const textFile = new Blob(['content'], { type: 'text/plain' });
    await expect(askImageQuestion(textFile, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('Unsupported image format'),
        code: 'UNSUPPORTED_FORMAT'
      });
  });

  it('supports all expected image formats', async () => {
    const testQuestion = 'What is this?';
    const expectedResponse = 'Test response';
    mockPrompt.prompt.mockResolvedValue(expectedResponse);
    
    const formats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    
    for (const format of formats) {
      const testImage = createTestImage(format);
      const result = await askImageQuestion(testImage, testQuestion);
      expect(result).toBe(expectedResponse);
    }
  });

  it('handles API unavailability', async () => {
    mockAI.prompt.capabilities.mockResolvedValue({ available: 'no' });
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    await expect(askImageQuestion(testImage, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('not available'),
        code: 'UNAVAILABLE'
      });
  });

  it('handles API errors gracefully', async () => {
    mockPrompt.prompt.mockRejectedValue(new Error('token limit exceeded'));
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    await expect(askImageQuestion(testImage, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('too large to process'),
        code: 'TOKEN_LIMIT'
      });
  });

  it('handles network errors appropriately', async () => {
    mockPrompt.prompt.mockRejectedValue(new Error('network connection failed'));
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    await expect(askImageQuestion(testImage, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('Network error'),
        code: 'NETWORK_ERROR'
      });
  });

  it('always destroys prompt instance', async () => {
    mockPrompt.prompt.mockRejectedValue(new Error('Test error'));
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    try {
      await askImageQuestion(testImage, testQuestion);
    } catch {
      // Expected to throw
    }
    
    expect(mockPrompt.destroy).toHaveBeenCalled();
  });

  it('handles empty responses from AI', async () => {
    mockPrompt.prompt.mockResolvedValue('');
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    await expect(askImageQuestion(testImage, testQuestion))
      .rejects.toMatchObject({
        userMessage: expect.stringContaining('No answer could be generated'),
        code: 'UNKNOWN'
      });
  });
});

describe('askImageQuestionWithSummary', () => {
  const createTestImage = (type = 'image/png') => {
    return new Blob(['test image content'], { type });
  };

  beforeEach(() => {
    mockAI.prompt.capabilities.mockResolvedValue({ available: 'readily' });
  });

  it('returns original answer if within length limit', async () => {
    const shortResponse = 'This is a short response.';
    mockPrompt.prompt.mockResolvedValue(shortResponse);
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    const result = await askImageQuestionWithSummary(testImage, testQuestion, 100);
    
    expect(result).toBe(shortResponse);
  });

  it('summarises long responses', async () => {
    const longResponse = 'This is a very long response that exceeds the maximum length limit and should be summarised using the TL;DR functionality to provide a more concise answer for the user.';
    const summarisedResponse = 'This is a summarised response.';
    
    mockPrompt.prompt.mockResolvedValue(longResponse);
    
    const { getTlDr } = await import('../summarizer');
    (getTlDr as jest.Mock).mockResolvedValue(summarisedResponse);
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    const result = await askImageQuestionWithSummary(testImage, testQuestion, 50);
    
    expect(result).toBe(summarisedResponse);
    expect(getTlDr).toHaveBeenCalledWith(longResponse);
  });

  it('falls back to original answer if summarisation fails', async () => {
    const longResponse = 'This is a very long response that should be summarised but summarisation will fail.';
    
    mockPrompt.prompt.mockResolvedValue(longResponse);
    
    const { getTlDr } = await import('../summarizer');
    (getTlDr as jest.Mock).mockRejectedValue(new Error('Summarisation failed'));
    
    const testImage = createTestImage();
    const testQuestion = 'What is this?';
    
    const result = await askImageQuestionWithSummary(testImage, testQuestion, 50);
    
    expect(result).toBe(longResponse);
  });
});