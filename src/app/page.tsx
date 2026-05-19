'use client';

import { useState } from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { requestProof } from '@/lib/requestProof';
import type { InvoiceFormData, ProveResult } from '@/types/invoice';

// Validate that a field value is a positive integer
function validateFields(form: InvoiceFormData): string | null {
  for (const [key, raw] of Object.entries(form)) {
    const n = Number(raw);
    if (!raw || !Number.isInteger(n) || n <= 0) {
      return `${key} must be a positive integer.`;
    }
  }
  return null;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="ml-2 text-xs text-indigo-400 hover:text-indigo-300 underline"
      aria-label="Copy to clipboard"
    >
      {copied ? 'copied!' : 'copy'}
    </button>
  );
}

export default function DashboardPage() {
  const { wallet, connect, disconnect } = useStellarWallet();
  const [form, setForm] = useState<InvoiceFormData>({
    invoiceAmount: '',
    supplierId:    '',
    buyerId:       '',
  });
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'proving' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ProveResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateFields(form);
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setFieldError(null);
    setStatus('proving');
    setResult(null);
    const res = await requestProof(form);
    setResult(res);
    setStatus(res.ok ? 'done' : 'error');
  }

  const walletNotConnected = wallet.status !== 'connected';

  return (
    <main className="max-w-2xl mx-auto py-16 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          🔐 Krypton Ledger
          <span className="ml-2 text-sm font-normal text-gray-400">ZK-Shielded Factoring</span>
        </h1>
        {wallet.status === 'connected' ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-400 font-mono truncate max-w-[140px]">
              {wallet.publicKey}
            </span>
            <button onClick={disconnect} className="text-xs text-gray-400 hover:text-white">
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={wallet.status === 'connecting'}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {wallet.status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}
      </div>

      {/* Stub warning */}
      <p role="note" className="text-xs text-yellow-500 bg-yellow-950 border border-yellow-700 rounded-lg px-3 py-2">
        ⚠️ <strong>Demo mode:</strong> <code>signAndSubmit</code> is a stub and does not broadcast transactions to the Stellar network.
      </p>

      {/* Invoice Form */}
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 space-y-4" noValidate>
        <h2 className="text-lg font-semibold">Submit Invoice for Factoring</h2>

        {(
          [
            { id: 'invoiceAmount', label: 'Invoice Amount (XLM stroops)', placeholder: '50000' },
            { id: 'supplierId',    label: 'Supplier ID',                  placeholder: '42'    },
            { id: 'buyerId',       label: 'Buyer ID',                     placeholder: '99'    },
          ] as const
        ).map(({ id, label, placeholder }) => (
          <div key={id} className="space-y-1">
            <label htmlFor={id} className="text-sm text-gray-400">{label}</label>
            <input
              id={id}
              type="text"
              inputMode="numeric"
              pattern="[1-9][0-9]*"
              placeholder={placeholder}
              value={form[id]}
              onChange={e => setForm(prev => ({ ...prev, [id]: e.target.value }))}
              aria-describedby={fieldError ? 'field-error' : undefined}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}

        {fieldError && (
          <p id="field-error" role="alert" className="text-xs text-red-400">{fieldError}</p>
        )}

        {walletNotConnected && (
          <p className="text-xs text-yellow-400">Connect your wallet to submit a proof.</p>
        )}

        <button
          type="submit"
          disabled={status === 'proving' || walletNotConnected}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium disabled:opacity-50"
        >
          {status === 'proving' ? 'Generating ZK Proof…' : 'Generate & Submit Proof'}
        </button>
      </form>

      {/* Result — aria-live so screen readers announce updates */}
      <div aria-live="polite" aria-atomic="true">
        {result && (
          <div className={`rounded-xl p-4 text-sm font-mono break-all ${result.ok ? 'bg-green-950 border border-green-700' : 'bg-red-950 border border-red-700'}`}>
            {result.ok ? (
              <div className="space-y-2">
                <p className="text-green-400 font-semibold">✓ Proof generated</p>
                <p>
                  <span className="text-gray-400">commitment: </span>
                  {result.proof.commitment}
                  <CopyButton value={result.proof.commitment} />
                </p>
                <p>
                  <span className="text-gray-400">nullifier:  </span>
                  {result.proof.nullifier}
                  <CopyButton value={result.proof.nullifier} />
                </p>
                <p>
                  <span className="text-gray-400">proof:      </span>
                  {result.proof.proof_bytes
                    ? `${result.proof.proof_bytes.slice(0, 40)}…`
                    : <span className="text-gray-500">(empty)</span>}
                </p>
              </div>
            ) : (
              <p role="alert" className="text-red-400">✗ {result.error}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
