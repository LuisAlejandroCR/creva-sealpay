// world-verify.ts: server-side verification of a World ID proof against the World Developer
// Portal verify API (v4, legacy 3.0 proof shape), using WORLD_API_KEY. This is also where the
// onboarding flow's `nonce` is minted and validated: the gateway issues a single-use, TTL-bound
// nonce, the WebView/IDKit flow carries it through and returns it inside the proof, and the
// Developer Portal rejects any proof whose nonce was not signed for that request. The client
// never decides `verified` on its own — only a 200 from this module does.
//
// Request/response shapes follow docs.world.org/api-reference/developer-portal/verify
// (POST https://developer.world.org/api/v4/verify/{rp_id}, protocol_version "3.0"):
//   body: { protocol_version: "3.0", nonce, action, responses: [{ identifier, merkle_root,
//           nullifier, proof, signal_hash? }], environment?, allow_legacy_proofs: true }
//   200:  { success: true, action, nullifier, created_at, environment, results: [...] }
//   400:  { success: false, code, detail, results?: [...] }
// The server-issued nonce mirrors World ID 4.0's `rp_context.nonce` (docs.world.org/world-id/
// idkit/integrate — `signRequest(signingKeyHex, action)` returns `{ sig, nonce, createdAt,
// expiresAt }`). Until the World ID Sandbox is approved we cannot call the real `signRequest`
// (no RP signing key, no rp_id), so `mintNonceSignature` below is an HMAC stand-in over the
// same fields; swap it for `@worldcoin/idkit-core/signing` once the key lands (see
// scripts/world-verify-smoke.ts and docs/plan.md).
import { createHmac, randomBytes } from "node:crypto";
import { config } from "./config.js";

const NONCE_TTL_MS = 10 * 60 * 1000;

export interface WorldIdSession {
  nonce: string;
  action: string;
  createdAt: number;
  expiresAt: number;
  signature: string;
}

export interface WorldIdProofPayload {
  nonce: string;
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: string;
  action: string;
  signal?: string;
}

export interface WorldIdVerifyResult {
  verified: boolean;
  nullifierHash?: string;
  reason?: string;
}

interface IssuedNonce {
  action: string;
  expiresAt: number;
  used: boolean;
}

// In-memory issued-nonce ledger. A single gateway process owns onboarding, so a Map is enough;
// if the gateway is ever scaled horizontally this must move to a shared store (Redis).
const issuedNonces = new Map<string, IssuedNonce>();

function sweepExpired(now: number): void {
  for (const [nonce, entry] of issuedNonces) {
    if (entry.expiresAt <= now) issuedNonces.delete(nonce);
  }
}

// HMAC stand-in for World's rp_context signature. Keyed on WORLD_RP_SIGNING_KEY when present,
// otherwise a per-process ephemeral key — either way the signature only has to round-trip
// within this process, because `issuedNonces` is the authoritative replay guard.
const ephemeralSigningKey = randomBytes(32).toString("hex");
function signingKey(): string {
  return config.worldRpSigningKey && config.worldRpSigningKey.length > 0
    ? config.worldRpSigningKey
    : ephemeralSigningKey;
}

export function mintNonceSignature(
  nonce: string,
  action: string,
  createdAt: number,
  expiresAt: number,
): string {
  return createHmac("sha256", signingKey())
    .update(`${nonce}.${action}.${createdAt}.${expiresAt}`)
    .digest("hex");
}

export function isWorldVerifyConfigured(): boolean {
  return Boolean(config.worldApiKey && config.worldAppId);
}

// Issue a fresh single-use nonce for one onboarding attempt. Returns null when World is not
// configured, so the caller can degrade to `identity_unavailable` without leaking that state.
export function issueWorldIdSession(action?: string): WorldIdSession | null {
  if (!isWorldVerifyConfigured()) return null;
  const now = Date.now();
  sweepExpired(now);
  const resolvedAction = action && action.length > 0 ? action : "selfie-check-onboarding";
  const nonce = randomBytes(32).toString("hex");
  const createdAt = now;
  const expiresAt = now + NONCE_TTL_MS;
  issuedNonces.set(nonce, { action: resolvedAction, expiresAt, used: false });
  return {
    nonce,
    action: resolvedAction,
    createdAt,
    expiresAt,
    signature: mintNonceSignature(nonce, resolvedAction, createdAt, expiresAt),
  };
}

