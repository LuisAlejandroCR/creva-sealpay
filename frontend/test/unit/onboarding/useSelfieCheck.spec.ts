// useSelfieCheck.spec.ts: confirms a missing World app id degrades to identity_unavailable
// instead of crashing, that start() fetches a gateway nonce session before opening the WebView,
// and that a full proof callback only resolves to verified after the mocked gateway server-side
// check reports success.
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useSelfieCheck } from '../../../features/onboarding/useSelfieCheck'

const originalFetch = global.fetch

const session = {
  nonce: '0xservernonce',
  action: 'selfie-check-onboarding',
  createdAt: 1_000,
  expiresAt: 9_999_999_999_999,
  signature: '0xsig',
}

// Route by URL: /session yields a nonce session, everything else yields `verifyBody`.
function mockGateway(verifyBody: unknown, opts: { sessionOk?: boolean } = {}) {
  const sessionOk = opts.sessionOk ?? true
  return jest.fn((url: string) => {
    if (typeof url === 'string' && url.includes('/onboarding/world-id/session')) {
      return Promise.resolve({ ok: sessionOk, json: async () => (sessionOk ? session : {}) })
    }
    return Promise.resolve({ ok: true, json: async () => verifyBody })
  }) as unknown as typeof fetch
}

function fullCallbackUrl(overrides: Record<string, string> = {}) {
  const params = new URLSearchParams({
    nullifier_hash: '0xabc',
    merkle_root: '0xroot',
    proof: '0xproof',
    verification_level: 'device',
    ...overrides,
  })
  return `https://id.worldcoin.org/verify/callback?${params.toString()}`
}

describe('useSelfieCheck', () => {
  const originalAppId = process.env.EXPO_PUBLIC_WORLD_APP_ID

  afterEach(() => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = originalAppId
    global.fetch = originalFetch
  })

  it('degrades to identity_unavailable when EXPO_PUBLIC_WORLD_APP_ID is missing', async () => {
    delete process.env.EXPO_PUBLIC_WORLD_APP_ID
    const { result } = await renderHook(() => useSelfieCheck())

    expect(result.current.result.status).toBe('identity_unavailable')

    await act(async () => {
      await result.current.start()
    })
    expect(result.current.result.status).toBe('identity_unavailable')
  })

  it('degrades to identity_unavailable when the gateway will not issue a nonce', async () => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = 'app_test123'
    global.fetch = mockGateway({ verified: true }, { sessionOk: false })

    const { result } = await renderHook(() => useSelfieCheck())
    await act(async () => {
      await result.current.start()
    })
    expect(result.current.result.status).toBe('identity_unavailable')
    expect(result.current.webviewUrl).toBeNull()
  })

  it('opens the WebView with the issued nonce, then resolves verified after the gateway confirms', async () => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = 'app_test123'
    global.fetch = mockGateway({ verified: true, nullifierHash: '0xabc' })

    const { result } = await renderHook(() => useSelfieCheck())

    await act(async () => {
      await result.current.start()
    })
    expect(result.current.result.status).toBe('in_progress')
    expect(result.current.webviewUrl).toContain('nonce=0xservernonce')

    await act(() => {
      result.current.handleCallbackUrl(fullCallbackUrl())
    })

    await waitFor(() => expect(result.current.result.status).toBe('verified'))
    expect(result.current.result.nullifierHash).toBe('0xabc')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/onboarding/verify-world-id'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('reports failed when the gateway rejects the proof server-side', async () => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = 'app_test123'
    global.fetch = mockGateway({ verified: false })

    const { result } = await renderHook(() => useSelfieCheck())
    await act(async () => {
      await result.current.start()
    })
    await act(() => {
      result.current.handleCallbackUrl(fullCallbackUrl())
    })

    await waitFor(() => expect(result.current.result.status).toBe('failed'))
  })

  it('reports failed on a callback missing required proof fields, without calling verify', async () => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = 'app_test123'
    const fetchMock = mockGateway({ verified: true })
    global.fetch = fetchMock

    const { result } = await renderHook(() => useSelfieCheck())
    await act(async () => {
      await result.current.start()
    })
    await act(() => {
      result.current.handleCallbackUrl('https://id.worldcoin.org/verify/callback?nullifier_hash=0xabc')
    })

    expect(result.current.result.status).toBe('failed')
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/onboarding/verify-world-id'),
      expect.anything()
    )
  })
})
