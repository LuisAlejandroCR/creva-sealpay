// backend-pending.fuzz.spec.ts: ApiError classification is derived from an attacker-influenced
// status code + whether a token was sent. Property: backendUnlinked is exactly
// (status === 401 && tokenAttached) for every input, and isBackendUnlinked never throws.
import fc from "fast-check";
import { ApiError, isBackendUnlinked } from "../../lib/api";

describe("ApiError / isBackendUnlinked fuzz", () => {
  it("backendUnlinked === (401 && tokenAttached), for any status/body/token", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 599 }),
        fc.boolean(),
        fc.anything(),
        (status, tokenAttached, body) => {
          const err = new ApiError("msg", status, body, tokenAttached);
          expect(err.backendUnlinked).toBe(status === 401 && tokenAttached);
          expect(isBackendUnlinked(err)).toBe(status === 401 && tokenAttached);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it("isBackendUnlinked never throws on arbitrary input", () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isBackendUnlinked(value)).not.toThrow();
      }),
      { numRuns: 1000 },
    );
  });
});
