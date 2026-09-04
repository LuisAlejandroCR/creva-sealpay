// useSelfieCheck.fuzz.spec.ts: hostile input at the WebView/deep-link trust boundary —
// handleCallbackUrl receives whatever URL the WebView navigates to, including a compromised
// or malformed one. Property: it never throws, no matter the input.
import fc from 'fast-check'
import { act, renderHook } from '@testing-library/react-native'
import { useSelfieCheck } from '../../../features/onboarding/useSelfieCheck'

describe('useSelfieCheck — handleCallbackUrl fuzz', () => {
  it('never throws on arbitrary strings', async () => {
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
    const hostileQuery = fc.string({ maxLength: 200 })
    await fc.assert(
      fc.asyncProperty(hostileQuery, hostileQuery, async (nullifierHash, error) => {
        const url = `https://id.worldcoin.org/verify/callback?${new URLSearchParams({
          nullifier_hash: nullifierHash,
          error,
        }).toString()}`
        const { result } = await renderHook(() => useSelfieCheck())
        await act(() => {
          expect(() => result.current.handleCallbackUrl(url)).not.toThrow()
        })
      }),
      { numRuns: 200 }
    )
  })
})
