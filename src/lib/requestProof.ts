import type { InvoiceFormData, ProveResult } from '@/types/invoice';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export async function requestProof(form: InvoiceFormData): Promise<ProveResult> {
  const saltBytes = new Uint8Array(8);
  crypto.getRandomValues(saltBytes);
  const salt = saltBytes.reduce((acc, b) => acc * 256n + BigInt(b), 0n).toString();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${BACKEND_URL}/api/prove-factoring`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        invoice_amount: form.invoiceAmount,
        supplier_id:    form.supplierId,
        buyer_id:       form.buyerId,
        invoice_salt:   salt,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Server error ${res.status}: ${text.slice(0, 200)}` };
    }

    return res.json() as Promise<ProveResult>;
  } catch (err: unknown) {
    const message = (err instanceof Error && err.name === 'AbortError')
      ? 'Request timed out after 30 s'
      : err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
