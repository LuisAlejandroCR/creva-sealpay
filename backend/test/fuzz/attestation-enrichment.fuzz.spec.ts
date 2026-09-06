// attestation-enrichment.fuzz.spec.ts: the subgraph is a trust boundary — queryFolioAttestation
// must return a well-formed onchain block for any JSON the subgraph hands back, and never report a
// trust signal stronger than the distinct-attester count justifies.
import { afterEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { folioHashFromDigest } from "../../src/creva-proxy.js";
import { queryFolioAttestation } from "../../src/creva-proxy.js";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

describe("folioHashFromDigest fuzz", () => {
  it("never returns a non-null value for a string that is not 64 hex chars", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !/^(0x)?[0-9a-fA-F]{64}$/.test(s)),
        (s) => {
          expect(folioHashFromDigest(s)).toBeNull();
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe("queryFolioAttestation fuzz", () => {
  it("returns a coherent onchain block for arbitrary subgraph payloads", async () => {
    await fc.assert(
      fc.asyncProperty(fc.jsonValue(), async (payload) => {
        global.fetch = vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ data: { folioAttestation: payload } }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ) as unknown as typeof fetch;

        const onchain = await queryFolioAttestation(`0x${"ab".repeat(32)}`, "https://subgraph.example");
        expect(onchain.attestationCount).toBeGreaterThanOrEqual(0);
        expect(onchain.distinctAttesters).toBeGreaterThanOrEqual(0);
        expect(["unattested", "attested", "corroborated"]).toContain(onchain.trustSignal);
        if (onchain.distinctAttesters < 1) expect(onchain.trustSignal).toBe("unattested");
        if (onchain.distinctAttesters < 2) expect(onchain.trustSignal).not.toBe("corroborated");
      }),
      { numRuns: 200 },
    );
  });
});
