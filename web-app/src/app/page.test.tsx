import { render, screen } from '@testing-library/react';
import Page from './page';
import { PreferencesProvider } from '@/lib/preferences/context';

// Mock window.ai for tests
Object.defineProperty(window, 'ai', {
  value: undefined,
  writable: true
});

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(
      <PreferencesProvider>
        <Page />
      </PreferencesProvider>
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Inbox Triage App');
  });

  it('renders the description text', () => {
    render(
      <PreferencesProvider>
        <Page />
      </PreferencesProvider>
    );
    const description = screen.getByText(/web-based email triage companion/i);
    expect(description).toBeInTheDocument();
  });
});