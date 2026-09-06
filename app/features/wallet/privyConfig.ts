// privyConfig.ts: reads the public Privy identifiers from EXPO_PUBLIC_* env. No app id -> no Privy
// wallet mode, and the payment flow is byte-for-byte today's demo signer. The Privy app SECRET is
// server-side only and is never read here (this slice adds no server-auth flow).
export interface PrivyConfig {
  appId: string
  clientId?: string
}

export function readPrivyConfigFromEnv(): PrivyConfig | null {
  const appId = process.env.EXPO_PUBLIC_PRIVY_APP_ID
  if (!appId || !appId.trim()) return null
  const clientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID
  return { appId: appId.trim(), clientId: clientId && clientId.trim() ? clientId.trim() : undefined }
}

export function isPrivyConfigured(): boolean {
  return readPrivyConfigFromEnv() !== null
}
