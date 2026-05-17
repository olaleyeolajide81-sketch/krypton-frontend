'use client';

import { useState } from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import type { InvoiceFormData, ProveResult } from '@/types/invoice';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

async function requestProof(form: InvoiceFormData): Promise<ProveResult> {
  const salt = BigInt(Math.floor(Math.random() * 1e15)).toString();
  const res = await fetch(`${BACKEND_URL}/api/prove-factoring`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoice_amount: form.invoiceAmount,
      supplier_id:    form.supplierId,
      buyer_id:       form.buyerId,
      invoice_salt:   salt,
    }),
  });
  return res.json() as Promise<ProveResult>;
}

export default function DashboardPage() {
  const { wallet, connect, disconnect } = useStellarWallet();
  const [form, setForm] = useState<InvoiceFormData>({
    invoiceAmount: '',
    supplierId:    '',
    buyerId:       '',
  });
  const [status, setStatus] = useState<'idle' | 'proving' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ProveResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('proving');
    setResult(null);
    const res = await requestProof(form);
    setResult(res);
    setStatus(res.ok ? 'done' : 'error');
  }

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

      {/* Invoice Form */}
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 space-y-4">
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
              pattern="[0-9]*"
              placeholder={placeholder}
              value={form[id]}
              onChange={e => setForm(prev => ({ ...prev, [id]: e.target.value }))}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={status === 'proving' || wallet.status !== 'connected'}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium disabled:opacity-50"
        >
          {status === 'proving' ? 'Generating ZK Proof…' : 'Generate & Submit Proof'}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-4 text-sm font-mono break-all ${result.ok ? 'bg-green-950 border border-green-700' : 'bg-red-950 border border-red-700'}`}>
          {result.ok ? (
            <div className="space-y-1">
              <p className="text-green-400 font-semibold">✓ Proof generated</p>
              <p><span className="text-gray-400">commitment: </span>{result.proof.commitment}</p>
              <p><span className="text-gray-400">nullifier:  </span>{result.proof.nullifier}</p>
              <p><span className="text-gray-400">proof:      </span>{result.proof.proof_bytes.slice(0, 40)}…</p>
            </div>
          ) : (
            <p className="text-red-400">✗ {result.error}</p>
          )}
        </div>
      )}
    </main>
  );
}
