// useSelfieCheck.spec.ts: confirms a missing World app id degrades to identity_unavailable
// instead of crashing, and that a callback URL with nullifier_hash resolves to verified.
import { act, renderHook } from '@testing-library/react-native'
import { useSelfieCheck } from '../../../features/onboarding/useSelfieCheck'

describe('useSelfieCheck', () => {
  const originalAppId = process.env.EXPO_PUBLIC_WORLD_APP_ID

  afterEach(() => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = originalAppId
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

  it('resolves to verified when the callback URL carries a nullifier_hash', async () => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = 'app_test123'
    const { result } = await renderHook(() => useSelfieCheck())

    await act(() => {
      result.current.start()
    })
    expect(result.current.result.status).toBe('in_progress')

    await act(() => {
      result.current.handleCallbackUrl(
        'https://id.worldcoin.org/verify/callback?nullifier_hash=0xabc'
      )
    })

    expect(result.current.result.status).toBe('verified')
    expect(result.current.result.nullifierHash).toBe('0xabc')
  })
})
