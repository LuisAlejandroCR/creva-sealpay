// world-config.ts: reads the World Selfie Check app/action ids from env, and builds the hosted
// verification URL from a gateway-issued session. The app id and action are per-app Developer
// Portal values, not secrets, so EXPO_PUBLIC_ env vars fit; the nonce/signature come from the
// gateway at runtime (see world-verify-client.ts) and are appended here so the World flow can
// echo the nonce back inside the proof.
export interface WorldIdSession {
  nonce: string
  action: string
  createdAt: number
  expiresAt: number
  signature: string
}

export function isWorldConfigured(): boolean {
  const appId = process.env.EXPO_PUBLIC_WORLD_APP_ID
  return typeof appId === 'string' && appId.length > 0
}

export function getWorldActionId(): string {
  return process.env.EXPO_PUBLIC_WORLD_ACTION_ID ?? 'selfie-check-onboarding'
}

// Builds the hosted World ID verify URL for the WebView. The nonce/signature/created_at/
// expires_at params mirror World ID 4.0's rp_context (docs.world.org/world-id/idkit/integrate);
// the exact hosted-flow param names are best-effort until the World ID Sandbox is approved and
// the real IDKit connector URL can be exercised (docs/plan.md, Selfie Check block).
export function buildSelfieCheckUrl(session: WorldIdSession): string {
  const appId = process.env.EXPO_PUBLIC_WORLD_APP_ID
  if (!appId) {
    throw new Error('EXPO_PUBLIC_WORLD_APP_ID is not set')
  }
  const params = new URLSearchParams({
    app_id: appId,
    action: session.action,
    verification_level: 'device',
    nonce: session.nonce,
    signature: session.signature,
    created_at: String(session.createdAt),
    expires_at: String(session.expiresAt),
  })
  return `https://id.worldcoin.org/verify?${params.toString()}`
}

// The verification host redirects here with the proof in the query string on success,
// or with an `error` param on failure/cancellation — this is our WebView navigation sentinel.
export const SELFIE_CHECK_CALLBACK_PREFIX = 'https://id.worldcoin.org/verify/callback'
