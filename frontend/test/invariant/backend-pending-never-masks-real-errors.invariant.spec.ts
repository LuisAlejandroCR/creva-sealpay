// backend-pending-never-masks-real-errors.invariant.spec.ts: the "backend pending" state must
// never absorb a genuine failure. Invariants: a non-401 is never backendUnlinked; a plain thrown
// Error (a network drop, a parse crash) is never backendUnlinked; and a 401 without a token
// (a truly dead session) is never backendUnlinked — that user still needs to sign in.
import fc from "fast-check";
import { ApiError, isBackendUnlinked } from "../../lib/api";

describe("invariant: backend-pending never hides a real error", () => {
  it("no non-401 status is ever backendUnlinked, regardless of token or body", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 599 }).filter((s) => s !== 401),
        fc.boolean(),
        fc.anything(),
        (status, token, body) => {
          expect(isBackendUnlinked(new ApiError("e", status, body, token))).toBe(false);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it("a plain Error is never backendUnlinked", () => {
    fc.assert(
      fc.property(fc.string(), (msg) => {
        expect(isBackendUnlinked(new Error(msg))).toBe(false);
        expect(isBackendUnlinked(new TypeError(msg))).toBe(false);
      }),
      { numRuns: 300 },
    );
  });

  it("a 401 with no token attached is never backendUnlinked", () => {
    fc.assert(
      fc.property(fc.anything(), (body) => {
        expect(isBackendUnlinked(new ApiError("e", 401, body, false))).toBe(false);
      }),
      { numRuns: 300 },
    );
  });
});
