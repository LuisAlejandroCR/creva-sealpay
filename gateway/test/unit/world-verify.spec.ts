// world-verify.spec.ts: server-side World ID proof verification against a mocked Developer
// Portal API — never a real WORLD_API_KEY, never a real network call.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorldIdProofPayload } from "../../src/world-verify.js";

const originalFetch = global.fetch;

const validProof: WorldIdProofPayload = {
  merkle_root: "0xmerkle",
  nullifier_hash: "0xnullifier",
  proof: "0xproof",
  verification_level: "device",
  action: "selfie-check-onboarding",
};

describe("world-verify", () => {
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

  it("returns verified with the nullifier when the Developer Portal accepts the proof", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, nullifier: "0xnullifier" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const { verifyWorldIdProof } = await import("../../src/world-verify.js");
    await expect(verifyWorldIdProof(validProof)).resolves.toEqual({
      verified: true,
      nullifierHash: "0xnullifier",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://developer.world.example/api/v4/verify/app_test123",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-key",
        },
      }),
    );
  });

  it("returns unverified when the Developer Portal rejects the proof", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, code: "all_verifications_failed" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const { verifyWorldIdProof } = await import("../../src/world-verify.js");
    await expect(verifyWorldIdProof(validProof)).resolves.toEqual({
      verified: false,
      reason: "world_verify_rejected",
    });
  });

  it("fails closed when WORLD_API_KEY is missing, never leaking the absent key in the reason", async () => {
    delete process.env.WORLD_API_KEY;
    global.fetch = vi.fn();

    const { verifyWorldIdProof } = await import("../../src/world-verify.js");
    await expect(verifyWorldIdProof(validProof)).resolves.toEqual({
      verified: false,
      reason: "world_verify_not_configured",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fails closed on a network error instead of throwing", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const { verifyWorldIdProof } = await import("../../src/world-verify.js");
    await expect(verifyWorldIdProof(validProof)).resolves.toEqual({
      verified: false,
      reason: "world_verify_network_error",
    });
  });

  it("rejects a request body missing required proof fields before calling the API", async () => {
    global.fetch = vi.fn();
    const { isValidProofPayload } = await import("../../src/world-verify.js");

    expect(isValidProofPayload({ ...validProof, merkle_root: "" })).toBe(false);
    expect(isValidProofPayload({ ...validProof, proof: undefined })).toBe(false);
    expect(isValidProofPayload(null)).toBe(false);
    expect(isValidProofPayload(validProof)).toBe(true);
  });
});
