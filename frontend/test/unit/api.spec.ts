// api.spec.ts: ported and adapted from creva_finance/frontend/test/lib/api.test.ts.
// Dropped, because the code they cover does not exist in this port: the window.Clerk global
// fallback (no browser window in RN, @clerk/clerk-expo exposes no such singleton — sessionSource
// is the only source now) and the localStorage `creva_token` legacy-purge checks (no
// lib/legacy-session.ts was ever ported here, so there is nothing to purge). The SessionSource
// and cache-isolation coverage below is unmodified.
import { score, clearApiCache, setSessionSource } from '../../lib/api'

const originalFetch = global.fetch
let fetchCalls: RequestInit[] = []

function mockScore() {
  global.fetch = jest.fn().mockImplementation((_url: string, init: RequestInit = {}) => {
    fetchCalls.push(init)
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'scored',
          score: 72,
          scoreVersion: '1.0',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          factors: [],
        }),
    })
  }) as jest.Mock
}

function authorizationOf(call: RequestInit): string | undefined {
  return (call.headers as Record<string, string> | undefined)?.Authorization
}

function clerkSession(userId: string, token: string) {
  return { userId, getToken: () => Promise.resolve(token) }
}

beforeEach(() => {
  fetchCalls = []
  setSessionSource(null)
  clearApiCache()
  mockScore()
})

afterAll(() => {
  global.fetch = originalFetch
})

describe('El token de la petición es el de Clerk', () => {
  it('manda el token que entrega la sesión de Clerk', async () => {
    setSessionSource(clerkSession('user_ana', 'token-de-clerk'))

    await score.get()

    expect(authorizationOf(fetchCalls[0])).toBe('Bearer token-de-clerk')
  })

  it('sin sesión no manda encabezado', async () => {
    await score.get()

    expect(authorizationOf(fetchCalls[0])).toBeUndefined()
  })

  it('con la sesión registrada pero sin token, sale sin encabezado', async () => {
    setSessionSource({ userId: 'user_ana', getToken: () => Promise.resolve(null) })

    await score.get()

    expect(fetchCalls).toHaveLength(1)
    expect(authorizationOf(fetchCalls[0])).toBeUndefined()
  })

  it('si el proveedor de Clerk truena, la petición igual sale sin encabezado', async () => {
    setSessionSource({ userId: 'user_ana', getToken: () => Promise.reject(new Error('sesión muerta')) })

    await score.get()

    expect(fetchCalls).toHaveLength(1)
    expect(authorizationOf(fetchCalls[0])).toBeUndefined()
  })
})

describe('La caché no cruza de una usuaria a otra', () => {
  it('responde de memoria dentro de la ventana de 30s', async () => {
    setSessionSource(clerkSession('user_ana', 'token-de-clerk'))

    await score.get()
    await score.get()

    expect(fetchCalls).toHaveLength(1)
  })

  it('se vacía con clearApiCache', async () => {
    setSessionSource(clerkSession('user_ana', 'token-de-clerk'))

    await score.get()
    clearApiCache()
    await score.get()

    expect(fetchCalls).toHaveLength(2)
  })

  it('entrar con otra cuenta no lee lo que la anterior dejó guardado', async () => {
    setSessionSource(clerkSession('user_ana', 'token-de-ana'))
    await score.get()

    setSessionSource(clerkSession('user_beatriz', 'token-de-beatriz'))
    await score.get()

    expect(fetchCalls).toHaveLength(2)
    expect(authorizationOf(fetchCalls[1])).toBe('Bearer token-de-beatriz')
  })

  it('cerrar sesión deja la caché vacía para quien entre después', async () => {
    setSessionSource(clerkSession('user_ana', 'token-de-ana'))
    await score.get()

    setSessionSource(null)
    setSessionSource(clerkSession('user_ana', 'token-de-ana'))
    await score.get()

    expect(fetchCalls).toHaveLength(2)
  })

  it('volver a registrar la misma sesión no tira la caché en cada pantalla', async () => {
    setSessionSource(clerkSession('user_ana', 'token-de-ana'))
    await score.get()

    setSessionSource(clerkSession('user_ana', 'token-de-ana'))
    await score.get()

    expect(fetchCalls).toHaveLength(1)
  })
})
