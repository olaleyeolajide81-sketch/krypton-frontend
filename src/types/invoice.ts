export interface InvoiceFormData {
  invoiceAmount: string;
  supplierId:    string;
  buyerId:       string;
}

export interface InvoiceProof {
  commitment:       `0x${string}`;
  eligibility_hash: `0x${string}`;
  nullifier:        `0x${string}`;
  proof_bytes:      string;
  public_inputs:    `0x${string}`[];
}

export type ProveResult =
  | { ok: true;  proof: InvoiceProof }
  | { ok: false; error: string };
