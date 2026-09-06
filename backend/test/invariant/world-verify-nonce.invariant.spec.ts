// world-verify-nonce.invariant.spec.ts: hard security property for the server-issued nonce —
// a proof whose nonce does not match one the gateway issued (for that exact action, unspent,
// unexpired) is ALWAYS rejected, and the World Developer Portal is never contacted for it.
// Distinct from onboarding-never-succeeds-unverified: that one asserts route plumbing with
// verifyWorldIdProof mocked; this exercises the real nonce ledger inside verifyWorldIdProof.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";

const originalFetch = global.fetch;
const ACTION = "selfie-check-onboarding";

const baseProof = {
  merkle_root: "0xmerkle",
  nullifier_hash: "0xnull",
  proof: "0xproof",
  verification_level: "device",
  action: ACTION,
};

describe("invariant: an unmatched nonce is always rejected and never reaches World", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.WORLD_API_KEY = "test-key";
    process.env.WORLD_APP_ID = "app_test123";
    process.env.WORLD_VERIFY_URL = "https://developer.world.example/api/v4/verify";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
    delete process.env.WORLD_API_KEY;
    delete process.env.WORLD_APP_ID;
    delete process.env.WORLD_VERIFY_URL;
  });

  it("rejects any nonce that was not the one issued", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (candidateNonce) => {
        vi.resetModules();
        const fetchSpy = vi.fn();
        global.fetch = fetchSpy as unknown as typeof fetch;
        const mod = await import("../../src/world-verify.js");
        const session = mod.issueWorldIdSession(ACTION)!;

        // Only the exact issued nonce may pass the ledger check.
        if (candidateNonce === session.nonce) return;

        const res = await mod.verifyWorldIdProof({ ...baseProof, nonce: candidateNonce });
        expect(res.verified).toBe(false);
        expect(res.reason?.startsWith("world_verify_nonce_")).toBe(true);
        expect(fetchSpy).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });

  it("rejects the issued nonce once it has already been spent", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, nullifier: "0xn" }), { status: 200 }),
    );
    global.fetch = fetchSpy as unknown as typeof fetch;
    const mod = await import("../../src/world-verify.js");
    const session = mod.issueWorldIdSession(ACTION)!;

    const first = await mod.verifyWorldIdProof({ ...baseProof, nonce: session.nonce });
    expect(first.verified).toBe(true);

    await fc.assert(
      fc.asyncProperty(fc.constant(session.nonce), async (nonce) => {
        const res = await mod.verifyWorldIdProof({ ...baseProof, nonce });
        expect(res).toEqual({ verified: false, reason: "world_verify_nonce_used" });
      }),
      { numRuns: 10 },
    );
  });
});
