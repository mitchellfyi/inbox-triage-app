/**
 * Unit tests for attachment parsing utilities
 */

import {
  validateFile,
  formatFileSize,
  generateAttachmentId,
  truncateText,
  cleanText,
} from '../utils';

describe('validateFile', () => {
  it('validates supported PDF files', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = validateFile(file);

    expect(result.isSupported).toBe(true);
    expect(result.type).toBe('pdf');
    expect(result.maxSize).toBe(50 * 1024 * 1024);
  });

  it('validates supported DOCX files', () => {
    const file = new File(['content'], 'test.docx', { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const result = validateFile(file);

    expect(result.isSupported).toBe(true);
    expect(result.type).toBe('docx');
  });

  it('validates supported image files', () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    const result = validateFile(file);

    expect(result.isSupported).toBe(true);
    expect(result.type).toBe('png');
  });

  it('rejects unsupported file types', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const result = validateFile(file);

    expect(result.isSupported).toBe(false);
    expect(result.error).toContain('Unsupported file type');
  });

  it('rejects files that are too large', () => {
    const largeContent = new Array(60 * 1024 * 1024).fill('a').join('');
    const file = new File([largeContent], 'test.pdf', { type: 'application/pdf' });
    const result = validateFile(file);

    expect(result.isSupported).toBe(false);
    expect(result.error).toContain('File too large');
  });

  it('falls back to extension detection for unknown MIME types', () => {
    const file = new File(['content'], 'test.pdf', { type: '' });
    const result = validateFile(file);

    expect(result.isSupported).toBe(true);
    expect(result.type).toBe('pdf');
  });
});

describe('formatFileSize', () => {
  it('formats bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(512)).toBe('512 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('generateAttachmentId', () => {
  it('generates unique IDs', () => {
    const id1 = generateAttachmentId();
    const id2 = generateAttachmentId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^attachment_\d+_[a-z0-9]+$/);
  });
});

describe('truncateText', () => {
  it('truncates text to specified word count', () => {
    const text = 'one two three four five six seven eight nine ten';
    const result = truncateText(text, 5);

    expect(result).toBe('one two three four five...');
  });

  it('returns original text if under limit', () => {
    const text = 'one two three';
    const result = truncateText(text, 5);

    expect(result).toBe(text);
  });
});

describe('cleanText', () => {
  it('cleans excessive whitespace', () => {
    const text = '  This   has    lots\n\n\n\nof   whitespace  \n\n\n';
    const result = cleanText(text);

    expect(result).toBe('This has lots of whitespace');
  });
});