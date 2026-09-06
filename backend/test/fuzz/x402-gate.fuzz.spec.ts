// x402-gate.fuzz.spec.ts: createX402Gate must never crash or leak a 5xx on arbitrary X-PAYMENT
// header values — the facilitator is mocked to always reject, so every input should resolve to a
// clean 402, never an unhandled exception reaching Express's default error handler.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import request from "supertest";

vi.mock("../../src/facilitator.js", () => ({
  verifyPayment: vi.fn().mockResolvedValue({ isValid: false, invalidReason: "invalid_payment" }),
  settlePayment: vi.fn(),
}));

describe("createX402Gate — arbitrary payment headers", () => {
  let app: typeof import("../../src/index.js")["app"];

  beforeEach(async () => {
    vi.resetModules();
    process.env.NODE_ENV = "test";
    ({ app } = await import("../../src/index.js"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("always responds 402 with a well-formed challenge, never a 5xx or a crash", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (paymentHeader) => {
        const res = await request(app)
          .post("/creva-score/report")
          .set("X-PAYMENT", paymentHeader || " ")
          .send({});

        expect(res.status).toBe(402);
        expect(res.body.x402Version).toBe(1);
        expect(Array.isArray(res.body.accepts)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
