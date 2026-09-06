// session-source.ts: adapts @clerk/clerk-expo's useAuth() into the SessionSource shape
// consumed by creva_finance/frontend/lib/api.ts (getToken + userId), so the ported api.ts
// client can register a session here without knowing about Clerk directly.
import { useAuth, useUser } from '@clerk/clerk-expo'

export interface SessionSource {
  getToken: () => Promise<string | null>
  userId: string | null
}

export function useClerkSessionSource(): SessionSource {
  const { getToken } = useAuth()
  const { user } = useUser()

  return {
    getToken: () => getToken(),
    userId: user?.id ?? null,
  }
}
