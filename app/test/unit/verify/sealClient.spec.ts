// sealClient.spec.ts: mocks the network layer (global.fetch), not the business logic — asserts
// verifySealedReport talks to the real /creva-score/verify gateway route (gateway/src/index.ts:75-82)
// and parses its real 402/200 shapes, never inventing a verdict.
import { verifySealedReport } from "../../../features/verify/sealClient";
import type { SealedReport } from "../../../lib/api";

const originalFetch = global.fetch;

const SEALED: SealedReport = {
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

afterEach(() => {
  global.fetch = originalFetch;
});

describe("verifySealedReport", () => {
  it("returns 402 without a payment header", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 402,
      ok: false,
      json: () =>
        Promise.resolve({
          x402Version: 1,
          accepts: [
            {
              scheme: "exact",
              network: "hedera-testnet",
              maxAmountRequired: "50000",
              resource: "/creva-score/verify",
              description: "Creva seal verification",
              mimeType: "application/json",
              payTo: "0.0.real-gateway-account",
              maxTimeoutSeconds: 60,
              asset: "USDC",
            },
          ],
          error: "payment_required",
        }),
    }) as jest.Mock;

    const res = await verifySealedReport(SEALED);
    expect(res.status).toBe(402);
    if (res.status !== 402) throw new Error("expected 402");
    expect(res.accepts[0].resource).toBe("/creva-score/verify");
  });

  it("returns the real certificate verification on 200", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () =>
        Promise.resolve({
          content: "intact",
          expected_digest: "digest",
          found_digest: "digest",
          folio: "SP-2026-000123",
          signature: "unsigned",
          signature_detail: "No key configured",
        }),
    }) as jest.Mock;

    const res = await verifySealedReport(SEALED);
    expect(res.status).toBe(200);
    if (res.status !== 200) throw new Error("expected 200");
    expect(res.verification.content).toBe("intact");
    expect(res.verification.folio).toBe("SP-2026-000123");
  });

  it("surfaces an unsigned verdict as-is instead of upgrading it to valid", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () =>
        Promise.resolve({
          content: "intact",
          expected_digest: "digest",
          found_digest: "digest",
          folio: "SP-2026-000123",
          signature: "unsigned",
          signature_detail: "No signing key configured",
        }),
    }) as jest.Mock;

    const res = await verifySealedReport(SEALED);
    expect(res.status).toBe(200);
    if (res.status !== 200) throw new Error("expected 200");
    expect(res.verification.signature).toBe("unsigned");
    expect(res.verification.signature).not.toBe("valid");
  });

  it("attaches a supplied X-PAYMENT header to the verify request", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () =>
        Promise.resolve({
          content: "intact",
          expected_digest: "digest",
          found_digest: "digest",
          folio: "SP-2026-000123",
          signature: "valid",
          signature_detail: "ok",
        }),
    }) as jest.Mock;

    await verifySealedReport(SEALED, "paid-proof");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers["X-PAYMENT"]).toBe("paid-proof");
  });

  it("throws on a non-402 failure instead of returning a fake verdict", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      ok: false,
      json: () => Promise.resolve({ error: "creva_auth_unavailable" }),
    }) as jest.Mock;

    await expect(verifySealedReport(SEALED)).rejects.toThrow("creva_auth_unavailable");
  });
});
