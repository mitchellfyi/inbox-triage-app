/**
 * Unit tests for Chrome Summarizer API wrapper
 */
import { 
  getTlDr, 
  getKeyPoints, 
  checkSummariserAvailability,
  SummariserAvailability 
} from '../summarizer';

// Mock the Chrome AI API
const mockSummarizer = {
  summarize: jest.fn(),
  destroy: jest.fn()
};

const mockAI = {
  summarizer: {
    capabilities: jest.fn(),
    create: jest.fn().mockResolvedValue(mockSummarizer)
  }
};

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

describe('checkSummariserAvailability', () => {
  it('returns readily available when API is ready', async () => {
    mockAI.summarizer.capabilities.mockResolvedValue({ available: 'readily' });
    
    const result = await checkSummariserAvailability();
    
    expect(result).toBe(SummariserAvailability.READILY_AVAILABLE);
  });

  it('returns after download when model needs downloading', async () => {
    mockAI.summarizer.capabilities.mockResolvedValue({ available: 'after-download' });
    
    const result = await checkSummariserAvailability();
    
    expect(result).toBe(SummariserAvailability.AFTER_DOWNLOAD);
  });

  it('returns unavailable when API is not supported', async () => {
    mockAI.summarizer.capabilities.mockResolvedValue({ available: 'no' });
    
    const result = await checkSummariserAvailability();
    
    expect(result).toBe(SummariserAvailability.UNAVAILABLE);
  });

  it('returns unavailable when API is not present', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).ai = undefined;
    
    const result = await checkSummariserAvailability();
    
    expect(result).toBe(SummariserAvailability.UNAVAILABLE);
    
    // Restore for other tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).ai = mockAI;
  });

  it('returns unavailable on error', async () => {
    mockAI.summarizer.capabilities.mockRejectedValue(new Error('Network error'));
    
    const result = await checkSummariserAvailability();
    
    expect(result).toBe(SummariserAvailability.UNAVAILABLE);
  });
});

describe('getTlDr', () => {
  beforeEach(() => {
    mockAI.summarizer.capabilities.mockResolvedValue({ available: 'readily' });
    mockSummarizer.summarize.mockResolvedValue('This is a test summary');
  });

  it('generates TL;DR successfully', async () => {
    const testText = 'Long email thread content here...';
    
    const result = await getTlDr(testText);
    
    expect(result).toBe('This is a test summary');
    expect(mockAI.summarizer.create).toHaveBeenCalledWith({
      type: 'tl;dr',
      length: 'short',
      format: 'plain-text'
    });
    expect(mockSummarizer.summarize).toHaveBeenCalledWith(testText, {
      context: 'Email thread'
    });
    expect(mockSummarizer.destroy).toHaveBeenCalled();
  });

  it('trims whitespace from result', async () => {
    mockSummarizer.summarize.mockResolvedValue('  \n  Test summary with whitespace  \n  ');
    
    const result = await getTlDr('test text');
    
    expect(result).toBe('Test summary with whitespace');
  });

  it('throws error for empty input', async () => {
    await expect(getTlDr('')).rejects.toThrow();
    await expect(getTlDr('   ')).rejects.toThrow();
  });

  it('throws error when API unavailable', async () => {
    mockAI.summarizer.capabilities.mockResolvedValue({ available: 'no' });
    
    await expect(getTlDr('test text')).rejects.toThrow();
  });

  it('throws error with token limit message on length error', async () => {
    mockSummarizer.summarize.mockRejectedValue(new Error('token limit exceeded'));
    
    try {
      await getTlDr('test text');
      fail('Should have thrown');
    } catch (error: unknown) {
      const err = error as { userMessage: string; code: string };
      expect(err.userMessage).toContain('too long to summarise locally');
      expect(err.code).toBe('TOKEN_LIMIT');
    }
  });

  it('handles network errors appropriately', async () => {
    mockSummarizer.summarize.mockRejectedValue(new Error('network connection failed'));
    
    try {
      await getTlDr('test text');
      fail('Should have thrown');
    } catch (error: unknown) {
      const err = error as { userMessage: string; code: string };
      expect(err.userMessage).toContain('Network error');
      expect(err.code).toBe('NETWORK_ERROR');
    }
  });

  it('always destroys summarizer instance', async () => {
    mockSummarizer.summarize.mockRejectedValue(new Error('Test error'));
    
    try {
      await getTlDr('test text');
    } catch {
      // Expected to throw
    }
    
    expect(mockSummarizer.destroy).toHaveBeenCalled();
  });
});

describe('getKeyPoints', () => {
  beforeEach(() => {
    mockAI.summarizer.capabilities.mockResolvedValue({ available: 'readily' });
  });

  it('extracts key points successfully', async () => {
    const keyPointsText = '• First important point\n• Second key issue\n• Third action item';
    mockSummarizer.summarize.mockResolvedValue(keyPointsText);
    
    const result = await getKeyPoints('Email thread text');
    
    expect(result).toEqual([
      'First important point',
      'Second key issue', 
      'Third action item'
    ]);
    expect(mockAI.summarizer.create).toHaveBeenCalledWith({
      type: 'key-points',
      length: 'short',
      format: 'plain-text'
    });
  });

  it('handles different bullet point formats', async () => {
    const keyPointsText = '- First point\n* Second point\n• Third point';
    mockSummarizer.summarize.mockResolvedValue(keyPointsText);
    
    const result = await getKeyPoints('test');
    
    expect(result).toEqual([
      'First point',
      'Second point',
      'Third point'
    ]);
  });

  it('limits to 5 key points maximum', async () => {
    const keyPointsText = '• Point 1\n• Point 2\n• Point 3\n• Point 4\n• Point 5\n• Point 6\n• Point 7';
    mockSummarizer.summarize.mockResolvedValue(keyPointsText);
    
    const result = await getKeyPoints('test');
    
    expect(result).toHaveLength(5);
    expect(result).toEqual([
      'Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5'
    ]);
  });

  it('filters empty lines and whitespace', async () => {
    const keyPointsText = '• First point\n\n   \n• Second point\n• \n• Third point';
    mockSummarizer.summarize.mockResolvedValue(keyPointsText);
    
    const result = await getKeyPoints('test');
    
    expect(result).toEqual([
      'First point',
      'Second point',
      'Third point'
    ]);
  });

  it('returns empty array when no valid points found', async () => {
    mockSummarizer.summarize.mockResolvedValue('\n   \n  \n');
    
    const result = await getKeyPoints('test');
    
    expect(result).toEqual([]);
  });

  it('throws error for empty input', async () => {
    await expect(getKeyPoints('')).rejects.toThrow();
    await expect(getKeyPoints('   ')).rejects.toThrow();
  });

  it('throws error when API unavailable', async () => {
    mockAI.summarizer.capabilities.mockResolvedValue({ available: 'no' });
    
    await expect(getKeyPoints('test text')).rejects.toThrow();
  });

  it('always destroys summarizer instance', async () => {
    mockSummarizer.summarize.mockResolvedValue('• Test point');
    
    await getKeyPoints('test text');
    
    expect(mockSummarizer.destroy).toHaveBeenCalled();
  });
});