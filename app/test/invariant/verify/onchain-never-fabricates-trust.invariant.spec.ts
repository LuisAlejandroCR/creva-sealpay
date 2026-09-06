// onchain-never-fabricates-trust.invariant.spec.ts: mirrors the gateway's
// onchain-never-overrides-core-verdict invariant on the app side — the client must never upgrade a
// report's trust from a missing or malformed `onchain` block. Absent/bad data is always null,
// never "attested" or "corroborated".
import fc from "fast-check";
import { parseOnchain } from "../../../features/verify/onchain";

describe("invariant: on-chain trust is never fabricated by the client", () => {
  it("a block without a valid trustSignal is always null", () => {
    fc.assert(
      fc.property(
        fc.record(
          {
            attestationCount: fc.integer({ min: 0, max: 1000 }),
            distinctAttesters: fc.integer({ min: 0, max: 1000 }),
            lastAttestedAt: fc.oneof(
              fc.constant(null),
              fc.integer({ min: 0, max: 4102444800000 }).map((ms) => new Date(ms).toISOString()),
            ),
            trustSignal: fc.string().filter((s) => !["unattested", "attested", "corroborated"].includes(s)),
          },
          { requiredKeys: ["attestationCount", "distinctAttesters"] },
        ),
        (block) => {
          expect(parseOnchain(block)).toBeNull();
        },
      ),
      { numRuns: 1000 },
    );
  });

  it("never returns a non-null result whose trustSignal is outside the three known states", () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const out = parseOnchain(input);
        if (out !== null) {
          expect(["unattested", "attested", "corroborated"]).toContain(out.trustSignal);
        }
      }),
      { numRuns: 2000 },
    );
  });

  it("dropping the trustSignal key entirely never yields corroboration", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (count, attesters) => {
          expect(parseOnchain({ attestationCount: count, distinctAttesters: attesters })).toBeNull();
        },
      ),
      { numRuns: 500 },
    );
  });
});
