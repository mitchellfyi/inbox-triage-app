/**
 * Unit tests for ThreadSummary component
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThreadSummary from '../ThreadSummary';
import { SummariserAvailability } from '../../lib/ai/summarizer';

describe('ThreadSummary', () => {
  it('renders TL;DR and key points when provided', () => {
    const tldr = 'This is a test summary';
    const keyPoints = ['First point', 'Second point', 'Third point'];

    render(
      <ThreadSummary 
        tldr={tldr} 
        keyPoints={keyPoints} 
      />
    );

    expect(screen.getByText('Thread Summary')).toBeInTheDocument();
    expect(screen.getByText('TL;DR')).toBeInTheDocument();
    expect(screen.getByText(tldr)).toBeInTheDocument();
    expect(screen.getByText('Key Points')).toBeInTheDocument();
    expect(screen.getByText('First point')).toBeInTheDocument();
    expect(screen.getByText('Second point')).toBeInTheDocument();
    expect(screen.getByText('Third point')).toBeInTheDocument();
  });

  it('renders only TL;DR when key points not provided', () => {
    const tldr = 'This is a test summary';

    render(
      <ThreadSummary tldr={tldr} />
    );

    expect(screen.getByText('TL;DR')).toBeInTheDocument();
    expect(screen.getByText(tldr)).toBeInTheDocument();
    expect(screen.queryByText('Key Points')).not.toBeInTheDocument();
  });

  it('renders only key points when TL;DR not provided', () => {
    const keyPoints = ['First point', 'Second point'];

    render(
      <ThreadSummary keyPoints={keyPoints} />
    );

    expect(screen.getByText('Key Points')).toBeInTheDocument();
    expect(screen.getByText('First point')).toBeInTheDocument();
    expect(screen.queryByText('TL;DR')).not.toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<ThreadSummary isLoading={true} />);

    expect(screen.getByText('Generating summary...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we analyse your thread.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows downloading state when isDownloading is true', () => {
    render(<ThreadSummary isDownloading={true} />);

    expect(screen.getByText('Downloading summariser model...')).toBeInTheDocument();
    expect(screen.getByText('This may take a few moments for the first use.')).toBeInTheDocument();
  });

  it('shows error state when error is provided', () => {
    const errorMessage = 'Something went wrong';
    
    render(<ThreadSummary error={errorMessage} />);

    expect(screen.getByText('Summarisation Failed')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows unavailable state when availability is unavailable', () => {
    render(
      <ThreadSummary availability={SummariserAvailability.UNAVAILABLE} />
    );

    expect(screen.getByText('Summariser Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Chrome's built-in AI is not available/)).toBeInTheDocument();
  });

  it('does not render when no content to show', () => {
    const { container } = render(<ThreadSummary />);
    
    expect(container.firstChild).toBeNull();
  });

  it('prioritizes error state over loading state', () => {
    render(
      <ThreadSummary 
        isLoading={true} 
        error="Test error"
      />
    );

    expect(screen.getByText('Summarisation Failed')).toBeInTheDocument();
    expect(screen.queryByText('Generating summary...')).not.toBeInTheDocument();
  });

  it('prioritizes loading state over content', () => {
    render(
      <ThreadSummary 
        isLoading={true}
        tldr="Should not show"
        keyPoints={['Should not show']}
      />
    );

    expect(screen.getByText('Generating summary...')).toBeInTheDocument();
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ThreadSummary isLoading={true} />);
    
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveAttribute('aria-live', 'polite');
  });

  it('renders empty key points array correctly', () => {
    render(
      <ThreadSummary 
        tldr="Test summary"
        keyPoints={[]} 
      />
    );

    expect(screen.getByText('Test summary')).toBeInTheDocument();
    expect(screen.queryByText('Key Points')).not.toBeInTheDocument();
  });
});