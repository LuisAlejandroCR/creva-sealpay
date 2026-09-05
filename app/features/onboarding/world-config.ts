// world-config.ts: reads the World Selfie Check app/action ids from env, and builds the
// hosted verification URL. Both ids come from World's developer portal per app, not secrets
// worth hiding server-side, so EXPO_PUBLIC_ prefixed env vars are the right fit here.
export function isWorldConfigured(): boolean {
  const appId = process.env.EXPO_PUBLIC_WORLD_APP_ID
  return typeof appId === 'string' && appId.length > 0
}

export function getWorldActionId(): string {
  return process.env.EXPO_PUBLIC_WORLD_ACTION_ID ?? 'selfie-check-onboarding'
}

export function buildSelfieCheckUrl(): string {
  const appId = process.env.EXPO_PUBLIC_WORLD_APP_ID
  if (!appId) {
    throw new Error('EXPO_PUBLIC_WORLD_APP_ID is not set')
  }
  const params = new URLSearchParams({
    app_id: appId,
    action: getWorldActionId(),
    verification_level: 'device',
  })
  return `https://id.worldcoin.org/verify?${params.toString()}`
}

// The verification host redirects here with the proof in the query string on success,
// or with an `error` param on failure/cancellation — this is our WebView navigation sentinel.
export const SELFIE_CHECK_CALLBACK_PREFIX = 'https://id.worldcoin.org/verify/callback'
