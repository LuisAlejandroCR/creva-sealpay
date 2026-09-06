// onchain.ts: normalises the optional `onchain` block the x402 gateway adds to the /verify
// response (gateway/src/creva-proxy.ts). A missing, null, or malformed block becomes null so the
// verify screen simply omits the "Respaldo on-chain" section instead of crashing on a bad shape.
import type { OnchainAttestation, OnchainTrustSignal } from "../../lib/api";

const TRUST_SIGNALS: readonly OnchainTrustSignal[] = ["unattested", "attested", "corroborated"];

export function parseOnchain(raw: unknown): OnchainAttestation | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (!TRUST_SIGNALS.includes(value.trustSignal as OnchainTrustSignal)) return null;

  const { attestationCount, distinctAttesters } = value;
  if (typeof attestationCount !== "number" || !Number.isFinite(attestationCount)) return null;
  if (typeof distinctAttesters !== "number" || !Number.isFinite(distinctAttesters)) return null;

  return {
    attestationCount,
    distinctAttesters,
    lastAttestedAt: typeof value.lastAttestedAt === "string" ? value.lastAttestedAt : null,
    trustSignal: value.trustSignal as OnchainTrustSignal,
  };
}
