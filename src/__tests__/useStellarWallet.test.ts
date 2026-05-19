import { renderHook, act } from '@testing-library/react';
import { useStellarWallet } from '../hooks/useStellarWallet';

// Freighter is not available in jsdom
jest.mock('@stellar/freighter-api', () => ({
  isConnected:     jest.fn().mockResolvedValue({ isConnected: false }),
  requestAccess:   jest.fn(),
  getPublicKey:    jest.fn(),
  signTransaction: jest.fn(),
}));

describe('useStellarWallet', () => {
  it('starts disconnected', () => {
    const { result } = renderHook(() => useStellarWallet());
    expect(result.current.wallet.status).toBe('disconnected');
  });

  it('transitions to connected after connect()', async () => {
    const { result } = renderHook(() => useStellarWallet());
    await act(() => result.current.connect());
    expect(result.current.wallet.status).toBe('connected');
    if (result.current.wallet.status === 'connected') {
      expect(result.current.wallet.publicKey).toMatch(/^G/);
    }
  });

  it('returns to disconnected after disconnect()', async () => {
    const { result } = renderHook(() => useStellarWallet());
    await act(() => result.current.connect());
    act(() => result.current.disconnect());
    expect(result.current.wallet.status).toBe('disconnected');
  });

  it('signAndSubmit throws when not connected', async () => {
    const { result } = renderHook(() => useStellarWallet());
    await expect(result.current.signAndSubmit('xdr')).rejects.toThrow('Wallet not connected');
  });

  it('signAndSubmit returns placeholder hash when connected', async () => {
    const { result } = renderHook(() => useStellarWallet());
    await act(() => result.current.connect());
    const hash = await result.current.signAndSubmit('xdr');
    expect(hash).toBe('TX_HASH_PLACEHOLDER');
  });
});
