import { render, screen } from '@testing-library/react';
import Page from './page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Page />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Inbox Triage App');
  });

  it('renders the description text', () => {
    render(<Page />);
    const description = screen.getByText(/web-based email triage companion/i);
    expect(description).toBeInTheDocument();
  });
});