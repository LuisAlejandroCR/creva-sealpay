<!-- README.md: public entry point for Creva SealPay, the ETHOnline 2026 submission.
     It states what is built, how to run it, and what remains unverified.
     Planning detail lives in docs/plan.md; session history lives in docs/memoria.md. -->

# Creva SealPay

Creva SealPay is an ETHOnline 2026 Continuity submission. It adds a mobile app and x402 gateway
around Creva: a user completes World Selfie Check, then agents or clients pay per signal query and
per report verification before Creva's signed response is returned.

Creva's private repo remains the source of truth for scoring, provider integrations, credentials,
and infrastructure. This public repo contains the submission surface only.

## What's Built

| Area | Status |
|---|---|
| `app/` | Expo SDK 57 app with onboarding, paid query, report verification, haptics hooks, and client helpers |
| `gateway/` | Express gateway for `POST /creva-score/report` and `POST /creva-score/verify` behind x402 |
| `docs/` | SDD planning and implementation record for judges and agents |

## Run

```bash
cd app
npm install
npm run typecheck
npm test
npm start
```

```bash
cd gateway
npm install
npm run typecheck
npm run lint
npm test
npm run dev
```

Environment templates live in `app/.env.example` and `gateway/.env.example`.

## Verification

Latest documented pass on `main`:

- `app`: TypeScript clean, Jest 16 suites / 100 tests, `expo export --platform ios` bundled.
- `gateway`: TypeScript clean, ESLint clean, Vitest 3 suites / 9 tests.

Still pending:

- Physical Expo Go run with real Clerk and World credentials.
- Live Hedera testnet settlement through a real facilitator.
- Demo video and final submission assets.
