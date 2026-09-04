// useSelfieCheck.ts: orchestrates the WebView-driven World Selfie Check flow and degrades
// to identity_unavailable when no World app id is configured, instead of crashing.
import { useCallback, useState } from 'react'
import type { SelfieCheckResult, SelfieCheckStatus } from './types'
import { isWorldConfigured, SELFIE_CHECK_CALLBACK_PREFIX } from './world-config'

export function useSelfieCheck() {
  const [result, setResult] = useState<SelfieCheckResult>(() => ({
    status: isWorldConfigured() ? 'idle' : 'identity_unavailable',
    nullifierHash: null,
  }))

  const start = useCallback(() => {
    if (!isWorldConfigured()) {
      setResult({ status: 'identity_unavailable', nullifierHash: null })
      return
    }
    setResult({ status: 'in_progress', nullifierHash: null })
  }, [])

  // Called from the WebView's onNavigationStateChange/onShouldStartLoadWithRequest once the
  // hosted flow redirects back to our callback URL.
  const handleCallbackUrl = useCallback((url: string) => {
    if (!url.startsWith(SELFIE_CHECK_CALLBACK_PREFIX)) return false

    const query = new URL(url).searchParams
    const error = query.get('error')
    if (error) {
      setResult({ status: 'failed', nullifierHash: null })
      return true
    }

    const nullifierHash = query.get('nullifier_hash')
    setResult({ status: 'verified', nullifierHash })
    return true
  }, [])

  const reset = useCallback(() => {
    setResult({ status: isWorldConfigured() ? 'idle' : 'identity_unavailable', nullifierHash: null })
  }, [])

  return { result, start, handleCallbackUrl, reset }
}

export type { SelfieCheckStatus }
