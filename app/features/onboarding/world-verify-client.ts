// world-verify-client.ts: sends the proof captured from the World Selfie Check WebView redirect
// to the gateway for real server-side verification, instead of trusting the redirect URL alone.
export interface WorldIdProof {
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
