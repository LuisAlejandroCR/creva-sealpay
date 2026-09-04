// x402-gate.invariant.spec.ts: without an X-PAYMENT header, both gated routes must always return
// 402 — regardless of request body — since that's the one guarantee the x402 protocol depends on
// (a client must never see a 200 without paying, no matter what it sends).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import request from "supertest";

vi.mock("../../src/facilitator.js", () => ({
  verifyPayment: vi.fn(),
  settlePayment: vi.fn(),
}));

describe("createX402Gate — no-payment invariant", () => {
  let app: typeof import("../../src/index.js")["app"];

  beforeEach(async () => {
    vi.resetModules();
    process.env.NODE_ENV = "test";
    ({ app } = await import("../../src/index.js"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const route of ["/creva-score/report", "/creva-score/verify"]) {
    it(`${route} never returns 200 without X-PAYMENT, for any request body`, async () => {
      await fc.assert(
        fc.asyncProperty(fc.dictionary(fc.string(), fc.jsonValue()), async (body) => {
          const res = await request(app).post(route).send(body);
          expect(res.status).toBe(402);
        }),
        { numRuns: 100 },
      );
    });
  }
});
