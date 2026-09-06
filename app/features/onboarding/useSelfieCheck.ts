// useSelfieCheck.ts: orchestrates the WebView-driven World Selfie Check flow. Degrades to
// identity_unavailable when no World app id is configured; on start it fetches a single-use
// nonce from the gateway and opens the World flow with it. It never reports 'verified' until
// the captured proof — nonce included — clears real server-side verification at the gateway.
import { useCallback, useRef, useState } from 'react'
import type { SelfieCheckResult, SelfieCheckStatus } from './types'
import {
  buildSelfieCheckUrl,
  getWorldActionId,
  isWorldConfigured,
  SELFIE_CHECK_CALLBACK_PREFIX,
  type WorldIdSession,
} from './world-config'
import { fetchWorldIdSession, verifyWorldIdProofServerSide } from './world-verify-client'

export function useSelfieCheck() {
  const [result, setResult] = useState<SelfieCheckResult>(() => ({
    status: isWorldConfigured() ? 'idle' : 'identity_unavailable',
    nullifierHash: null,
  }))
  const [webviewUrl, setWebviewUrl] = useState<string | null>(null)
  const sessionRef = useRef<WorldIdSession | null>(null)

  const start = useCallback(async () => {
    if (!isWorldConfigured()) {
      setResult({ status: 'identity_unavailable', nullifierHash: null })
      return
    }
    setResult({ status: 'in_progress', nullifierHash: null })
    const session = await fetchWorldIdSession(getWorldActionId())
    if (!session) {
      // No nonce means the gateway can never accept the resulting proof — fail closed rather
      // than open a WebView that would produce an unverifiable proof.
      sessionRef.current = null
      setWebviewUrl(null)
      setResult({ status: 'identity_unavailable', nullifierHash: null })
      return
    }
    sessionRef.current = session
    try {
      setWebviewUrl(buildSelfieCheckUrl(session))
    } catch {
      setResult({ status: 'failed', nullifierHash: null })
    }
  }, [])

  // Called from the WebView's onNavigationStateChange once the hosted flow redirects back to
  // our callback URL. The redirect's query string is untrusted — it only tells the gateway what
  // to verify, paired with the nonce this client was issued. It never decides 'verified'.
  const handleCallbackUrl = useCallback((url: string) => {
    if (!url.startsWith(SELFIE_CHECK_CALLBACK_PREFIX)) return false

    const session = sessionRef.current
    if (!session) {
      setResult({ status: 'failed', nullifierHash: null })
      return true
    }

    let query: URLSearchParams
    try {
      query = new URL(url).searchParams
    } catch {
      setResult({ status: 'failed', nullifierHash: null })
      return true
    }

    if (query.get('error')) {
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
      nonce: session.nonce,
      merkle_root: merkleRoot,
      nullifier_hash: nullifierHash,
      proof,
      verification_level: verificationLevel,
      action: query.get('action') ?? session.action ?? getWorldActionId(),
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
    sessionRef.current = null
    setWebviewUrl(null)
    setResult({ status: isWorldConfigured() ? 'idle' : 'identity_unavailable', nullifierHash: null })
  }, [])

  return { result, webviewUrl, start, handleCallbackUrl, reset }
}

export type { SelfieCheckStatus }
