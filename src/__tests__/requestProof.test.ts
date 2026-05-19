import { requestProof } from '../lib/requestProof';

const mockForm = { invoiceAmount: '50000', supplierId: '42', buyerId: '99' };

beforeEach(() => {
  // Provide crypto.getRandomValues in the test environment
  Object.defineProperty(globalThis, 'crypto', {
    value: { getRandomValues: (buf: Uint8Array) => { buf.fill(1); return buf; } },
    configurable: true,
  });
});

afterEach(() => jest.resetAllMocks());

describe('requestProof', () => {
  it('returns ok:true on a successful response', async () => {
    const proof = { commitment: '0xabc', nullifier: '0xdef', eligibility_hash: '0x0', proof_bytes: 'deadbeef', public_inputs: [] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, proof }),
    } as unknown as Response);

    const result = await requestProof(mockForm);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.proof.commitment).toBe('0xabc');
  });

  it('returns ok:false with server error message on non-2xx', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as unknown as Response);

    const result = await requestProof(mockForm);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/500/);
  });

  it('returns ok:false with timeout message when fetch is aborted', async () => {
    global.fetch = jest.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));

    const result = await requestProof(mockForm);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/timed out/i);
  });

  it('returns ok:false on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

    const result = await requestProof(mockForm);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Network failure');
  });
});
