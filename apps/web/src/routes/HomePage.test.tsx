import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from './HomePage';
import i18n from '../i18n';

function renderWithProviders(ui: React.ReactElement): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('HomePage', () => {
  it('renders the app title and tagline in the selected language', async () => {
    await i18n.changeLanguage('en');
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Local Job Match' })).toBeInTheDocument();
    expect(screen.getByText('Find trusted local experts for your work')).toBeInTheDocument();
  });

  it('renders the health panel', async () => {
    await i18n.changeLanguage('en');
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Service status' })).toBeInTheDocument();
  });

  it('renders Burmese copy when the language is Burmese', async () => {
    await i18n.changeLanguage('my');
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: 'လိုကယ်ဂျော်မကတ်' })).toBeInTheDocument();
  });
});
