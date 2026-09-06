// attestation-enrichment.spec.ts: folio-hash normalization, trust-signal thresholds, and the
// subgraph query's happy path (mocked fetch). The core verdict is never touched here — these
// only cover the added onchain block.
import { afterEach, describe, expect, it, vi } from "vitest";
import { trustSignalFor } from "../../src/types.js";
import { folioHashFromDigest, queryFolioAttestation } from "../../src/creva-proxy.js";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

describe("folioHashFromDigest", () => {
  it("0x-prefixes and lowercases a bare 32-byte hex digest", () => {
    expect(folioHashFromDigest("AB".repeat(32))).toBe(`0x${"ab".repeat(32)}`);
  });
  it("passes through an already-prefixed digest", () => {
    expect(folioHashFromDigest(`0x${"cd".repeat(32)}`)).toBe(`0x${"cd".repeat(32)}`);
  });
  it("rejects wrong length, non-hex, and non-string", () => {
    expect(folioHashFromDigest("ab".repeat(31))).toBeNull();
    expect(folioHashFromDigest("zz".repeat(32))).toBeNull();
    expect(folioHashFromDigest(123)).toBeNull();
    expect(folioHashFromDigest(undefined)).toBeNull();
  });
});

describe("trustSignalFor", () => {
  it("0 => unattested, 1 => attested, >=2 => corroborated", () => {
    expect(trustSignalFor(0)).toBe("unattested");
    expect(trustSignalFor(1)).toBe("attested");
    expect(trustSignalFor(2)).toBe("corroborated");
    expect(trustSignalFor(9)).toBe("corroborated");
  });
});

describe("queryFolioAttestation", () => {
  it("maps a subgraph row into the onchain block", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { folioAttestation: { attestationCount: 3, distinctAttesters: 2, lastAttestedAt: "1788600000" } },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ) as unknown as typeof fetch;

    const onchain = await queryFolioAttestation(`0x${"ab".repeat(32)}`, "https://subgraph.example");
    expect(onchain).toEqual({
      attestationCount: 3,
      distinctAttesters: 2,
      lastAttestedAt: "1788600000",
      trustSignal: "corroborated",
    });
  });

  it("treats a missing folio (null) as unattested, not an error", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { folioAttestation: null } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const onchain = await queryFolioAttestation(`0x${"ab".repeat(32)}`, "https://subgraph.example");
    expect(onchain).toEqual({
      attestationCount: 0,
      distinctAttesters: 0,
      lastAttestedAt: null,
      trustSignal: "unattested",
    });
  });

  it("throws on a non-200 subgraph response", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("nope", { status: 503 })) as unknown as typeof fetch;
    await expect(
      queryFolioAttestation(`0x${"ab".repeat(32)}`, "https://subgraph.example"),
    ).rejects.toThrow("subgraph_http_503");
  });
});
