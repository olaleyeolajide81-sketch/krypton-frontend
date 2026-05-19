/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../app/page';

// Freighter is not available in jsdom — mock it as not connected
jest.mock('@stellar/freighter-api', () => ({
  isConnected:     jest.fn().mockResolvedValue({ isConnected: false }),
  requestAccess:   jest.fn(),
  getPublicKey:    jest.fn(),
  signTransaction: jest.fn(),
}));

Object.defineProperty(globalThis, 'crypto', {
  value: { getRandomValues: (buf: Uint8Array) => { buf.fill(1); return buf; } },
  configurable: true,
});

async function connectWallet() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /connect wallet/i }));
  // Wait for the async connect() to finish (ephemeral fallback)
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: /disconnect/i })).toBeTruthy()
  );
  return user;
}

describe('DashboardPage', () => {
  it('renders the page heading', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Krypton Ledger/i)).toBeTruthy();
  });

  it('shows Connect Wallet button when disconnected', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeTruthy();
  });

  it('submit button is disabled when wallet not connected', () => {
    render(<DashboardPage />);
    expect((screen.getByRole('button', { name: /generate/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows ephemeral warning banner after connecting without Freighter', async () => {
    render(<DashboardPage />);
    await connectWallet();
    const note = screen.getByRole('note');
    expect(note).toBeTruthy();
    expect(note.textContent).toMatch(/ephemeral/i);
  });

  it('shows validation error for zero invoice amount', async () => {
    render(<DashboardPage />);
    const user = await connectWallet();

    await user.type(screen.getByLabelText(/invoice amount/i), '0');
    await user.type(screen.getByLabelText(/supplier id/i), '1');
    await user.type(screen.getByLabelText(/buyer id/i), '1');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(/positive integer/i)).toBeTruthy();
  });
});
