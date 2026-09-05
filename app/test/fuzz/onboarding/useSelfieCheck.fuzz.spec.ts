// useSelfieCheck.fuzz.spec.ts: hostile input at the WebView/deep-link trust boundary —
// handleCallbackUrl receives whatever URL the WebView navigates to, including a compromised
// or malformed one. Property: it never throws, no matter the input or the gateway's response.
import fc from 'fast-check'
import { act, renderHook } from '@testing-library/react-native'
import { useSelfieCheck } from '../../../features/onboarding/useSelfieCheck'

const originalFetch = global.fetch

describe('useSelfieCheck — handleCallbackUrl fuzz', () => {
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('never throws on arbitrary strings', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('should not be called'))
    await fc.assert(
      fc.asyncProperty(fc.string(), async (input) => {
        const { result } = await renderHook(() => useSelfieCheck())
        await act(() => {
          expect(() => result.current.handleCallbackUrl(input)).not.toThrow()
        })
      }),
      { numRuns: 200 }
    )
  })

  it('never throws on near-valid callback URLs with hostile query params', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ verified: false }),
    }) as unknown as typeof fetch

    const hostileQuery = fc.string({ maxLength: 200 })
    await fc.assert(
      fc.asyncProperty(
        hostileQuery,
        hostileQuery,
        hostileQuery,
        hostileQuery,
        hostileQuery,
        async (nullifierHash, merkleRoot, proof, verificationLevel, error) => {
          const url = `https://id.worldcoin.org/verify/callback?${new URLSearchParams({
            nullifier_hash: nullifierHash,
            merkle_root: merkleRoot,
            proof,
            verification_level: verificationLevel,
            error,
          }).toString()}`
          const { result } = await renderHook(() => useSelfieCheck())
          await act(() => {
            expect(() => result.current.handleCallbackUrl(url)).not.toThrow()
          })
        }
      ),
      { numRuns: 200 }
    )
  })

  it('never throws even when the gateway call rejects outright', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'))

    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async (value) => {
        const url = `https://id.worldcoin.org/verify/callback?${new URLSearchParams({
          nullifier_hash: value,
          merkle_root: value,
          proof: value,
          verification_level: value,
        }).toString()}`
        const { result } = await renderHook(() => useSelfieCheck())
        await act(() => {
          expect(() => result.current.handleCallbackUrl(url)).not.toThrow()
        })
      }),
      { numRuns: 100 }
    )
  })
})
