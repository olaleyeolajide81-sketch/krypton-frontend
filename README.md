# Krypton Frontend

A Next.js frontend for **Krypton Ledger** — a ZK-shielded invoice factoring platform built on the Stellar blockchain.

## Overview

Krypton Ledger lets suppliers submit invoices for factoring while keeping sensitive financial details private using zero-knowledge proofs. The frontend connects to a Stellar wallet, collects invoice data, requests a ZK proof from the backend, and displays the resulting commitment and nullifier.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Stellar (`@stellar/stellar-sdk`)

## Getting Started

### Prerequisites

- Node.js 18+
- A running instance of the [Krypton backend](http://localhost:3001) (provides the `/api/prove-factoring` endpoint)

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | URL of the Krypton backend API | `http://localhost:3001` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Stellar network (`public` or `testnet`) | `public` |

### Running

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

The app runs at `http://localhost:3000`.

## Features

- **Wallet connection** — connects an ephemeral Stellar keypair (Freighter/passkey-kit integration ready via `useStellarWallet` hook)
- **Invoice form** — accepts invoice amount (XLM stroops), supplier ID, and buyer ID
- **ZK proof generation** — sends invoice data to the backend and displays the returned commitment, nullifier, and proof bytes
- **Error handling** — surfaces backend errors inline

## Project Structure

```
src/
├── app/
│   └── page.tsx          # Main dashboard page
├── hooks/
│   └── useStellarWallet.ts  # Stellar wallet state hook
└── types/
    └── invoice.ts        # TypeScript types for invoice data and proof results
```

## Wallet Integration

The current `useStellarWallet` hook generates an ephemeral keypair for demo purposes. To use a real wallet, replace the `connect` function body in `src/hooks/useStellarWallet.ts` with a Freighter or passkey-kit integration.

## License

MIT
