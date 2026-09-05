// onboarding-never-succeeds-unverified.invariant.spec.ts: security property that must hold no
// matter what — onboarding never reports 'verified' unless the gateway's server-side World API
// check actually said verified:true. A well-formed proof with any other gateway response (a
// rejection, a malformed body, a network failure) must never resolve to 'verified'.
import fc from 'fast-check'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useSelfieCheck } from '../../../features/onboarding/useSelfieCheck'

const originalFetch = global.fetch

describe('invariant: onboarding never reports verified without a verified gateway response', () => {
  const originalAppId = process.env.EXPO_PUBLIC_WORLD_APP_ID

  beforeEach(() => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = 'app_test123'
  })

  afterEach(() => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = originalAppId
    global.fetch = originalFetch
  })

  const unverifiedGatewayResponse = fc.oneof(
    fc.record({ verified: fc.constant(false) }),
    fc.record({}),
    fc.constant(null)
  )

  it('never resolves to verified when the gateway does not report verified:true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        unverifiedGatewayResponse,
        async (value, gatewayBody) => {
          global.fetch = jest.fn().mockResolvedValue({
            json: async () => gatewayBody,
          }) as unknown as typeof fetch

          const { result } = await renderHook(() => useSelfieCheck())
          await act(() => {
            result.current.start()
          })

          const url = `https://id.worldcoin.org/verify/callback?${new URLSearchParams({
            nullifier_hash: value,
            merkle_root: value,
            proof: value,
            verification_level: value,
          }).toString()}`

          await act(() => {
            result.current.handleCallbackUrl(url)
          })

          await waitFor(() =>
            expect(['verifying', 'failed']).toContain(result.current.result.status)
          )
          await waitFor(() => expect(result.current.result.status).toBe('failed'))
          expect(result.current.result.status).not.toBe('verified')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('never resolves to verified when the gateway call throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'))

    const { result } = await renderHook(() => useSelfieCheck())
    await act(() => {
      result.current.start()
    })

    const url = 'https://id.worldcoin.org/verify/callback?' +
      new URLSearchParams({
        nullifier_hash: '0xabc',
        merkle_root: '0xroot',
        proof: '0xproof',
        verification_level: 'device',
      }).toString()

    await act(() => {
      result.current.handleCallbackUrl(url)
    })

    await waitFor(() => expect(result.current.result.status).toBe('failed'))
  })
})
