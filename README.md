<!-- README.md: what this submission is and how to run it — the public face of the repo, not the private prep notes. -->

# creva-sealpay

> **Verify a business is real in seconds — not weeks of calls and references.**

**ETHGlobal Online 2026 submission**, built on [Creva](https://creva.mx)'s existing product
through its Continuity track ([The Ship a Feature starting point](https://ethglobal.com/events/ethonline/info/start)).

## The problem

A small Mexican business trying to prove it's legitimate — to a lender, a partner, an agent
acting on someone's behalf — has no cheap way to do it. Creva already turns a business's
real-world signals (government registry checks, complaint history, formality of records) into a
single explainable trust report, signed so a third party can verify it without ever needing a
Creva account. What was missing: a way for *anyone* — a person or an autonomous agent — to pull
that signal on demand, pay for exactly what they use, and trust the answer came from Creva and
wasn't tampered with.

## What we built

A person proves they're human once (World's Selfie Check, no Orb hardware needed), and from then
on, every signal query and every sealed-report verification is metered and paid individually via
[x402](https://www.x402.org/) — instead of drawing on Creva's shared, rate-limited API quota. The
payment settles on Hedera.

```
app (Expo/React Native)  --x402-->  gateway (Express)  -->  Creva API
```

1. **Onboarding — Selfie Check.** Liveness check via World, no hardware Orb required. If World
   isn't configured, onboarding degrades gracefully instead of blocking the user.
2. **Paid query.** Requesting a Creva signal report gets gated by the gateway: a `402 Payment
   Required` with the price, unlocked once a valid Hedera payment is presented.
3. **Sealed verification.** Anyone holding a previously issued report — no account required — can
   re-verify it's authentic and untampered, also paid per call.

**Prize tracks targeted:** Hedera (AI & Agentic Payments — a live x402 service with a real
settled payment) and World (Selfie Check). Continuity track for the ETHGlobal submission itself.

## Try it

- **Demo video:** ⏳ recorded before the 2026-09-16 submission cutoff — link goes here.
- **Run it yourself:** see [Running it locally](#running-it-locally) below.

## Running it locally

```bash
cd gateway && npm install && cp .env.example .env && npm run dev   # fill Hedera vars in .env first
cd app && npm install && cp .env.example .env && npm start         # then scan the QR with Expo Go
```

Gateway defaults to `http://localhost:8787`, checks payments against a Hedera testnet facilitator
(`FACILITATOR_URL`). App env needs `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and reaches the gateway via
the base URL in `app/lib/api.ts`. Details: [`app/`](app/), [`gateway/`](gateway/).

## Status

Both pieces run locally and speak the live BlockyDevs testnet payment format. Not yet exercised:
a payment settled end-to-end against a live facilitator with real credentials — see commit history
for current status rather than this file.
