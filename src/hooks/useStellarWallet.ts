'use client';

import { useState, useCallback } from 'react';
import { Keypair } from '@stellar/stellar-base';

export type WalletState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; publicKey: string }
  | { status: 'error'; message: string };

export interface UseStellarWallet {
  wallet:        WalletState;
  connect:       () => Promise<void>;
  disconnect:    () => void;
  /** ⚠️ Demo stub — does not submit to the network. Replace with Freighter/passkey-kit. */
  signAndSubmit: (xdr: string) => Promise<string>;
}

/**
 * Minimal Stellar wallet hook.
 * In production wire this to Freighter / Albedo / passkey-kit.
 * For demo purposes it generates an ephemeral keypair.
 */
export function useStellarWallet(): UseStellarWallet {
  const [wallet, setWallet] = useState<WalletState>({ status: 'disconnected' });
  const [keypair, setKeypair] = useState<Keypair | null>(null);

  const connect = useCallback(async () => {
    setWallet({ status: 'connecting' });
    try {
      // TODO: replace with Freighter / passkey-kit integration
      const kp = Keypair.random();
      setKeypair(kp);
      setWallet({ status: 'connected', publicKey: kp.publicKey() });
    } catch (err: unknown) {
      setWallet({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  const disconnect = useCallback(() => {
    setKeypair(null);
    setWallet({ status: 'disconnected' });
  }, []);

  const signAndSubmit = useCallback(async (xdr: string): Promise<string> => {
    if (!keypair) throw new Error('Wallet not connected');
    // Stub: in production load account, build tx, sign, submit via Horizon
    void xdr;
    return 'TX_HASH_PLACEHOLDER';
  }, [keypair]);

  return { wallet, connect, disconnect, signAndSubmit };
}
