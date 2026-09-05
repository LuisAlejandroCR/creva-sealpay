// tampered-report-never-valid.invariant.spec.ts: enforces the verify screen seal boundary.
// The gateway is the only party that can say a report is intact — a report whose certificate
// digest doesn't match what the gateway recomputes must come back "altered", and the client must
// never upgrade a non-intact/non-valid response into a passing verdict on its own.
import fc from 'fast-check'
import { verifySealedReport } from '../../../features/verify/sealClient'
import type { SealedReport } from '../../../lib/api'

const originalFetch = global.fetch

const BASE_SEALED: SealedReport = {
  report: {
    generated_at: '2026-09-01T00:00:00.000Z',
    subject: null,
    signals: [],
    sources: [],
    disclosure: {
      score_version: '1.0',
      kind: 'descriptive',
      window_days: 90,
      describes: '',
      does_not_estimate: [],
      provenance_levels: [],
      checked_at: '2026-09-01T00:00:00.000Z',
    },
    notes: [],
  },
  certificate: {
    schema: 'creva-report-v1',
    algorithm: 'sha256',
    generated_at: '2026-09-01T00:00:00.000Z',
    folio: 'SP-2026-000123',
    report_digest: 'digest',
    signature: null,
    proves: [],
    does_not_prove: [],
    how_to_verify: [],
  },
}

afterEach(() => {
  global.fetch = originalFetch
})

describe('A tampered report never verifies as a valid seal', () => {
  it('surfaces the gateway\'s "altered" verdict as-is, never as intact', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async tamperedDigest => {
        global.fetch = jest.fn().mockResolvedValue({
          status: 200,
          ok: true,
          json: () =>
            Promise.resolve({
              content: 'altered',
              expected_digest: BASE_SEALED.certificate.report_digest,
              found_digest: tamperedDigest,
              folio: BASE_SEALED.certificate.folio,
              signature: 'missing',
              signature_detail: 'digest mismatch',
            }),
        }) as jest.Mock

        const res = await verifySealedReport(BASE_SEALED)

        expect(res.status).toBe(200)
        if (res.status !== 200) throw new Error('expected 200')
        expect(res.verification.content).toBe('altered')
        expect(res.verification.content).not.toBe('intact')
      }),
      { numRuns: 50 },
    )
  })
})
