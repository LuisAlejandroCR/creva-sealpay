// onchain-wiring.spec.ts: the app side of the /verify on-chain trust signal — the gateway now
// spreads an `onchain` block onto the verify response (gateway/src/creva-proxy.ts:84-85); this
// checks api.ts types it, sealClient normalises + passes it through, and VerifyScreen hands it
// to VerifyReportCard.
import { readFileSync } from "fs";
import { join } from "path";
import { parseOnchain } from "../../../features/verify/onchain";
import { verifySealedReport } from "../../../features/verify/sealClient";
import type { SealedReport } from "../../../lib/api";

const apiSrc = readFileSync(join(__dirname, "../../../lib/api.ts"), "utf-8");
const sealSrc = readFileSync(join(__dirname, "../../../features/verify/sealClient.ts"), "utf-8");
const screenSrc = readFileSync(join(__dirname, "../../../features/verify/VerifyScreen.tsx"), "utf-8");

const originalFetch = global.fetch;
const SEALED = { report: {}, certificate: {} } as unknown as SealedReport;

const CORE = {
  content: "intact",
  expected_digest: "d",
  found_digest: "d",
  folio: "F-1",
  signature: "valid",
  signature_detail: "ok",
};

function mock200(extra: Record<string, unknown>) {
  global.fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: () => Promise.resolve({ ...CORE, ...extra }),
  }) as unknown as typeof fetch;
}

afterEach(() => {
  global.fetch = originalFetch;
});

describe("parseOnchain", () => {
  const good = { attestationCount: 3, distinctAttesters: 2, lastAttestedAt: "2026-09-06T00:00:00Z", trustSignal: "corroborated" };

  it("passes a well-formed attestation through unchanged", () => {
    expect(parseOnchain(good)).toEqual(good);
  });

  it("returns null for absent / null / non-object input", () => {
    expect(parseOnchain(undefined)).toBeNull();
    expect(parseOnchain(null)).toBeNull();
    expect(parseOnchain("attested")).toBeNull();
  });

  it("returns null for an unknown trustSignal or non-numeric counts", () => {
    expect(parseOnchain({ ...good, trustSignal: "verified-on-chain" })).toBeNull();
    expect(parseOnchain({ ...good, attestationCount: "lots" })).toBeNull();
    expect(parseOnchain({ ...good, distinctAttesters: null })).toBeNull();
  });

  it("coerces a missing lastAttestedAt to null", () => {
    expect(parseOnchain({ ...good, lastAttestedAt: undefined })?.lastAttestedAt).toBeNull();
  });
});

describe("verifySealedReport carries onchain through", () => {
  it("keeps a valid onchain block on the verification", async () => {
    mock200({ onchain: { attestationCount: 1, distinctAttesters: 1, lastAttestedAt: null, trustSignal: "attested" } });
    const res = await verifySealedReport(SEALED);
    expect(res.status).toBe(200);
    if (res.status === 200) expect(res.verification.onchain).toEqual({
      attestationCount: 1,
      distinctAttesters: 1,
      lastAttestedAt: null,
      trustSignal: "attested",
    });
  });

  it("normalises a missing or malformed onchain block to null (no crash, no section)", async () => {
    mock200({ onchainError: "subgraph_not_configured" });
    let res = await verifySealedReport(SEALED);
    if (res.status === 200) expect(res.verification.onchain).toBeNull();

    mock200({ onchain: { trustSignal: "totally-verified" } });
    res = await verifySealedReport(SEALED);
    if (res.status === 200) expect(res.verification.onchain).toBeNull();
  });
});

describe("static wiring", () => {
  it("api.ts types the optional onchain field on CertificateVerification", () => {
    expect(apiSrc).toMatch(/export interface OnchainAttestation/);
    expect(apiSrc).toMatch(/onchain\?: OnchainAttestation \| null/);
  });
  it("sealClient runs the gateway body through parseOnchain", () => {
    expect(sealSrc).toMatch(/parseOnchain\(body\.onchain\)/);
  });
  it("VerifyScreen passes onchain into VerifyReportCard", () => {
    expect(screenSrc).toMatch(/onchain=\{result\.verification\.onchain\}/);
  });
});
