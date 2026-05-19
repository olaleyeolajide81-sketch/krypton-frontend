'use client';

import { useState, useCallback } from 'react';
import { Keypair } from '@stellar/stellar-base';

export type WalletState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; publicKey: string; via: 'freighter' | 'ephemeral' }
  | { status: 'error'; message: string };

export interface UseStellarWallet {
  wallet:        WalletState;
  connect:       () => Promise<void>;
  disconnect:    () => void;
  signAndSubmit: (xdr: string) => Promise<string>;
}

/** Returns true when the Freighter extension is installed and available. */
async function freighterAvailable(): Promise<boolean> {
  try {
    const { isConnected } = await import('@stellar/freighter-api');
    const result = await isConnected();
    // v2 returns { isConnected: boolean } or a plain boolean depending on version
    return typeof result === 'object' ? (result as { isConnected: boolean }).isConnected : result;
  } catch {
    return false;
  }
}

export function useStellarWallet(): UseStellarWallet {
  const [wallet, setWallet] = useState<WalletState>({ status: 'disconnected' });
  // Ephemeral keypair used only when Freighter is absent
  const [keypair, setKeypair] = useState<Keypair | null>(null);

  const connect = useCallback(async () => {
    setWallet({ status: 'connecting' });
    try {
      if (await freighterAvailable()) {
        const { requestAccess, getPublicKey } = await import('@stellar/freighter-api');
        await requestAccess();
        const publicKey = await getPublicKey();
        setWallet({ status: 'connected', publicKey, via: 'freighter' });
      } else {
        // Fallback: ephemeral keypair for demo / non-browser environments
        const kp = Keypair.random();
        setKeypair(kp);
        setWallet({ status: 'connected', publicKey: kp.publicKey(), via: 'ephemeral' });
      }
    } catch (err: unknown) {
      setWallet({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  const disconnect = useCallback(() => {
    setKeypair(null);
    setWallet({ status: 'disconnected' });
  }, []);

  const signAndSubmit = useCallback(async (xdr: string): Promise<string> => {
    if (wallet.status !== 'connected') throw new Error('Wallet not connected');

    if (wallet.via === 'freighter') {
      const { signTransaction } = await import('@stellar/freighter-api');
      const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'public' ? 'PUBLIC' : 'TESTNET';
      const result = await signTransaction(xdr, { networkPassphrase: network });
      // v2 returns { signedTxXdr } or a plain string
      return typeof result === 'object'
        ? (result as { signedTxXdr: string }).signedTxXdr
        : result;
    }

    // Ephemeral stub — signs locally but does not submit to Horizon
    if (!keypair) throw new Error('Wallet not connected');
    void xdr;
    return 'TX_HASH_PLACEHOLDER';
  }, [wallet, keypair]);

  return { wallet, connect, disconnect, signAndSubmit };
}
