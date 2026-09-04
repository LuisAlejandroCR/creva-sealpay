import { fetchSealedReport, verifySealSignature } from "../../../features/verify/sealClient";

describe("fetchSealedReport", () => {
  it("returns exactly five verdicts", async () => {
    const report = await fetchSealedReport("SP-2026-000123");
    expect(report.verdicts).toHaveLength(5);
  });

  it("states what it does NOT certify", async () => {
    const report = await fetchSealedReport("SP-2026-000123");
    expect(report.doesNotCertify.length).toBeGreaterThan(0);
    expect(report.doesNotCertify).toContain("Creditworthiness or probability of default");
  });

  it("carries the folio and an Ed25519 signature algorithm", async () => {
    const report = await fetchSealedReport("SP-2026-000123");
    expect(report.folio).toBe("SP-2026-000123");
    expect(report.signatureAlgorithm).toBe("Ed25519");
  });
});

describe("verifySealSignature", () => {
  it("rejects an empty folio", async () => {
    const result = await verifySealSignature("");
    expect(result.valid).toBe(false);
  });

  it("accepts a non-empty folio", async () => {
    const result = await verifySealSignature("SP-2026-000123");
    expect(result.valid).toBe(true);
  });
});
