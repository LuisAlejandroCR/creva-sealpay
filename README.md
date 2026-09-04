<!-- README.md: what this submission is and how to run it — the public face of the repo, not the private prep notes. -->

# creva-sealpay

**ETHGlobal Online 2026 submission**, built on Creva's existing product through its Continuity
track. Creva scores a business's real-world signals (reviews, complaints, formality) into a single
trust report. This submission adds a payments and identity layer on top: a person proves they're
human once, and after that every signal query and every sealed-report verification is paid
individually via [x402](https://www.x402.org/), instead of drawing on Creva's shared API quota.

## How it works

1. **Onboarding — Selfie Check.** The mobile app authenticates the user with
   [Clerk](https://clerk.com/) and runs a liveness check via World's Selfie Check (no Orb
   hardware required). If World isn't configured, onboarding degrades to an
   `identity_unavailable` state instead of blocking the flow.
2. **Paid query.** The app requests a Creva signal report through a local gateway. The gateway
   gates the request behind x402: it returns a `402 Payment Required` with the price and payment
   details, and only proxies the request to Creva's API once a valid payment is presented.
3. **Sealed verification.** A previously issued report can be re-verified as authentic (not
   tampered with) via a separate, also x402-gated, endpoint.

```
app (Expo/React Native)  --x402-->  gateway (Express)  -->  Creva API
```

## What's in this repo

| Path | What it is |
|---|---|
| [`app/`](app/) | Expo/React Native client — three screens: `SelfieCheckScreen` (onboarding), `QueryScreen` (paid signal query), `VerifyScreen` (sealed-report verification) |
| [`gateway/`](gateway/) | Express server that gates `/creva-score/report` and `/creva-score/verify` behind x402 payment and proxies verified requests to Creva's API |

## Running it locally

### Gateway

```bash
cd gateway
npm install
cp .env.example .env   # fill in HEDERA_ACCOUNT_ID / HEDERA_PRIVATE_KEY / PAY_TO_ADDRESS
npm run dev
```

Runs on `http://localhost:8787` by default (`PORT` in `.env`). `GET /health` returns `{"status":"ok"}`.
Payments are checked against a Hedera testnet facilitator (`FACILITATOR_URL`, default
`http://localhost:4020`).

### App

```bash
cd app
npm install
cp .env.example .env   # fill in EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY and, optionally, World app id
npm start
```

Opens the Expo dev tools; scan the QR code with **Expo Go** on a device, or press `a`/`i`/`w` for
Android/iOS/web. The app expects the gateway to be reachable — see `app/lib/api.ts` for the base
URL it targets.

## Status

Both pieces run locally against a Hedera testnet facilitator. What has **not** yet been exercised
is a payment settled end-to-end against a live facilitator with real credentials — see this repo's
commit history and issue tracker for current status rather than this file, which describes the
architecture, not a point-in-time completion percentage.
