// no-stale-authorization-header.invariant.spec.ts: the property behind the "outlived token" comment
// in lib/api.ts — a missing or expired session never signs a request with a token from a session
// that is no longer current. fast-check drives arbitrary sequences of session transitions (a fresh
// token, an expired one, or none at all) and checks the invariant holds after every step, not just
// the cases the unit suite happened to write out by hand.
import fc from 'fast-check'
import { score, clearApiCache, setSessionSource } from '../../lib/api'

type SessionStep =
  | { kind: 'token'; userId: string; token: string }
  | { kind: 'expired'; userId: string }
  | { kind: 'none' }

const sessionStep = fc.oneof(
  fc.record({ kind: fc.constant('token' as const), userId: fc.string({ minLength: 1, maxLength: 8 }), token: fc.string({ minLength: 1, maxLength: 16 }) }),
  fc.record({ kind: fc.constant('expired' as const), userId: fc.string({ minLength: 1, maxLength: 8 }) }),
  fc.record({ kind: fc.constant('none' as const) }),
)

function applyStep(step: SessionStep): { expectedToken: string | null } {
  switch (step.kind) {
    case 'token':
      setSessionSource({ userId: step.userId, getToken: () => Promise.resolve(step.token) })
      return { expectedToken: step.token }
    case 'expired':
      // A session that is still registered, but whose token already died — the exact "outlived
      // token" case the comment in lib/api.ts calls out.
      setSessionSource({ userId: step.userId, getToken: () => Promise.resolve(null) })
      return { expectedToken: null }
    case 'none':
      setSessionSource(null)
      return { expectedToken: null }
  }
}

function authorizationOf(call: RequestInit): string | undefined {
  return (call.headers as Record<string, string> | undefined)?.Authorization
}

describe('Ninguna sesión muerta o ausente firma con un token que ya no es el suyo', () => {
  const originalFetch = global.fetch

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('el encabezado Authorization nunca lleva un token que no sea el de la sesión activa en ese momento', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(sessionStep, { minLength: 1, maxLength: 12 }), async steps => {
        setSessionSource(null)
        clearApiCache()

        let lastCall: RequestInit | undefined
        global.fetch = jest.fn().mockImplementation((_url: string, init: RequestInit = {}) => {
          lastCall = init
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: 'scored', score: 1, scoreVersion: '1.0', periodStart: null, periodEnd: null, factors: [] }),
          })
        }) as jest.Mock

        for (const step of steps) {
          const { expectedToken } = applyStep(step)
          // Every read bypasses the in-memory cache: a stale cached response could carry an old
          // Authorization decision forward, which would hide the exact leak this test exists for.
          clearApiCache()

          await score.get()

          const authorization = authorizationOf(lastCall!)
          if (expectedToken === null) {
            expect(authorization).toBeUndefined()
          } else {
            expect(authorization).toBe(`Bearer ${expectedToken}`)
          }
        }
      }),
      { numRuns: 50 },
    )
  })
})
