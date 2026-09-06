// world-verify-client.ts: talks to the gateway for the two server-authoritative steps of the
// Selfie Check flow — (1) fetch a single-use nonce to open the World verification with, and
// (2) send the captured proof (nonce included) back for real server-side verification. The
// WebView redirect is never trusted on its own; only a verified:true from the gateway counts.
import type { WorldIdSession } from './world-config'

export interface WorldIdProof {
  nonce: string
  merkle_root: string
  nullifier_hash: string
  proof: string
  verification_level: string
  action: string
}

export interface WorldVerifyResult {
  verified: boolean
  nullifierHash: string | null
}

function gatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL ?? 'http://localhost:8787'
}

// Returns null when the gateway has no World config (503) or the call fails — the caller then
// degrades to identity_unavailable / failed and never proceeds to a WebView with no nonce.
export async function fetchWorldIdSession(action: string): Promise<WorldIdSession | null> {
  try {
    const res = await fetch(
      `${gatewayUrl()}/onboarding/world-id/session?action=${encodeURIComponent(action)}`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as Partial<WorldIdSession>
    if (
      typeof data.nonce !== 'string' ||
      typeof data.signature !== 'string' ||
      typeof data.action !== 'string' ||
      typeof data.createdAt !== 'number' ||
      typeof data.expiresAt !== 'number'
    ) {
      return null
    }
    return data as WorldIdSession
  } catch {
    return null
  }
}

export async function verifyWorldIdProofServerSide(proof: WorldIdProof): Promise<WorldVerifyResult> {
  try {
    const res = await fetch(`${gatewayUrl()}/onboarding/verify-world-id`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(proof),
    })

    const data = (await res.json()) as { verified?: boolean; nullifierHash?: string }
    if (data.verified !== true) {
      return { verified: false, nullifierHash: null }
    }
    return { verified: true, nullifierHash: data.nullifierHash ?? proof.nullifier_hash }
  } catch {
    return { verified: false, nullifierHash: null }
  }
}
