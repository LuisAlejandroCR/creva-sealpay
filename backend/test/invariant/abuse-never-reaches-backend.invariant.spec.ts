// abuse-never-reaches-backend.invariant.spec.ts: a request rejected for being oversized or for
// exceeding the per-IP rate limit must never reach the facilitator or the Creva proxy — the
// property that makes the hardening layer meaningful rather than cosmetic.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../../src/facilitator.js", () => ({
  verifyPayment: vi.fn(),
  settlePayment: vi.fn(),
}));

const originalFetch = global.fetch;

describe("abuse requests never reach the facilitator or Creva proxy", () => {
  let app: typeof import("../../src/index.js")["app"];
  let facilitator: typeof import("../../src/facilitator.js");
  let crevaFetch: ReturnType<typeof vi.fn>;

  const originalRateLimitEnv = process.env.GATEWAY_RATE_LIMIT_PER_MINUTE;

  beforeEach(async () => {
    vi.resetModules();
    process.env.NODE_ENV = "test";
    ({ app } = await import("../../src/index.js"));
    facilitator = await import("../../src/facilitator.js");
    crevaFetch = vi.fn();
    global.fetch = crevaFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
    if (originalRateLimitEnv === undefined) {
      delete process.env.GATEWAY_RATE_LIMIT_PER_MINUTE;
    } else {
      process.env.GATEWAY_RATE_LIMIT_PER_MINUTE = originalRateLimitEnv;
    }
  });

  it("an oversized body never reaches verifyPayment, settlePayment, or the Creva proxy", async () => {
    const res = await request(app)
      .post("/creva-score/report")
      .send({ businessId: "a".repeat(200_000) });

    expect(res.status).toBe(413);
    expect(facilitator.verifyPayment).not.toHaveBeenCalled();
    expect(facilitator.settlePayment).not.toHaveBeenCalled();
    expect(crevaFetch).not.toHaveBeenCalled();
  });

  it("requests past the per-IP rate limit never reach verifyPayment, settlePayment, or the Creva proxy", async () => {
    process.env.GATEWAY_RATE_LIMIT_PER_MINUTE = "5";
    vi.resetModules();
    ({ app } = await import("../../src/index.js"));
    facilitator = await import("../../src/facilitator.js");
    vi.mocked(facilitator.verifyPayment).mockResolvedValue({ isValid: false, invalidReason: "invalid_payment" });

    for (let i = 0; i < 5; i += 1) {
      await request(app).post("/creva-score/verify").send({});
    }
    vi.mocked(facilitator.verifyPayment).mockClear();

    const throttled = await request(app).post("/creva-score/verify").send({});

    expect(throttled.status).toBe(429);
    expect(facilitator.verifyPayment).not.toHaveBeenCalled();
    expect(facilitator.settlePayment).not.toHaveBeenCalled();
    expect(crevaFetch).not.toHaveBeenCalled();
  });
});
