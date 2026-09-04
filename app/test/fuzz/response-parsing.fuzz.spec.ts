// response-parsing.fuzz.spec.ts: fuzzes the trust boundary in lib/api.ts's request() helper —
// an arbitrary backend response body (well-formed or garbage) must never crash the client with an
// unhandled exception. It either resolves with the parsed body, or rejects with the well-formed
// Error({ status, body }) request() constructs on a non-ok response. Nothing else is acceptable.
import fc from 'fast-check'
import { score, clearApiCache, setSessionSource } from '../../lib/api'

const jsonBody = fc.jsonValue()

describe('El parseo de la respuesta nunca truena con algo que no sea el error esperado', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('un cuerpo 200 arbitrario se resuelve tal cual, sin excepción', async () => {
    await fc.assert(
      fc.asyncProperty(jsonBody, async body => {
        setSessionSource(null)
        clearApiCache()
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(body),
        }) as jest.Mock

        await expect(score.get()).resolves.toEqual(body)
      }),
      { numRuns: 50 },
    )
  })

  it('un cuerpo de error arbitrario, con o sin `message`, siempre produce un Error con status y body', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        fc.oneof(jsonBody, fc.constant(undefined)),
        async (status, body) => {
          setSessionSource(null)
          clearApiCache()
          global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status,
            json: () => (body === undefined ? Promise.reject(new Error('not json')) : Promise.resolve(body)),
          }) as jest.Mock

          await expect(score.get()).rejects.toMatchObject({ status })
        },
      ),
      { numRuns: 50 },
    )
  })
})
