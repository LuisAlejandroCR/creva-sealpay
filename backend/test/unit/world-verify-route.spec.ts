// world-verify-route.spec.ts: the two onboarding HTTP routes — GET /onboarding/world-id/session
// (mint a nonce) and POST /onboarding/verify-world-id (verify a proof). The session route feeds
// a real nonce into the verify route so the round-trip is exercised end to end, with the World
// Developer Portal call itself mocked.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

describe("onboarding World ID routes", () => {
  let app: typeof import("../../src/index.js")["app"];

  beforeEach(async () => {
    vi.resetModules();
    process.env.NODE_ENV = "test";
    process.env.WORLD_API_KEY = "test-key";
    process.env.WORLD_APP_ID = "app_test123";
    process.env.WORLD_VERIFY_URL = "https://developer.world.example/api/v4/verify";
    ({ app } = await import("../../src/index.js"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.WORLD_API_KEY;
    delete process.env.WORLD_APP_ID;
    delete process.env.WORLD_VERIFY_URL;
  });

  it("issues a nonce session that then verifies a proof end to end", async () => {
    const sessionRes = await request(app).get("/onboarding/world-id/session");
    expect(sessionRes.status).toBe(200);
    expect(typeof sessionRes.body.nonce).toBe("string");
    expect(sessionRes.body.nonce.length).toBeGreaterThan(0);
    expect(sessionRes.body.action).toBe("selfie-check-onboarding");

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, nullifier: "0xok" }), { status: 200 }),
    ) as unknown as typeof fetch;

    const verifyRes = await request(app)
      .post("/onboarding/verify-world-id")
      .send({
        nonce: sessionRes.body.nonce,
        merkle_root: "0xm",
        nullifier_hash: "0xn",
        proof: "0xp",
        verification_level: "device",
        action: "selfie-check-onboarding",
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body).toEqual({ verified: true, nullifierHash: "0xok" });
  });

  it("rejects a proof with a forged nonce as 401, never contacting World", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const res = await request(app)
      .post("/onboarding/verify-world-id")
      .send({
        nonce: "forged",
        merkle_root: "0xm",
        nullifier_hash: "0xn",
        proof: "0xp",
        verification_level: "device",
        action: "selfie-check-onboarding",
      });

    expect(res.status).toBe(401);
    expect(res.body.verified).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("400s a payload with no nonce field", async () => {
    const res = await request(app)
      .post("/onboarding/verify-world-id")
      .send({
        merkle_root: "0xm",
        nullifier_hash: "0xn",
        proof: "0xp",
        verification_level: "device",
        action: "selfie-check-onboarding",
      });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ verified: false, reason: "invalid_proof_payload" });
  });

  it("503s the session route when World is not configured", async () => {
    vi.resetModules();
    delete process.env.WORLD_API_KEY;
    delete process.env.WORLD_APP_ID;
    const { app: freshApp } = await import("../../src/index.js");
    const res = await request(freshApp).get("/onboarding/world-id/session");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ reason: "world_verify_not_configured" });
  });
});
