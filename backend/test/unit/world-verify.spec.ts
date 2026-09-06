// world-verify.spec.ts: server-side World ID proof verification against a mocked Developer
// Portal API — never a real WORLD_API_KEY, never a real network call. Covers the server-issued
// nonce lifecycle (issue -> single-use -> TTL / action binding) and the v4 request shape.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorldIdProofPayload } from "../../src/world-verify.js";

const originalFetch = global.fetch;
const ACTION = "selfie-check-onboarding";

const baseProof: Omit<WorldIdProofPayload, "nonce"> = {
  merkle_root: "0xmerkle",
  nullifier_hash: "0xnullifier",
  proof: "0xproof",
  verification_level: "device",
  action: ACTION,
};

async function loadModule() {
  return import("../../src/world-verify.js");
}

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
    delete process.env.WORLD_RP_ID;
  });

  it("returns verified with the nullifier when the Developer Portal accepts the proof", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, nullifier: "0xnullifier" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const mod = await loadModule();
    const session = mod.issueWorldIdSession(ACTION)!;
    await expect(
      mod.verifyWorldIdProof({ ...baseProof, nonce: session.nonce }),
    ).resolves.toEqual({ verified: true, nullifierHash: "0xnullifier" });

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

  it("sends a protocol_version 3.0 body carrying the issued nonce", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, nullifier: "0xn" }), { status: 200 }),
    ) as unknown as typeof fetch;

    const mod = await loadModule();
    const session = mod.issueWorldIdSession(ACTION)!;
    await mod.verifyWorldIdProof({ ...baseProof, nonce: session.nonce, signal: "0xsig" });

    const body = JSON.parse((vi.mocked(global.fetch).mock.calls[0][1] as { body: string }).body);
    expect(body).toMatchObject({
      protocol_version: "3.0",
      nonce: session.nonce,
      action: ACTION,
      allow_legacy_proofs: true,
      responses: [
        {
          identifier: "device",
          merkle_root: "0xmerkle",
          nullifier: "0xnullifier",
          proof: "0xproof",
          signal_hash: "0xsig",
        },
      ],
    });
  });

  it("targets WORLD_RP_ID when set, not the app id", async () => {
    process.env.WORLD_RP_ID = "rp_abc";
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    ) as unknown as typeof fetch;

    const mod = await loadModule();
    const session = mod.issueWorldIdSession(ACTION)!;
    await mod.verifyWorldIdProof({ ...baseProof, nonce: session.nonce });

    expect(vi.mocked(global.fetch).mock.calls[0][0]).toBe(
      "https://developer.world.example/api/v4/verify/rp_abc",
    );
  });

  it("rejects a proof whose nonce was never issued, without calling the API", async () => {
    global.fetch = vi.fn();
    const mod = await loadModule();
    await expect(
      mod.verifyWorldIdProof({ ...baseProof, nonce: "0xnot-issued" }),
    ).resolves.toEqual({ verified: false, reason: "world_verify_nonce_unknown" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects a nonce replayed a second time", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, nullifier: "0xn" }), { status: 200 }),
    ) as unknown as typeof fetch;

    const mod = await loadModule();
    const session = mod.issueWorldIdSession(ACTION)!;
    await mod.verifyWorldIdProof({ ...baseProof, nonce: session.nonce });
    await expect(
      mod.verifyWorldIdProof({ ...baseProof, nonce: session.nonce }),
    ).resolves.toEqual({ verified: false, reason: "world_verify_nonce_used" });
  });

  it("rejects a nonce presented under a different action", async () => {
    global.fetch = vi.fn();
    const mod = await loadModule();
    const session = mod.issueWorldIdSession(ACTION)!;
    await expect(
      mod.verifyWorldIdProof({ ...baseProof, nonce: session.nonce, action: "other-action" }),
    ).resolves.toEqual({ verified: false, reason: "world_verify_nonce_action_mismatch" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns unverified when the Developer Portal rejects the proof", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, code: "all_verifications_failed" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const mod = await loadModule();
    const session = mod.issueWorldIdSession(ACTION)!;
    await expect(
      mod.verifyWorldIdProof({ ...baseProof, nonce: session.nonce }),
    ).resolves.toEqual({ verified: false, reason: "world_verify_rejected" });
  });

  it("fails closed when WORLD_API_KEY is missing, never leaking the absent key in the reason", async () => {
    delete process.env.WORLD_API_KEY;
    global.fetch = vi.fn();

    const mod = await loadModule();
    await expect(
      mod.verifyWorldIdProof({ ...baseProof, nonce: "anything" }),
    ).resolves.toEqual({ verified: false, reason: "world_verify_not_configured" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("issueWorldIdSession returns null when World is not configured", async () => {
    delete process.env.WORLD_APP_ID;
    const mod = await loadModule();
    expect(mod.issueWorldIdSession(ACTION)).toBeNull();
  });

  it("fails closed on a network error instead of throwing", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const mod = await loadModule();
    const session = mod.issueWorldIdSession(ACTION)!;
    await expect(
      mod.verifyWorldIdProof({ ...baseProof, nonce: session.nonce }),
    ).resolves.toEqual({ verified: false, reason: "world_verify_network_error" });
  });

  it("rejects a request body missing required proof fields before calling the API", async () => {
    global.fetch = vi.fn();
    const { isValidProofPayload } = await loadModule();
    const valid = { ...baseProof, nonce: "0xnonce" };

    expect(isValidProofPayload({ ...valid, nonce: "" })).toBe(false);
    expect(isValidProofPayload({ ...valid, merkle_root: "" })).toBe(false);
    expect(isValidProofPayload({ ...valid, proof: undefined })).toBe(false);
    expect(isValidProofPayload(null)).toBe(false);
    expect(isValidProofPayload(valid)).toBe(true);
  });
});
