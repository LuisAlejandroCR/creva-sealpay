// regulatory.spec.ts: since-cursor parsing, deterministic normId, and buildRegulatoryPending's
// happy path plus its degraded paths (radar down, subgraph unconfigured, no anchored folios).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/creva-auth.js", () => ({
  getCrevaAccessToken: vi.fn().mockResolvedValue("test-access-token"),
}));

const RADAR_OK = {
  data: {
    alerts: [
      {
        source: "mx.dof",
        kind: "publication",
        external_id: "DOF-2026-09-05-1",
        title: "Reforma a las reglas de credito para PyMEs",
        published_at: "2026-09-05",
        agency: "SHCP",
        url: null,
      },
      {
        source: "mx.cnbv",
        kind: "standing_rule",
        external_id: "CUB-2019",
        title: "Circular Unica de Bancos",
        published_at: "2019-01-01",
        agency: "CNBV",
        url: "https://example.test/cub",
      },
    ],
  },
};

const SUBGRAPH_OK = {
  data: {
    folioAttestations: [{ id: `0x${"ab".repeat(32)}` }, { id: `0x${"cd".repeat(32)}` }],
    attestations: [{ blockNumber: "1788123" }],
  },
};

const originalFetch = global.fetch;

function installFetch(radar: unknown, subgraph: unknown) {
  global.fetch = vi.fn(async (input: unknown) => {
    const url = String(input);
    if (url.includes("/creva-score/radar")) {
      return new Response(JSON.stringify(radar), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify(subgraph), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  process.env.SUBGRAPH_URL = "https://subgraph.example/creva";
});
afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("classifySince", () => {
  it("classifies date, timestamp, block, and empty", async () => {
    const { classifySince } = await import("../../src/regulatory.js");
    expect(classifySince("2026-09-01").kind).toBe("date");
    expect(classifySince("1788000000").kind).toBe("timestamp");
    expect(classifySince("42").kind).toBe("block");
    expect(classifySince("42").cutoffMs).toBeNull();
    expect(classifySince("").kind).toBe("none");
    expect(classifySince(undefined).kind).toBe("none");
  });
});

describe("normIdFor", () => {
  it("is a deterministic 32-byte hash of source|externalId", async () => {
    const { normIdFor } = await import("../../src/regulatory.js");
    const a = normIdFor("mx.dof", "DOF-2026-09-05-1");
    expect(a).toMatch(/^0x[0-9a-f]{64}$/);
    expect(normIdFor("mx.dof", "DOF-2026-09-05-1")).toBe(a);
    expect(normIdFor("mx.cnbv", "DOF-2026-09-05-1")).not.toBe(a);
  });
});

describe("buildRegulatoryPending", () => {
  it("returns the newest matching norm and every anchored folio", async () => {
    installFetch(RADAR_OK, SUBGRAPH_OK);
    const { buildRegulatoryPending, normIdFor } = await import("../../src/regulatory.js");
    const out = await buildRegulatoryPending("2000-01-01");

    expect(out.pending?.normId).toBe(normIdFor("mx.dof", "DOF-2026-09-05-1"));
    expect(out.matchingNorms).toHaveLength(2);
    expect(out.folios).toEqual([`0x${"ab".repeat(32)}`, `0x${"cd".repeat(32)}`]);
    expect(out.latestAttestationBlock).toBe(1788123);
    expect(out.radarError).toBeUndefined();
  });

  it("filters norms older than a date cutoff", async () => {
    installFetch(RADAR_OK, SUBGRAPH_OK);
    const { buildRegulatoryPending } = await import("../../src/regulatory.js");
    const out = await buildRegulatoryPending("2025-01-01");
    expect(out.matchingNorms).toHaveLength(1);
    expect(out.pending?.source).toBe("mx.dof");
  });

  it("yields pending=null with an error flag when the radar is down", async () => {
    global.fetch = vi.fn(async (input: unknown) => {
      const url = String(input);
      if (url.includes("/creva-score/radar")) {
        return new Response("nope", { status: 503 });
      }
      return new Response(JSON.stringify(SUBGRAPH_OK), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const { buildRegulatoryPending } = await import("../../src/regulatory.js");
    const out = await buildRegulatoryPending(undefined);
    expect(out.pending).toBeNull();
    expect(out.radarError).toBe("radar_http_503");
  });

  it("reports pending=null when no folios are anchored yet", async () => {
    installFetch(RADAR_OK, { data: { folioAttestations: [], attestations: [] } });
    const { buildRegulatoryPending } = await import("../../src/regulatory.js");
    const out = await buildRegulatoryPending("2026-01-01");
    expect(out.folios).toEqual([]);
    expect(out.pending).toBeNull();
    expect(out.matchingNorms.length).toBeGreaterThan(0);
  });

  it("flags subgraph_not_configured when SUBGRAPH_URL is unset", async () => {
    delete process.env.SUBGRAPH_URL;
    vi.resetModules();
    installFetch(RADAR_OK, SUBGRAPH_OK);
    const { buildRegulatoryPending } = await import("../../src/regulatory.js");
    const out = await buildRegulatoryPending("2026-01-01");
    expect(out.subgraphError).toBe("subgraph_not_configured");
    expect(out.pending).toBeNull();
    vi.resetModules();
  });
});
