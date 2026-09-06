<!-- README.md: root guide for this ETHOnline 2026 submission repo.
     It explains the folder focus, reading order, and current code surfaces.
     Product and status detail live in docs/plan.md and docs/memoria.md. -->

# ETHOnline 2026 — Creva SealPay

This is the public submission repo for Creva SealPay, an ETHOnline 2026 Continuity / Ship a Feature
project built around Creva.

The focus stays the same: document the hackathon work clearly, keep Creva's private business logic
out of the public repo, and expose only the submission surface that consumes Creva through its API.

## What's Here

| Path | Purpose |
|---|---|
| `app/` | Expo app for Selfie Check, paid queries, and signed report verification |
| `gateway/` | Express x402 gateway for Creva report and verification routes |
| `docs/plan.md` | Current checklist and acceptance criteria |
| `docs/memoria.md` | Short session record: done, not verified, pending |
| `brainstorming.md` | Track rationale and sponsor analysis |
| `LEARNINGS.md` | Project learnings while the work is alive |
| `AGENTS.md` | Collaboration and documentation rules |

## Start Here

1. Read `AGENTS.md`.
2. Read `docs/plan.md` for what is open or closed today.
3. Read `brainstorming.md` §8-9 for the why behind the plan.
4. Check the real repo state before changing anything.

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

## Still Pending

- Physical Expo Go run with real Clerk and World credentials.
- Live Hedera testnet settlement through a real facilitator.
- Demo video and final submission assets.