export type NonceRejection =
  | "nonce_unknown"
  | "nonce_used"
  | "nonce_expired"
  | "nonce_action_mismatch";

// Consume the nonce: it is valid at most once. Any nonce the gateway did not issue for this
// exact action — or already spent, or past its TTL — is rejected and the World API is never
// called. This is the hard replay/forgery boundary.
export function consumeWorldIdNonce(
  nonce: string,
  action: string,
): { ok: true } | { ok: false; reason: NonceRejection } {
  const now = Date.now();
  sweepExpired(now);
  const entry = issuedNonces.get(nonce);
  if (!entry) return { ok: false, reason: "nonce_unknown" };
  if (entry.used) return { ok: false, reason: "nonce_used" };
  if (entry.expiresAt <= now) {
    issuedNonces.delete(nonce);
    return { ok: false, reason: "nonce_expired" };
  }
  if (entry.action !== action) return { ok: false, reason: "nonce_action_mismatch" };
  entry.used = true;
  return { ok: true };
}

// Test-only: drop all issued nonces so suites don't leak state into each other.
export function __resetWorldIdNonces(): void {
  issuedNonces.clear();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isValidProofPayload(body: unknown): body is WorldIdProofPayload {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.nonce) &&
    isNonEmptyString(candidate.merkle_root) &&
    isNonEmptyString(candidate.nullifier_hash) &&
    isNonEmptyString(candidate.proof) &&
    isNonEmptyString(candidate.verification_level) &&
    isNonEmptyString(candidate.action) &&
    (candidate.signal === undefined || typeof candidate.signal === "string")
  );
}

// World's `identifier` names the credential class, not IDKit's `verification_level` string.
// "orb" stays "orb"; anything else (device / secure-document / unknown) is best-mapped to
// "device" for a legacy 3.0 proof (docs.world.org/api-reference/developer-portal/verify).
function toIdentifier(verificationLevel: string): string {
  return verificationLevel === "orb" ? "orb" : "device";
}

export function buildVerifyRequestBody(payload: WorldIdProofPayload) {
  return {
    protocol_version: "3.0" as const,
    nonce: payload.nonce,
    action: payload.action,
    allow_legacy_proofs: true as const,
    ...(config.worldEnvironment ? { environment: config.worldEnvironment } : {}),
    responses: [
      {
        identifier: toIdentifier(payload.verification_level),
        merkle_root: payload.merkle_root,
        nullifier: payload.nullifier_hash,
        proof: payload.proof,
        ...(payload.signal ? { signal_hash: payload.signal } : {}),
      },
    ],
  };
}

export async function verifyWorldIdProof(
  payload: WorldIdProofPayload,
): Promise<WorldIdVerifyResult> {
  if (!config.worldApiKey || !config.worldAppId) {
    return { verified: false, reason: "world_verify_not_configured" };
  }

  const nonceCheck = consumeWorldIdNonce(payload.nonce, payload.action);
  if (!nonceCheck.ok) {
    return { verified: false, reason: `world_verify_${nonceCheck.reason}` };
  }

  // rp_id from the Developer Portal's managed World ID config; falls back to the app id until
  // the Sandbox hands us a distinct rp_id.
  const rpId = config.worldRpId && config.worldRpId.length > 0 ? config.worldRpId : config.worldAppId;

  let res: globalThis.Response;
  try {
    res = await fetch(`${config.worldVerifyUrl}/${rpId}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.worldApiKey}`,
      },
      body: JSON.stringify(buildVerifyRequestBody(payload)),
    });
  } catch {
    return { verified: false, reason: "world_verify_network_error" };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { verified: false, reason: `world_verify_bad_response_${res.status}` };
  }

  // World's success and error bodies are both JSON (200 with `success: true`, 400 with
  // `success: false` + `code`) — inspect the body before falling back to the raw HTTP status.
  if (typeof data !== "object" || data === null) {
    return { verified: false, reason: `world_verify_http_${res.status}` };
  }

  const parsed = data as { success?: boolean; nullifier?: string };
  if (parsed.success !== true) {
    return { verified: false, reason: "world_verify_rejected" };
  }

  return { verified: true, nullifierHash: parsed.nullifier ?? payload.nullifier_hash };
}
