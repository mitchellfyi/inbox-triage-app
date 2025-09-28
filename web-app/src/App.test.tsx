import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Inbox Triage App');
  });

  it('renders the description text', () => {
    render(<App />);
    const description = screen.getByText(/web-based email triage companion/i);
    expect(description).toBeInTheDocument();
  });
});
