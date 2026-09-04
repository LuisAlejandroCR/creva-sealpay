// ClerkAppProvider.tsx: wraps the app in Clerk's provider using Expo SecureStore for the
// token cache. Not wired into App.tsx yet — that's the scaffold integration step, out of
// this worktree's scope (app/features/onboarding + app/features/auth only).
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import type { PropsWithChildren } from 'react'

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

export function ClerkAppProvider({ children }: PropsWithChildren) {
  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set')
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  )
}
