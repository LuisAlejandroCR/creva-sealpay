// identity-unavailable-without-world-key.invariant.spec.ts: security property that must hold
// no matter what — a missing EXPO_PUBLIC_WORLD_APP_ID always yields identity_unavailable,
// never a false 'verified'/'idle' success, regardless of what handleCallbackUrl is fed.
import fc from 'fast-check'
import { act, renderHook } from '@testing-library/react-native'
import { useSelfieCheck } from '../../../features/onboarding/useSelfieCheck'

describe('invariant: identity_unavailable without a World key', () => {
  const originalAppId = process.env.EXPO_PUBLIC_WORLD_APP_ID

  afterEach(() => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = originalAppId
  })

  it('never reports verified when the app id is unset, whatever the callback URL', async () => {
    delete process.env.EXPO_PUBLIC_WORLD_APP_ID

    await fc.assert(
      fc.asyncProperty(
        fc.webUrl({ withQueryParameters: true }),
        fc.boolean(),
        async (callbackUrl, shouldStart) => {
          const { result } = await renderHook(() => useSelfieCheck())

          expect(result.current.result.status).toBe('identity_unavailable')

          if (shouldStart) {
            await act(() => {
              result.current.start()
            })
          }
          await act(() => {
            result.current.handleCallbackUrl(callbackUrl)
          })

          expect(result.current.result.status).toBe('identity_unavailable')
          expect(result.current.result.status).not.toBe('verified')
        }
      ),
      { numRuns: 200 }
    )
  })
})
