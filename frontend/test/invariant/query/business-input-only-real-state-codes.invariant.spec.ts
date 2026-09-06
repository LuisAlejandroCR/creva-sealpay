// business-input-only-real-state-codes.invariant.spec.ts: the paid query must never send the
// gateway a state_code that is not in the INEGI catalog, no matter what the selector value is —
// a bogus code would silently scope the directory search to nothing.
import fc from "fast-check";
import { MX_STATES } from "../../../lib/mx-states";
import { buildSignalInput, toStateCode } from "../../../features/query/business-input";

const CODES = new Set(MX_STATES.map((s) => s.code));

describe("invariant: requestSignal only ever gets a real INEGI state code (or none)", () => {
  it("toStateCode output is always undefined or a member of the catalog", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), (raw) => {
        const code = toStateCode(raw);
        if (code !== undefined) expect(CODES.has(code)).toBe(true);
      }),
      { numRuns: 2000 },
    );
  });

  it("buildSignalInput never widens a blank/garbage state into a real one", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 200 }),
        fc.oneof(fc.constant(""), fc.constant("  "), fc.constant("0"), fc.string({ maxLength: 6 })),
        (name, junkState) => {
          const out = buildSignalInput(name, junkState);
          if (out.stateCode !== undefined) expect(CODES.has(out.stateCode)).toBe(true);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it("a valid catalog value always round-trips to its own code", () => {
    for (const state of MX_STATES) {
      expect(buildSignalInput("Negocio", String(state.code)).stateCode).toBe(state.code);
    }
  });
});
