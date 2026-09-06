// regulatory.fuzz.spec.ts: buildRegulatoryPending sits on the trust boundary between the gateway
// and two upstreams (the radar HTTP response and the subgraph HTTP response). Whatever garbage
// either returns, it must resolve to a well-formed RegulatoryPendingResponse and never throw.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";

vi.mock("../../src/creva-auth.js", () => ({
  getCrevaAccessToken: vi.fn().mockResolvedValue("test-access-token"),
}));

const originalFetch = global.fetch;

beforeEach(() => {
  process.env.SUBGRAPH_URL = "https://subgraph.example/creva";
});
afterEach(() => {
  global.fetch = originalFetch;
});

const anyJson = fc.anything().filter((v) => {
  try {
    JSON.stringify(v);
    return true;
  } catch {
    return false;
  }
});

describe("buildRegulatoryPending under hostile upstreams", () => {
  it("always returns a well-formed response, never throws", async () => {
    const { buildRegulatoryPending } = await import("../../src/regulatory.js");
    await fc.assert(
      fc.asyncProperty(anyJson, anyJson, fc.oneof(fc.string(), fc.integer().map(String), fc.constant(undefined)), async (radarBody, subgraphBody, since) => {
        global.fetch = vi.fn(async (input: unknown) => {
          const url = String(input);
          const body = url.includes("/creva-score/radar") ? radarBody : subgraphBody;
          return new Response(JSON.stringify(body ?? null), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }) as unknown as typeof fetch;

        const out = await buildRegulatoryPending(since);
        expect(Array.isArray(out.folios)).toBe(true);
        expect(Array.isArray(out.matchingNorms)).toBe(true);
        expect(typeof out.asOf).toBe("string");
        expect(["block", "date", "timestamp", "none"]).toContain(out.sinceKind);
        if (out.pending !== null) {
          expect(out.pending.normId).toMatch(/^0x[0-9a-f]{64}$/);
          expect(out.folios.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("survives a fetch that rejects outright", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("socket hang up");
    }) as unknown as typeof fetch;
    const { buildRegulatoryPending } = await import("../../src/regulatory.js");
    const out = await buildRegulatoryPending("2026-09-01");
    expect(out.pending).toBeNull();
    expect(out.radarError).toBeDefined();
  });
});
