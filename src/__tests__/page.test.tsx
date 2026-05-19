/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../app/page';

// Stub next/navigation and crypto
Object.defineProperty(globalThis, 'crypto', {
  value: { getRandomValues: (buf: Uint8Array) => { buf.fill(1); return buf; } },
  configurable: true,
});

describe('DashboardPage', () => {
  it('renders the page heading', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Krypton Ledger/i)).toBeTruthy();
  });

  it('shows Connect Wallet button when disconnected', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeTruthy();
  });

  it('shows stub warning banner', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('note')).toBeTruthy();
    expect(screen.getByText(/signAndSubmit/)).toBeTruthy();
  });

  it('submit button is disabled when wallet not connected', () => {
    render(<DashboardPage />);
    const submit = screen.getByRole('button', { name: /generate/i });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows validation error for zero invoice amount', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    // Connect wallet first
    await user.click(screen.getByRole('button', { name: /connect wallet/i }));

    await user.type(screen.getByLabelText(/invoice amount/i), '0');
    await user.type(screen.getByLabelText(/supplier id/i), '1');
    await user.type(screen.getByLabelText(/buyer id/i), '1');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/positive integer/i)).toBeTruthy();
  });
});
