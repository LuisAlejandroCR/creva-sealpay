// sealClient.fuzz.spec.ts: fuzzes the verify screen's real gateway client boundary.
// The network layer is mocked to always answer 402 (the real gateway's own behavior for a request
// with no X-PAYMENT header, gateway/src/index.ts:75-82) — arbitrary folio strings embedded in the
// sealed report must still produce a well-formed challenge, never crash the client.
import fc from 'fast-check'
import { verifySealedReport } from '../../../features/verify/sealClient'
import type { SealedReport } from '../../../lib/api'

const originalFetch = global.fetch

function sealedReportWithFolio(folio: string): SealedReport {
  return {
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
      folio,
      report_digest: 'digest',
      signature: null,
      proves: [],
      does_not_prove: [],
      how_to_verify: [],
    },
  }
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    status: 402,
    ok: false,
    json: () =>
      Promise.resolve({
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: 'hedera-testnet',
            maxAmountRequired: '50000',
            resource: '/creva-score/verify',
            description: 'Creva seal verification',
            mimeType: 'application/json',
            payTo: '0.0.real-gateway-account',
            maxTimeoutSeconds: 60,
            asset: 'USDC',
          },
        ],
        error: 'payment_required',
      }),
  }) as jest.Mock
})

afterEach(() => {
  global.fetch = originalFetch
})

describe('Verify folio fuzzing', () => {
  it('returns a well-formed 402 challenge for arbitrary folio strings', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async folio => {
        const res = await verifySealedReport(sealedReportWithFolio(folio))

        expect(res.status).toBe(402)
        if (res.status !== 402) throw new Error('expected 402')
        expect(res.accepts[0].resource).toBe('/creva-score/verify')
      }),
      { numRuns: 50 },
    )
  })
})
