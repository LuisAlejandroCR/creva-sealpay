// onchain-trust-signal.spec.ts: the trust-signal display added to VerifyReportCard — one copy line
// per state, correct badge tone, and the card only renders when the gateway actually returned an
// `onchain` block (null => nothing shown, never a fabricated "verified on chain").
import { readFileSync } from "fs";
import { join } from "path";
import { TRUST_COPY } from "../../../features/verify/components/VerifyReportCard";

const source = readFileSync(
  join(__dirname, "../../../features/verify/components/VerifyReportCard.tsx"),
  "utf-8",
);

describe("TRUST_COPY", () => {
  it("has exactly the three signal states with a distinct line each", () => {
    expect(Object.keys(TRUST_COPY).sort()).toEqual(["attested", "corroborated", "unattested"]);
    const lines = Object.values(TRUST_COPY).map((c) => c.line);
    expect(new Set(lines).size).toBe(3);
  });

  it("escalates tone with corroboration and never calls unattested a success", () => {
    expect(TRUST_COPY.unattested.tone).toBe("neutral");
    expect(TRUST_COPY.attested.tone).toBe("warning");
    expect(TRUST_COPY.corroborated.tone).toBe("success");
  });

  it("only 'corroborated' claims two or more distinct third parties", () => {
    expect(TRUST_COPY.corroborated.line).toMatch(/dos o más|2 o más/i);
    expect(TRUST_COPY.unattested.line).toMatch(/ningún|nadie/i);
  });
});

describe("VerifyReportCard onchain rendering", () => {
  it("guards the on-chain section behind a truthy onchain prop", () => {
    expect(source).toMatch(/onchain\?\s*:\s*OnchainTrust\s*\|\s*null/);
    expect(source).toMatch(/\{onchain \?\s*\(/);
    expect(source).toContain('testID="onchain-trust"');
  });

  it("shows the distinct-attester count against the corroboration threshold of 2", () => {
    expect(source).toMatch(/\{onchain\.distinctAttesters\} de 2/);
  });
});
