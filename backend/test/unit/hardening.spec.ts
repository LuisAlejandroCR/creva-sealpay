// hardening.spec.ts: covers the abuse-prevention layer added on top of x402 gating — an oversized
// body is rejected before reaching the gate, a settled X-PAYMENT proof can't be replayed, and
// helmet's baseline security headers are present on every response.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../../src/facilitator.js", () => ({
  verifyPayment: vi.fn(),
  settlePayment: vi.fn(),
}));

vi.mock("../../src/creva-auth.js", () => ({
  getCrevaAccessToken: vi.fn().mockResolvedValue("test-access-token"),
}));

const originalFetch = global.fetch;

describe("gateway hardening", () => {
  let app: typeof import("../../src/index.js")["app"];
  let facilitator: typeof import("../../src/facilitator.js");

  beforeEach(async () => {
    vi.resetModules();
    process.env.NODE_ENV = "test";
    ({ app } = await import("../../src/index.js"));
    facilitator = await import("../../src/facilitator.js");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("rejects a body over the 100kb cap before it reaches the x402 gate", async () => {
    const oversizedBody = { businessId: "a".repeat(200_000) };

    const res = await request(app).post("/creva-score/report").send(oversizedBody);

    expect(res.status).toBe(413);
    expect(facilitator.verifyPayment).not.toHaveBeenCalled();
  });

  it("sets baseline security headers via helmet", async () => {
    const res = await request(app).post("/creva-score/report").send({});

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-dns-prefetch-control"]).toBeDefined();
  });

  it("rejects a second call reusing the same X-PAYMENT proof", async () => {
    vi.mocked(facilitator.verifyPayment).mockResolvedValue({ isValid: true });
    vi.mocked(facilitator.settlePayment).mockResolvedValue({
      success: true,
      transaction: "0.0.1234@1700000000.000000000",
      network: "hedera-testnet",
    });
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ verdict: "ok" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const first = await request(app)
      .post("/creva-score/report")
      .set("X-PAYMENT", "same-proof")
      .send({ businessId: "abc123" });
    expect(first.status).toBe(200);

    const replay = await request(app)
      .post("/creva-score/report")
      .set("X-PAYMENT", "same-proof")
      .send({ businessId: "abc123" });

    expect(replay.status).toBe(402);
    expect(replay.body.error).toBe("payment_already_used");
    expect(facilitator.settlePayment).toHaveBeenCalledTimes(1);
  });
});
