// x402-gate.spec.ts: covers the 402-unpaid and paid-then-proxied paths for both gated routes.
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

describe("x402-gated creva-score routes", () => {
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

  for (const route of ["/creva-score/report", "/creva-score/verify"]) {
    it(`returns 402 with a payment challenge when unpaid: ${route}`, async () => {
      const res = await request(app).post(route).send({});

      expect(res.status).toBe(402);
      expect(res.body.x402Version).toBe(1);
      expect(res.body.accepts[0]).toMatchObject({
        scheme: "exact",
        network: "hedera:testnet",
        resource: route,
      });
    });

    it(`proxies to Creva once payment settles (verify also gets an onchain block): ${route}`, async () => {
      vi.mocked(facilitator.verifyPayment).mockResolvedValue({ isValid: true });
      vi.mocked(facilitator.settlePayment).mockResolvedValue({
        success: true,
        transaction: "0.0.1234@1700000000.000000000",
        network: "hedera-testnet",
      });

      const crevaBody = { verdict: "ok", score: 742 };
      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(crevaBody), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ) as unknown as typeof fetch;

      const res = await request(app)
        .post(route)
        .set("X-PAYMENT", "valid-payment-header")
        .send({ businessId: "abc123" });

      expect(res.status).toBe(200);
      if (route === "/creva-score/verify") {
        // Core verdict passes through untouched; the onchain block is added alongside it and is
        // null here because SUBGRAPH_URL is not configured in the test env.
        expect(res.body).toMatchObject(crevaBody);
        expect(res.body.onchain).toBeNull();
        expect(res.body.onchainError).toBe("subgraph_not_configured");
      } else {
        expect(res.body).toEqual(crevaBody);
      }
      expect(res.headers["x-payment-response"]).toBeDefined();
    });

    it(`returns 402 again when the facilitator rejects the payment: ${route}`, async () => {
      vi.mocked(facilitator.verifyPayment).mockResolvedValue({
        isValid: false,
        invalidReason: "insufficient_funds",
      });

      const res = await request(app)
        .post(route)
        .set("X-PAYMENT", "bad-payment-header")
        .send({});

      expect(res.status).toBe(402);
      expect(res.body.error).toBe("insufficient_funds");
    });
  }
});
