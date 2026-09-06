// gatewayClient.spec.ts: mocks the network layer (global.fetch), not the business logic — asserts
// requestSignal talks to the real /creva-score/report gateway route and parses its real 402/200
// shapes (gateway/src/index.ts:66-73, gateway/src/x402-gate.ts:16-27).
import { requestSignal } from "../../../features/query/gatewayClient";

const originalFetch = global.fetch;

function mock402() {
  global.fetch = jest.fn().mockResolvedValue({
    status: 402,
    ok: false,
    headers: { get: () => null },
    json: () =>
      Promise.resolve({
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: "hedera-testnet",
            maxAmountRequired: "300000",
            resource: "/creva-score/report",
            description: "Creva signal report",
            mimeType: "application/json",
            payTo: "0.0.real-gateway-account",
            maxTimeoutSeconds: 60,
            asset: "USDC",
          },
        ],
        error: "payment_required",
      }),
  }) as jest.Mock;
}

const SEALED_REPORT = {
  report: {
    generated_at: "2026-09-01T00:00:00.000Z",
    subject: { business_name: "Panaderia La Espiga", state_code: 9 },
    signals: [],
    sources: [],
    disclosure: {
      score_version: "1.0",
      kind: "descriptive",
      window_days: 90,
      describes: "",
      does_not_estimate: [],
      provenance_levels: [],
      checked_at: "2026-09-01T00:00:00.000Z",
    },
    notes: [],
  },
  certificate: {
    schema: "creva-report-v1",
    algorithm: "sha256",
    generated_at: "2026-09-01T00:00:00.000Z",
    folio: "SP-2026-000123",
    report_digest: "digest",
    signature: null,
    proves: [],
    does_not_prove: [],
    how_to_verify: [],
  },
};

function mock200() {
  global.fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    headers: { get: (name: string) => (name === "x-payment-response" ? null : null) },
    json: () => Promise.resolve(SEALED_REPORT),
  }) as jest.Mock;
}

afterEach(() => {
  global.fetch = originalFetch;
});

describe("requestSignal", () => {
  it("returns 402 without a payment header", async () => {
    mock402();
    const res = await requestSignal({ businessName: "Panaderia La Espiga" });
    expect(res.status).toBe(402);
    if (res.status !== 402) throw new Error("expected 402");
    expect(res.accepts[0].resource).toBe("/creva-score/report");

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["X-PAYMENT"]).toBeUndefined();
  });

  it("returns the real sealed report on 200 and attaches the X-PAYMENT header when supplied", async () => {
    mock200();
    const res = await requestSignal({ businessName: "Panaderia La Espiga" }, "paid-proof");
    expect(res.status).toBe(200);
    if (res.status !== 200) throw new Error("expected 200");
    expect(res.report.certificate.folio).toBe("SP-2026-000123");

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["X-PAYMENT"]).toBe("paid-proof");
  });

  it("tolerates a malformed X-PAYMENT-RESPONSE header instead of throwing", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: { get: (name: string) => (name === "x-payment-response" ? "not-json" : null) },
      json: () => Promise.resolve(SEALED_REPORT),
    }) as jest.Mock;

    const res = await requestSignal({ businessName: "Panaderia La Espiga" });
    expect(res.status).toBe(200);
    if (res.status !== 200) throw new Error("expected 200");
    expect(res.settlement).toBeNull();
  });

  it("throws on a non-402 failure instead of returning fake data", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      ok: false,
      headers: { get: () => null },
      json: () => Promise.resolve({ error: "creva_auth_unavailable" }),
    }) as jest.Mock;

    await expect(requestSignal({ businessName: "Panaderia La Espiga" })).rejects.toThrow("creva_auth_unavailable");
  });
});
