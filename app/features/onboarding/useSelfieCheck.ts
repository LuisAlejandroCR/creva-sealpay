// useSelfieCheck.ts: orchestrates the WebView-driven World Selfie Check flow. Degrades to
// identity_unavailable when no World app id is configured, and never reports 'verified' until
// the captured proof clears real server-side verification at the gateway.
import { useCallback, useState } from 'react'
import type { SelfieCheckResult, SelfieCheckStatus } from './types'
import { getWorldActionId, isWorldConfigured, SELFIE_CHECK_CALLBACK_PREFIX } from './world-config'
import { verifyWorldIdProofServerSide } from './world-verify-client'

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
  // hosted flow redirects back to our callback URL. The redirect's query string is untrusted —
  // it only tells the gateway what to verify, it never decides 'verified' on its own.
  const handleCallbackUrl = useCallback((url: string) => {
    if (!url.startsWith(SELFIE_CHECK_CALLBACK_PREFIX)) return false

    let query: URLSearchParams
    try {
      query = new URL(url).searchParams
    } catch {
      setResult({ status: 'failed', nullifierHash: null })
      return true
    }

    const error = query.get('error')
    if (error) {
      setResult({ status: 'failed', nullifierHash: null })
      return true
    }

    const nullifierHash = query.get('nullifier_hash')
    const merkleRoot = query.get('merkle_root')
    const proof = query.get('proof')
    const verificationLevel = query.get('verification_level')

    if (!nullifierHash || !merkleRoot || !proof || !verificationLevel) {
      setResult({ status: 'failed', nullifierHash: null })
      return true
    }

    setResult({ status: 'verifying', nullifierHash: null })
    void verifyWorldIdProofServerSide({
      merkle_root: merkleRoot,
      nullifier_hash: nullifierHash,
      proof,
      verification_level: verificationLevel,
      action: query.get('action') ?? getWorldActionId(),
    }).then((serverResult) => {
      setResult(
        serverResult.verified
          ? { status: 'verified', nullifierHash: serverResult.nullifierHash }
          : { status: 'failed', nullifierHash: null }
      )
    })

    return true
  }, [])

  const reset = useCallback(() => {
    setResult({ status: isWorldConfigured() ? 'idle' : 'identity_unavailable', nullifierHash: null })
  }, [])

  return { result, start, handleCallbackUrl, reset }
}

export type { SelfieCheckStatus }
