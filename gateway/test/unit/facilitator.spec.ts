// facilitator.spec.ts: verifies the gateway sends live-compatible x402 bodies to a facilitator.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentRequirements } from "../../src/types.js";

const originalFetch = global.fetch;

const requirements: PaymentRequirements = {
  scheme: "exact",
  network: "hedera-testnet",
  maxAmountRequired: "10000000",
  resource: "/creva-score/report",
  description: "Creva signal report",
  mimeType: "application/json",
  payTo: "0.0.1234",
  maxTimeoutSeconds: 60,
  asset: "HBAR",
};

describe("facilitator client", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.FACILITATOR_URL = "https://facilitator.example";
    process.env.FACILITATOR_AUTH_TOKEN = "test-token";
    process.env.FACILITATOR_FEE_PAYER = "0.0.7162784";
    process.env.X402_VERSION = "2";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
    delete process.env.FACILITATOR_URL;
    delete process.env.FACILITATOR_AUTH_TOKEN;
    delete process.env.FACILITATOR_FEE_PAYER;
    delete process.env.X402_VERSION;
  });

  it("decodes base64url X-PAYMENT into the standard facilitator payload", async () => {
    const paymentPayload = {
      x402Version: 1,
      scheme: "exact",
      network: "hedera-testnet",
      payload: { transaction: "signed-hedera-transfer" },
    };
    const header = Buffer.from(JSON.stringify(paymentPayload), "utf8").toString("base64url");

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ isValid: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const { verifyPayment } = await import("../../src/facilitator.js");
    await expect(verifyPayment(header, requirements)).resolves.toEqual({ isValid: true });

    expect(global.fetch).toHaveBeenCalledWith("https://facilitator.example/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer test-token",
      },
      body: expect.any(String),
    });

    const call = vi.mocked(global.fetch).mock.calls[0];
    expect(JSON.parse(String(call[1]?.body))).toEqual({
      x402Version: 2,
      paymentPayload,
      paymentRequirements: {
        scheme: "exact",
        network: "hedera-testnet",
        amount: "10000000",
        payTo: "0.0.1234",
        maxTimeoutSeconds: 60,
        asset: "HBAR",
        extra: { feePayer: "0.0.7162784" },
      },
    });
  });

  it("preserves opaque test headers so existing gate mocks keep working", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, transaction: "0.0.1234@1.2" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const { settlePayment } = await import("../../src/facilitator.js");
    await expect(settlePayment("valid-payment-header", requirements)).resolves.toEqual({
      success: true,
      transaction: "0.0.1234@1.2",
    });

    const call = vi.mocked(global.fetch).mock.calls[0];
    expect(JSON.parse(String(call[1]?.body))).toMatchObject({
      x402Version: 2,
      paymentPayload: "valid-payment-header",
      paymentRequirements: {
        amount: "10000000",
        extra: { feePayer: "0.0.7162784" },
      },
    });
  });
});
