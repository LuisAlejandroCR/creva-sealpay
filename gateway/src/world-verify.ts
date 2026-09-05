// world-verify.ts: server-side verification of a World ID proof against the World Developer
// Portal's real verify API (v4), using WORLD_API_KEY. Never trust the client's own claim that
// the WebView redirect succeeded — this is the only place that can hold the real key.
import { config } from "./config.js";

export interface WorldIdProofPayload {
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isValidProofPayload(body: unknown): body is WorldIdProofPayload {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.merkle_root) &&
    isNonEmptyString(candidate.nullifier_hash) &&
    isNonEmptyString(candidate.proof) &&
    isNonEmptyString(candidate.verification_level) &&
    isNonEmptyString(candidate.action) &&
    (candidate.signal === undefined || typeof candidate.signal === "string")
  );
}

// World's v4 verify endpoint speaks a "protocol_version" envelope. Our client only has the
// classic IDKit-style proof fields (merkle_root/nullifier/proof), which map onto protocol 3.0's
// `responses[0]` shape — this mapping is unconfirmed against a real sandbox call (see
// docs/memoria.md 2026-09-04, "World v4 verify sin ejercer contra sandbox real").
function buildVerifyRequestBody(payload: WorldIdProofPayload) {
  return {
    protocol_version: "3.0",
    action: payload.action,
    responses: [
      {
        identifier: "proof_of_human",
        proof: payload.proof,
        merkle_root: payload.merkle_root,
        nullifier: payload.nullifier_hash,
      },
    ],
    ...(payload.signal ? { signal_hash: payload.signal } : {}),
  };
}

export async function verifyWorldIdProof(
  payload: WorldIdProofPayload,
): Promise<WorldIdVerifyResult> {
  if (!config.worldApiKey || !config.worldAppId) {
    return { verified: false, reason: "world_verify_not_configured" };
  }

  let res: globalThis.Response;
  try {
    res = await fetch(`${config.worldVerifyUrl}/${config.worldAppId}`, {
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

  // World's success/error bodies both carry a JSON payload (200 on success, 400/404 with
  // `success: false` on a rejected proof) — inspect the body before falling back to the raw
  // HTTP status, so a rejected-proof 400 reports "rejected" instead of a generic HTTP error.
  if (typeof data !== "object" || data === null) {
    return { verified: false, reason: `world_verify_http_${res.status}` };
  }

  const parsed = data as { success?: boolean; nullifier?: string };
  if (parsed.success !== true) {
    return { verified: false, reason: "world_verify_rejected" };
  }

  return { verified: true, nullifierHash: parsed.nullifier ?? payload.nullifier_hash };
}
