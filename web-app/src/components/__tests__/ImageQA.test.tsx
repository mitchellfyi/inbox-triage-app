/**
 * Unit tests for ImageQA component
 */
import { render, screen, waitFor } from '@testing-library/react';
import ImageQA from '../ImageQA';

// Mock the multimodal module
jest.mock('../../lib/ai/multimodal', () => ({
  checkMultimodalAvailability: jest.fn(),
  askImageQuestionWithSummary: jest.fn(),
  MultimodalAvailability: {
    READILY_AVAILABLE: 'readily',
    AFTER_DOWNLOAD: 'after-download',
    UNAVAILABLE: 'no'
  }
}));

const { checkMultimodalAvailability, MultimodalAvailability } = jest.requireMock('../../lib/ai/multimodal');

describe('ImageQA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to readily available
    checkMultimodalAvailability.mockResolvedValue(MultimodalAvailability.READILY_AVAILABLE);
  });

  it('shows unavailable message when multimodal AI is not available', async () => {
    checkMultimodalAvailability.mockResolvedValue(MultimodalAvailability.UNAVAILABLE);
    
    render(<ImageQA />);
    
    await waitFor(() => {
      expect(screen.getByText('Image Q&A Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/Multimodal AI is not available on this device/)).toBeInTheDocument();
    });
  });

  it('shows download message when model needs downloading', async () => {
    checkMultimodalAvailability.mockResolvedValue(MultimodalAvailability.AFTER_DOWNLOAD);
    
    render(<ImageQA />);
    
    await waitFor(() => {
      expect(screen.getByText('Image Q&A')).toBeInTheDocument();
      expect(screen.getByText(/AI model download required/)).toBeInTheDocument();
    });
  });

  it('renders upload area when AI is available', async () => {
    render(<ImageQA />);
    
    await waitFor(() => {
      expect(screen.getByText('Image Q&A')).toBeInTheDocument();
      expect(screen.getByText('Upload Image')).toBeInTheDocument();
      expect(screen.getByText(/Drag and drop an image here/)).toBeInTheDocument();
    });
  });

  it('renders file input with correct attributes', async () => {
    render(<ImageQA />);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Image')).toBeInTheDocument();
    });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.accept).toBe('image/png,image/jpeg,image/jpg,image/webp');
    expect(fileInput.multiple).toBe(true);
  });

  it('shows empty state message when no images uploaded', async () => {
    render(<ImageQA />);
    
    await waitFor(() => {
      expect(screen.getByText(/No images uploaded yet/)).toBeInTheDocument();
    });
  });

  it('calls checkMultimodalAvailability on mount', async () => {
    render(<ImageQA />);
    
    await waitFor(() => {
      expect(checkMultimodalAvailability).toHaveBeenCalled();
    });
  });
});