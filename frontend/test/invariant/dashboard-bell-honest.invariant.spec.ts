// dashboard-bell-honest.invariant.spec.ts: the dashboard now feeds buildReminders null for the
// credit/statement signals it never fetches. Invariant: with those unknown, no score value can
// produce a pending reminder — so the bell can never show a fabricated count.
import fc from "fast-check";
import { buildReminders, pendingCount } from "../../lib/reminders";

describe("invariant: the dashboard bell count is never fabricated", () => {
  it("pendingCount is 0 for every score value when credit + statements are unknown", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 100 })),
        fc.oneof(fc.constant(null), fc.constantFrom("ok", "insufficient_data", "pending")),
        (scoreValue, scoreStatus) => {
          const reminders = buildReminders({
            scoreStatus,
            scoreValue,
            creditEligible: null,
            creditMissing: [],
            statementCount: null,
            statementEntryCount: null,
          });
          expect(pendingCount(reminders)).toBe(0);
        },
      ),
      { numRuns: 500 },
    );
  });
});
