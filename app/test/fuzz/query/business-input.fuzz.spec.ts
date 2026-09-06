// business-input.fuzz.spec.ts: the name field and state selector take whatever the user types.
// Property: the validators/mappers never throw and always return a well-formed result.
import fc from "fast-check";
import {
  buildSignalInput,
  isValidBusinessName,
  toStateCode,
} from "../../../features/query/business-input";

describe("business-input fuzz", () => {
  it("isValidBusinessName always returns a boolean, never throws", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), (input) => {
        expect(typeof isValidBusinessName(input)).toBe("boolean");
      }),
      { numRuns: 500 },
    );
  });

  it("toStateCode returns undefined or a finite integer, never throws", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 50 }), (input) => {
        const out = toStateCode(input);
        expect(out === undefined || (Number.isInteger(out) && out > 0)).toBe(true);
      }),
      { numRuns: 500 },
    );
  });

  it("buildSignalInput always yields { businessName: string, stateCode?: number }", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), fc.string({ maxLength: 50 }), (name, state) => {
        const out = buildSignalInput(name, state);
        expect(typeof out.businessName).toBe("string");
        expect(out.businessName).toBe(out.businessName.trim());
        expect(out.stateCode === undefined || typeof out.stateCode === "number").toBe(true);
      }),
      { numRuns: 500 },
    );
  });
});
