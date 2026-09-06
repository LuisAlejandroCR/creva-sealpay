// onchain-never-overrides-core-verdict.invariant.spec.ts: three properties that must hold for the
// /creva-score/verify onchain enrichment no matter what the subgraph does:
//  (a) a folio with 0 distinct on-chain attesters never yields a trustSignal other than "unattested";
//  (b) the core's content + signature verdict is byte-identical with and without the onchain block;
//  (c) a subgraph that times out or returns garbage never crashes the route and never raises the
//      trust signal — onchain comes back null with an error flag.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import request from "supertest";

vi.mock("../../src/facilitator.js", () => ({
  verifyPayment: vi.fn().mockResolvedValue({ isValid: true }),
  settlePayment: vi.fn().mockResolvedValue({
    success: true,
    transaction: "0.0.1234@1700000000.000000000",
    network: "hedera-testnet",
  }),
}));
vi.mock("../../src/creva-auth.js", () => ({
  getCrevaAccessToken: vi.fn().mockResolvedValue("test-access-token"),
}));

const CORE_VERDICT = {
  content: "intact" as const,
  expected_digest: "ab".repeat(32),
  found_digest: "ab".repeat(32),
  folio: "SP-2026-000123",
  signature: "valid" as const,
  signature_detail: "ed25519 signature verified against the published Creva key",
};

const originalFetch = global.fetch;

function installFetch(subgraphResponder: () => Promise<Response>) {
  global.fetch = vi.fn(async (input: unknown) => {
    const url = String(input);
    if (url.includes("/creva-score/verify")) {
      return new Response(JSON.stringify(CORE_VERDICT), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return subgraphResponder();
  }) as unknown as typeof fetch;
}

async function callVerify(proof: string) {
  const { app } = await import("../../src/index.js");
  return request(app).post("/creva-score/verify").set("X-PAYMENT", proof).send({ report: {}, certificate: {} });
}

describe("invariant: onchain enrichment never overrides the core verdict", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = "test";
    process.env.SUBGRAPH_URL = "https://subgraph.invariant.example";
  });
  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.SUBGRAPH_URL;
  });

  it("(a) 0 distinct attesters never produces attested/corroborated", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 9999 }), fc.integer({ min: 1, max: 1e9 }), async (n, count) => {
        vi.resetModules();
        installFetch(async () =>
          new Response(
            JSON.stringify({ data: { folioAttestation: { attestationCount: count, distinctAttesters: 0, lastAttestedAt: String(n) } } }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
        const res = await callVerify(`proof-a-${n}-${count}`);
        expect(res.status).toBe(200);
        expect(res.body.onchain.trustSignal).toBe("unattested");
      }),
      { numRuns: 25 },
    );
  });

  it("(b) core content+signature verdict is unchanged by the onchain block", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 5 }), async (distinct) => {
        vi.resetModules();
        installFetch(async () =>
          new Response(
            JSON.stringify({ data: { folioAttestation: { attestationCount: distinct, distinctAttesters: distinct, lastAttestedAt: "1" } } }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
        const res = await callVerify(`proof-b-${distinct}`);
        expect(res.body.content).toBe(CORE_VERDICT.content);
        expect(res.body.signature).toBe(CORE_VERDICT.signature);
        expect(res.body.signature_detail).toBe(CORE_VERDICT.signature_detail);
        expect(res.body.expected_digest).toBe(CORE_VERDICT.expected_digest);
      }),
      { numRuns: 15 },
    );
  });

  it("(c) a garbage or timing-out subgraph yields onchain:null and never crashes or raises the signal", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant<"timeout">("timeout"),
          fc.constant<"500">("500"),
          fc.string(),
          fc.json(),
        ),
        async (mode) => {
          vi.resetModules();
          installFetch(async () => {
            if (mode === "timeout") throw new Error("The operation was aborted due to timeout");
            if (mode === "500") return new Response("upstream boom", { status: 500 });
            return new Response(String(mode), { status: 200, headers: { "content-type": "application/json" } });
          });
          const res = await callVerify(`proof-c-${Math.random()}`);
          expect(res.status).toBe(200);
          expect(res.body.content).toBe(CORE_VERDICT.content);
          expect(res.body.signature).toBe(CORE_VERDICT.signature);
          // Either the enrichment failed cleanly (onchain:null + flag) or the subgraph reply
          // parsed but carried no folio — never a crash, never a signal above "unattested".
          if (res.body.onchain === null) {
            expect(typeof res.body.onchainError).toBe("string");
          } else {
            expect(res.body.onchain.trustSignal).toBe("unattested");
          }
        },
      ),
      { numRuns: 25 },
    );
  });
});
