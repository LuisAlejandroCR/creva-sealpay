// arc-anchor.spec.ts: verifies canonical-hash validation, explorer URL derivation, and that
// anchoring rejects a malformed hash before ever touching a wallet or provider.
import { describe, expect, it } from "vitest";
import {
  anchorReportHash,
  buildExplorerUrl,
  isValidCanonicalHash,
  readArcSignerCredentialsFromEnv,
} from "../../src/arc-anchor.js";

describe("isValidCanonicalHash", () => {
  it("accepts a well-formed 32-byte hex hash", () => {
    expect(isValidCanonicalHash(`0x${"ab".repeat(32)}`)).toBe(true);
  });

  it("rejects non-string, short, and unprefixed input", () => {
    expect(isValidCanonicalHash(undefined)).toBe(false);
    expect(isValidCanonicalHash(123)).toBe(false);
    expect(isValidCanonicalHash(`0x${"ab".repeat(31)}`)).toBe(false);
    expect(isValidCanonicalHash("ab".repeat(32))).toBe(false);
  });
});

describe("buildExplorerUrl", () => {
  it("swaps the rpc. host for explorer. and appends the tx path", () => {
    expect(buildExplorerUrl("https://rpc.testnet.arc.io", "0xdead")).toBe(
      "https://explorer.testnet.arc.io/tx/0xdead",
    );
  });
});

describe("readArcSignerCredentialsFromEnv", () => {
  it("returns undefined when either env var is missing", () => {
    const original = { ...process.env };
    delete process.env.ARC_SIGNER_ADDRESS;
    delete process.env.ARC_SIGNER_PRIVATE_KEY;

    expect(readArcSignerCredentialsFromEnv()).toBeUndefined();

    process.env = original;
  });
});

describe("anchorReportHash", () => {
  it("rejects a malformed hash before constructing a provider or wallet", async () => {
    await expect(
      anchorReportHash("not-a-hash", { address: "0x0", privateKey: "0x0" }, "https://rpc.testnet.arc.io", "arc:testnet"),
    ).rejects.toThrow("arc_anchor_invalid_canonical_hash");
  });
});
