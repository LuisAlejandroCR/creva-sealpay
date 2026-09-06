// live-arc-anchor.spec.ts: sends exactly one real, self-addressed anchoring transaction to Arc
// testnet, confirming the on-chain trace acceptance criterion for real (plan.md's Arc block).
// Separate from the mocked unit/fuzz/invariant suites on purpose — this is the only place
// allowed to touch the network, and it must never run automatically without real credentials.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { anchorReportHash, readArcSignerCredentialsFromEnv } from "../../src/arc-anchor.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(here, "../../.env");

function loadEnvOnce() {
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvOnce();

const credentials = readArcSignerCredentialsFromEnv();
const hasArcCreds = Boolean(credentials && process.env.ARC_RPC_URL);

describe.skipIf(!hasArcCreds)("live Arc testnet anchor (real network, real gas)", () => {
  it(
    "anchors one canonical report hash on Arc testnet",
    async () => {
      if (!credentials || !process.env.ARC_RPC_URL) return;

      // A real folio's canonical hash would come from the sealed report; this run confirms the
      // on-chain path end-to-end with a deterministic placeholder hash.
      const canonicalHash = `0x${"cd".repeat(32)}`;

      const result = await anchorReportHash(
        canonicalHash,
        credentials,
        process.env.ARC_RPC_URL,
        process.env.ARC_NETWORK ?? "arc:testnet",
        process.env.REGISTRY_ADDRESS,
      );

      console.log("live Arc anchor result:", result);

      expect(result.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(result.explorerUrl).toContain(result.txHash);
    },
    60_000,
  );
});
