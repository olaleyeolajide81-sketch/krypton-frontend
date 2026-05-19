# Krypton Frontend

A Next.js frontend for **Krypton Ledger** — a ZK-shielded invoice factoring platform built on the Stellar blockchain.

## Overview

Krypton Ledger lets suppliers submit invoices for factoring while keeping sensitive financial details private using zero-knowledge proofs. The frontend connects to a Stellar wallet, collects invoice data, requests a ZK proof from the backend, and displays the resulting commitment and nullifier.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Stellar (`@stellar/stellar-base`, `@stellar/freighter-api`)

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
| `NEXT_PUBLIC_STELLAR_NETWORK` | Stellar network (`public` or `testnet`) | `testnet` |

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

- **Wallet connection** — connects via [Freighter](https://freighter.app) when the extension is installed; falls back to an ephemeral keypair for demo purposes
- **Invoice form** — accepts invoice amount (XLM stroops), supplier ID, and buyer ID with positive-integer validation
- **ZK proof generation** — sends invoice data to the backend (30 s timeout) and displays the returned commitment, nullifier, and proof bytes
- **Copy to clipboard** — one-click copy for commitment and nullifier values
- **Accessible** — `aria-live` result region, `role="alert"` on errors, `aria-describedby` on inputs

## Project Structure

```
src/
├── app/
│   └── page.tsx             # Main dashboard page
├── hooks/
│   └── useStellarWallet.ts  # Freighter + ephemeral wallet hook
├── lib/
│   └── requestProof.ts      # Fetch helper with timeout + error handling
└── types/
    └── invoice.ts           # TypeScript types for invoice data and proof results
e2e/
└── proof-flow.spec.ts       # Playwright E2E tests
```

## Wallet Integration

The `useStellarWallet` hook detects the [Freighter](https://freighter.app) browser extension at runtime:

- **Freighter present** — calls `requestAccess()` and `getPublicKey()` from `@stellar/freighter-api`. Transaction signing uses `signTransaction()` with the configured network passphrase.
- **Freighter absent** — generates an ephemeral `Keypair` for demo purposes. A warning banner is shown in the UI. `signAndSubmit` returns a placeholder hash and does **not** broadcast to the network.

To integrate a different wallet (Albedo, WalletConnect, passkey-kit), replace the `freighterAvailable` branch in `src/hooks/useStellarWallet.ts`.

## Testing

```bash
# Unit + component tests (Jest)
npm test

# E2E tests (Playwright) — requires the dev server to be running
npx playwright test
```

E2E tests use Playwright's `page.route()` to intercept `/api/prove-factoring` calls, so no live backend is needed.

## CI

GitHub Actions runs on every push and pull request to `main`:

1. **Unit tests** (`npm test`) + **production build** (`npm run build`)
2. **Playwright E2E** (Chromium, headless) — only runs after unit tests pass

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Security Notes

### Rate Limiting

The `/api/prove-factoring` endpoint performs expensive ZK proof computation. The **backend** must enforce rate limiting to prevent abuse. Recommended approach:

- Use a sliding-window rate limiter (e.g. `express-rate-limit` with a Redis store) keyed by IP address or authenticated user ID.
- Suggested limits: **10 requests / minute per IP** in production.
- Return `429 Too Many Requests` with a `Retry-After` header; the frontend surfaces this as a structured error message.

### CSRF Protection

Because the frontend calls the backend from a browser, the backend should:

- Set `SameSite=Strict` (or `Lax`) on any session cookies to block cross-site request forgery.
- Validate the `Origin` / `Referer` header against an allowlist of trusted frontend origins.
- For stateless JWT-based auth, CSRF is not applicable — but the backend should still validate the `Content-Type: application/json` header to reject form-encoded cross-origin requests.

The frontend already sends `Content-Type: application/json` on every proof request, which provides a basic CSRF barrier for browsers that enforce CORS preflight on non-simple content types.

### Input Validation

All numeric fields are validated client-side (positive integers only) before the request is sent. The backend must independently validate and sanitise all inputs — never trust client-side validation alone.

## License

MIT
