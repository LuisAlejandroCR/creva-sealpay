// core-wiring.spec.ts: DashboardScreen no longer runs on mock data — it reads collateral, credit
// eligibility, statements and recent transactions from the real core API (like the reference
// dashboard/page.tsx), and only cardReady stays false because the core has no GET /cards.
import { readFileSync } from "fs";
import { join } from "path";
import fc from "fast-check";
import { buildReminders, pendingCount } from "../../../lib/reminders";

const source = readFileSync(
  join(__dirname, "../../../features/dashboard/DashboardScreen.tsx"),
  "utf-8",
);

describe("DashboardScreen core wiring", () => {
  it("loads the real endpoints the reference uses, in one Promise.allSettled", () => {
    expect(source).toMatch(/Promise\.allSettled\(\[/);
    for (const call of [
      /credit\.eligibility\(\)/,
      /statements\.list\(\)/,
      /statements\.summary\(\)/,
      /collateral\.get\(\)/,
      /transactions\.list\(\{ limit: 3 \}\)/,
    ]) {
      expect(source).toMatch(call);
    }
  });

  it("has no fabricated reminder inputs or mock transactions left", () => {
    expect(source).not.toMatch(/MOCK_TRANSACTIONS/);
    expect(source).not.toMatch(/creditEligible: true|statementCount: 2|scoreStatus: "ok"|statementEntryCount: 48/);
  });

  it("feeds buildReminders from state, never from literals", () => {
    expect(source).toMatch(/scoreStatus: scoreData\?\.status \?\? null/);
    expect(source).toMatch(/buildReminders\(\{[\s\S]*?creditEligible,[\s\S]*?statementCount,[\s\S]*?\}\)/);
    expect(source).toMatch(/setCreditEligible\(elig\.status === "fulfilled"/);
  });

  it("keeps cardReady honestly false while the core has no GET /cards", () => {
    expect(source).toMatch(/const \[cardReady\] = useState\(false\)/);
    expect(source).toMatch(/core exposes GET \/cards|no GET \/cards/);
  });
});

describe("invariant: an all-failed load leaves the bell empty", () => {
  it("every API rejecting → null inputs → zero pending, no fabricated badge", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 100 })),
        (scoreValue) => {
          const reminders = buildReminders({
            scoreStatus: null,
            scoreValue,
            creditEligible: null,
            creditMissing: [],
            statementCount: null,
            statementEntryCount: null,
          });
          expect(pendingCount(reminders)).toBe(0);
        },
      ),
      { numRuns: 300 },
    );
  });
});
