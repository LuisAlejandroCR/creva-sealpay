// gatewayClient.fuzz.spec.ts: fuzzes the query screen gateway mock boundary.
// Arbitrary user-entered business names must produce a well-formed x402 challenge before payment,
// never a paid signal response or an unhandled client error.
import fc from 'fast-check'
import { requestSignal } from '../../../features/query/gatewayClient'

describe('Query input fuzzing', () => {
  it('returns a 402 challenge for arbitrary business names when no payment/session proof is present', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async businessName => {
        const result = await requestSignal(businessName)

        expect(result.status).toBe(402)
        if (result.status !== 402) throw new Error('expected 402')
        expect(result.accepts).toHaveLength(1)
        expect(result.accepts[0].resource).toBe('/creva-score/report')
      }),
      { numRuns: 50 },
    )
  })
})