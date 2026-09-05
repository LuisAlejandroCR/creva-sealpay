// useSelfieCheck.spec.ts: confirms a missing World app id degrades to identity_unavailable
// instead of crashing, and that a full proof callback only resolves to verified after the
// mocked gateway server-side check reports success.
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useSelfieCheck } from '../../../features/onboarding/useSelfieCheck'

const originalFetch = global.fetch

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

    await act(() => {
      result.current.start()
    })
    expect(result.current.result.status).toBe('identity_unavailable')
  })

  it('resolves to verified only after the gateway confirms the proof server-side', async () => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = 'app_test123'
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ verified: true, nullifierHash: '0xabc' }),
    }) as unknown as typeof fetch

    const { result } = await renderHook(() => useSelfieCheck())

    await act(() => {
      result.current.start()
    })
    expect(result.current.result.status).toBe('in_progress')

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
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ verified: false }),
    }) as unknown as typeof fetch

    const { result } = await renderHook(() => useSelfieCheck())
    await act(() => {
      result.current.start()
    })
    await act(() => {
      result.current.handleCallbackUrl(fullCallbackUrl())
    })

    await waitFor(() => expect(result.current.result.status).toBe('failed'))
  })

  it('reports failed on a callback missing required proof fields, without calling the gateway', async () => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = 'app_test123'
    global.fetch = jest.fn()

    const { result } = await renderHook(() => useSelfieCheck())
    await act(() => {
      result.current.start()
    })
    await act(() => {
      result.current.handleCallbackUrl(
        'https://id.worldcoin.org/verify/callback?nullifier_hash=0xabc'
      )
    })

    expect(result.current.result.status).toBe('failed')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
