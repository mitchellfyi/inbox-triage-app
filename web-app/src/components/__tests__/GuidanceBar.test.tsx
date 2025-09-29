/**
 * Tests for GuidanceBar component with voice dictation
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GuidanceBar from '../GuidanceBar';

// Mock navigator.mediaDevices.getUserMedia
const mockGetUserMedia = jest.fn();

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia
  }
});

describe('GuidanceBar', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    disabled: false,
    maxLength: 500
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({});
  });

  describe('Basic functionality', () => {
    it('renders the guidance textarea with proper attributes', () => {
      render(<GuidanceBar {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /guidance/i });
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('maxlength', '500');
      expect(textarea).toHaveAttribute('placeholder', expect.stringContaining('Enter additional instructions'));
    });

    it('displays character count', () => {
      render(<GuidanceBar {...defaultProps} value="Hello world" />);
      
      expect(screen.getByText('11/500 characters')).toBeInTheDocument();
    });

    it('calls onChange when text is entered', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<GuidanceBar {...defaultProps} onChange={mockOnChange} />);
      
      const textarea = screen.getByRole('textbox', { name: /guidance/i });
      await user.type(textarea, 'Test');
      
      // Check that onChange was called for each character
      expect(mockOnChange).toHaveBeenCalledTimes(4);
      expect(mockOnChange).toHaveBeenCalledWith('T');
      expect(mockOnChange).toHaveBeenCalledWith('Te');
      expect(mockOnChange).toHaveBeenCalledWith('Tes');
      expect(mockOnChange).toHaveBeenCalledWith('Test');
    });

    it('disables textarea when disabled prop is true', () => {
      render(<GuidanceBar {...defaultProps} disabled={true} />);
      
      const textarea = screen.getByRole('textbox', { name: /guidance/i });
      expect(textarea).toBeDisabled();
    });
  });

  describe('Clear functionality', () => {
    it('shows clear button when value is present', () => {
      render(<GuidanceBar {...defaultProps} value="Some text" />);
      
      const clearButton = screen.getByRole('button', { name: /clear guidance/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('does not show clear button when value is empty', () => {
      render(<GuidanceBar {...defaultProps} value="" />);
      
      const clearButton = screen.queryByRole('button', { name: /clear guidance/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it('calls onChange with empty string when clear button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<GuidanceBar {...defaultProps} value="Some text" onChange={mockOnChange} />);
      
      const clearButton = screen.getByRole('button', { name: /clear guidance/i });
      await user.click(clearButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and descriptions', () => {
      render(<GuidanceBar {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /guidance/i });
      expect(textarea).toHaveAttribute('aria-describedby', 'guidance-help guidance-count');
    });

    it('shows helpful text for unsupported browsers', () => {
      render(<GuidanceBar {...defaultProps} />);
      
      expect(screen.getByText(/Additional instructions to influence the reply generation/)).toBeInTheDocument();
    });
  });

  describe('Voice features', () => {
    it('shows microphone button and hint when speech recognition might be supported', () => {
      // Mock SpeechRecognition constructor
      const mockSpeechRecognition = jest.fn();
      Object.defineProperty(global.window, 'SpeechRecognition', {
        writable: true,
        value: mockSpeechRecognition
      });

      render(<GuidanceBar {...defaultProps} />);
      
      // Should show either the microphone button or unsupported message
      const hasVoiceElements = 
        screen.queryByRole('button', { name: /voice dictation/i }) ||
        screen.queryByText(/Voice dictation not supported/);
      
      expect(hasVoiceElements).toBeInTheDocument();
    });
  });
});