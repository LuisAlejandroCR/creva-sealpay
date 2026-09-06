// client-sends-server-nonce.invariant.spec.ts: the client must send the gateway ONLY the nonce
// the gateway itself issued at /onboarding/world-id/session — never a nonce (or any field)
// injected into the WebView callback URL. A compromised redirect cannot substitute its own
// nonce, so it cannot make the gateway accept a proof it did not scope.
import fc from 'fast-check'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useSelfieCheck } from '../../../features/onboarding/useSelfieCheck'

const originalFetch = global.fetch

const SERVER_NONCE = '0xTHE-ONLY-VALID-NONCE'
const session = {
  nonce: SERVER_NONCE,
  action: 'selfie-check-onboarding',
  createdAt: 1_000,
  expiresAt: 9_999_999_999_999,
  signature: '0xsig',
}

describe('invariant: client forwards only the server-issued nonce', () => {
  const originalAppId = process.env.EXPO_PUBLIC_WORLD_APP_ID

  beforeEach(() => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = 'app_test123'
  })
  afterEach(() => {
    process.env.EXPO_PUBLIC_WORLD_APP_ID = originalAppId
    global.fetch = originalFetch
  })

  it('POSTs the /session nonce regardless of what the callback URL contains', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ maxLength: 40 }),
        fc.string({ minLength: 1, maxLength: 40 }),
        async (urlNonce, value) => {
          const verifyBodies: Array<Record<string, unknown>> = []
          global.fetch = jest.fn((url: string, init?: { body?: string }) => {
            if (typeof url === 'string' && url.includes('/onboarding/world-id/session')) {
              return Promise.resolve({ ok: true, json: async () => session })
            }
            verifyBodies.push(JSON.parse(init?.body ?? '{}'))
            return Promise.resolve({ ok: true, json: async () => ({ verified: false }) })
          }) as unknown as typeof fetch

          const { result } = await renderHook(() => useSelfieCheck())
          await act(async () => {
            await result.current.start()
          })

          const url = `https://id.worldcoin.org/verify/callback?${new URLSearchParams({
            nonce: urlNonce,
            nullifier_hash: value,
            merkle_root: value,
            proof: value,
            verification_level: value,
          }).toString()}`

          await act(() => {
            result.current.handleCallbackUrl(url)
          })

          await waitFor(() => expect(verifyBodies.length).toBe(1))
          expect(verifyBodies[0].nonce).toBe(SERVER_NONCE)
        }
      ),
      { numRuns: 40 }
    )
  })

  it('does not call verify at all when no session nonce was issued', async () => {
    let verifyCalls = 0
    global.fetch = jest.fn((url: string) => {
      if (typeof url === 'string' && url.includes('/onboarding/world-id/session')) {
        return Promise.resolve({ ok: false, json: async () => ({}) })
      }
      verifyCalls += 1
      return Promise.resolve({ ok: true, json: async () => ({ verified: true, nullifierHash: '0x' }) })
    }) as unknown as typeof fetch

    const { result } = await renderHook(() => useSelfieCheck())
    await act(async () => {
      await result.current.start()
    })
    await act(() => {
      result.current.handleCallbackUrl(
        'https://id.worldcoin.org/verify/callback?' +
          new URLSearchParams({
            nullifier_hash: '0x',
            merkle_root: '0x',
            proof: '0x',
            verification_level: 'device',
          }).toString()
      )
    })

    expect(verifyCalls).toBe(0)
    expect(result.current.result.status).not.toBe('verified')
  })
})
