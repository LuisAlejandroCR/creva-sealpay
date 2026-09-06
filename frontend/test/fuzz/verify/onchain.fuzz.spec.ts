// onchain.fuzz.spec.ts: the `onchain` block is attacker-influenced data crossing the gateway
// trust boundary (a compromised or unavailable subgraph can return anything). Property:
// parseOnchain never throws and always returns null or a fully well-formed OnchainAttestation.
import fc from "fast-check";
import { parseOnchain } from "../../../features/verify/onchain";

const SIGNALS = new Set(["unattested", "attested", "corroborated"]);

describe("parseOnchain fuzz", () => {
  it("never throws on arbitrary JSON-ish input", () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        expect(() => parseOnchain(input)).not.toThrow();
      }),
      { numRuns: 1000 },
    );
  });

  it("output is null or a well-formed attestation", () => {
    fc.assert(
      fc.property(
        fc.record({
          attestationCount: fc.oneof(fc.integer(), fc.string(), fc.constant(null)),
          distinctAttesters: fc.oneof(fc.integer(), fc.string(), fc.constant(undefined)),
          lastAttestedAt: fc.oneof(fc.string(), fc.constant(null), fc.integer()),
          trustSignal: fc.oneof(fc.constantFrom("unattested", "attested", "corroborated"), fc.string()),
        }),
        (input) => {
          const out = parseOnchain(input);
          if (out === null) return;
          expect(typeof out.attestationCount).toBe("number");
          expect(Number.isFinite(out.attestationCount)).toBe(true);
          expect(typeof out.distinctAttesters).toBe("number");
          expect(out.lastAttestedAt === null || typeof out.lastAttestedAt === "string").toBe(true);
          expect(SIGNALS.has(out.trustSignal)).toBe(true);
        },
      ),
      { numRuns: 1000 },
    );
  });
});
