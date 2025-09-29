/**
 * Unit tests for main attachment parser
 */

import { parseAttachment, getSupportedFileTypes, formatAttachmentInfo } from '../index';
import type { ParsedAttachment } from '../../../types/attachment';

// Mock the parsing modules
jest.mock('../pdf', () => ({
  parsePdf: jest.fn(() =>
    Promise.resolve({
      text: 'This is a PDF document with important information.',
      metadata: { pageCount: 3, wordCount: 10 },
    })
  ),
}));

jest.mock('../docx', () => ({
  parseDocx: jest.fn(() =>
    Promise.resolve({
      text: 'This is a DOCX document with formatted content.',
      metadata: { wordCount: 9 },
    })
  ),
}));

jest.mock('../xlsx', () => ({
  parseSpreadsheet: jest.fn(() =>
    Promise.resolve({
      text: 'Sheet: Data\nHeaders: Name | Age | Score\nRow 1: John | 25 | 95',
      metadata: { sheetCount: 1, sheetNames: ['Data'] },
    })
  ),
}));

jest.mock('../image', () => ({
  parseImage: jest.fn(() =>
    Promise.resolve({
      text: 'A screenshot showing data visualization charts.',
      metadata: { imageDescription: 'Charts and graphs' },
    })
  ),
}));

// Mock the AI summarizer
jest.mock('../../ai/summarizer', () => ({
  getTlDr: jest.fn(() => Promise.resolve('This is a test summary')),
  getKeyPoints: jest.fn(() => Promise.resolve(['Point 1', 'Point 2', 'Point 3'])),
}));

describe('parseAttachment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses PDF files successfully', async () => {
    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const result = await parseAttachment(file);

    expect(result.isLoading).toBe(false);
    expect(result.error).toBeUndefined();
    expect(result.content.text).toContain('PDF document');
    expect(result.summary?.tldr).toBe('This is a test summary');
    expect(result.summary?.keyPoints).toHaveLength(3);
  });

  it('parses DOCX files successfully', async () => {
    const file = new File(['docx content'], 'test.docx', { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const result = await parseAttachment(file);

    expect(result.isLoading).toBe(false);
    expect(result.error).toBeUndefined();
    expect(result.content.text).toContain('DOCX document');
  });

  it('parses Excel files successfully', async () => {
    const file = new File(['xlsx content'], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const result = await parseAttachment(file);

    expect(result.isLoading).toBe(false);
    expect(result.error).toBeUndefined();
    expect(result.content.text).toContain('Sheet: Data');
  });

  it('parses image files successfully', async () => {
    const file = new File(['png content'], 'test.png', { type: 'image/png' });
    const result = await parseAttachment(file);

    expect(result.isLoading).toBe(false);
    expect(result.error).toBeUndefined();
    expect(result.content.text).toContain('screenshot');
  });

  it('handles unsupported files gracefully', async () => {
    const file = new File(['text content'], 'test.txt', { type: 'text/plain' });
    const result = await parseAttachment(file);

    expect(result.isLoading).toBe(false);
    expect(result.error).toContain('Unsupported file type');
  });

  it('handles parsing errors gracefully', async () => {
    // Mock PDF parser to throw error
    const parseMock = await import('../pdf');
    jest.mocked(parseMock.parsePdf).mockRejectedValueOnce(new Error('PDF parsing failed'));

    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const result = await parseAttachment(file);

    expect(result.isLoading).toBe(false);
    expect(result.error).toContain('PDF parsing failed');
  });
});

describe('getSupportedFileTypes', () => {
  it('returns expected file extensions and MIME types', () => {
    const result = getSupportedFileTypes();

    expect(result.extensions).toContain('.pdf');
    expect(result.extensions).toContain('.docx');
    expect(result.extensions).toContain('.xlsx');
    expect(result.extensions).toContain('.png');
    expect(result.mimeTypes).toContain('application/pdf');
    expect(result.mimeTypes).toContain('image/png');
  });
});

describe('formatAttachmentInfo', () => {
  it('formats attachment info correctly', () => {
    const attachment: ParsedAttachment = {
      id: 'test-id',
      name: 'test.pdf',
      type: 'application/pdf',
      size: 1024 * 1024,
      lastModified: Date.now(),
      content: { text: '' },
      isLoading: false,
    };

    const result = formatAttachmentInfo(attachment);

    expect(result).toBe('PDF • 1 MB');
  });
});