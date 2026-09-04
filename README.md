<!-- README.md: what this folder is, what's inside, and in what order to read it. -->

# ETHOnline 2026

> **Hard rule for every agent — see [`AGENTS.md`](AGENTS.md):** check the repo and the `main`
> branch before touching anything, and always close out by documenting what was done, what was
> not verified, and why — that's the context the other agents rely on.

Working folder for the ETHGlobal hackathon, **September 4–16, 2026**, online and asynchronous.
Preparation lives here; **the event's code does not** — it goes into a separate public repo that
doesn't exist yet.

## What's here

| File | What it is |
|---|---|
| [AGENTS.md](AGENTS.md) | The constitution: worktree/subagent collaboration rules, the language rule, and the ruleset's SDD exception — **read it before touching any file** |
| [docs/plan.md](docs/plan.md) | The actionable checklist: what's missing today, with acceptance criteria per block |
| [docs/estado.html](docs/estado.html) | Interactive status + roadmap map (built with `archify`) — regenerated from `docs/estado.lifecycle.json` each time a block closes |
| [brainstorming.md](brainstorming.md) | The central document: rules, Creva's real inventory, eight scored ideas, the recommendation, the slice, the kickoff status, and the finalist calendar (§8-9) |
| [LEARNINGS.md](LEARNINGS.md) | What was learned while the project is alive — filled in the day something costs, not at the end |
| `.env` | Working keys. **Never committed** |

## In one line

Creva enters through a **Continuity** track — which allows extending an existing product — with a
payments angle: the entrepreneur proves she's human once, and from then on **every signal query
and every seal verification is paid via x402**, instead of drawing on Creva's shared quota.

## Before touching anything

1. **Read all of [brainstorming.md](brainstorming.md)**, starting with §0 (the findings that drive
   everything) and §2 (the corrected inventory — three pieces Creva's `.md` files assumed were live
   don't exist).
2. **§8 is the real kickoff status.** Everything else is analysis; that table is what's missing
   today.
3. Submission rules come from `procedures/00_Files/sponsor_track_rules.md` and
   `slice_demo_hackathon.md`, not from here.

## Rules specific to this folder

- **Nothing built during the event lives here.** It goes to the public repo, and consumes Creva
  through its API — the same way `creva-zk` did in the Midnight hackathon.
- **Don't build the integration ahead of time.** Continuity allows bringing prior code, but **the
  work being judged is built during the event.** Writing the x402 layer or the Selfie Check
  adapter beforehand is what disqualifies an entry.
- **Every figure carries a source and a date.** A prize, a deadline, or a requirement without both
  is an assumption, and gets marked `⏳`.
- **State only what the code actually does.** A README describing a feature that isn't there is
  the cheapest way to get disqualified.
# creva-sealpay
