// no-paid-query-without-payment.invariant.spec.ts: enforces the query screen payment boundary.
// For any business name, the mock client must never produce a paid signal unless the previous
// x402 challenge is supplied back as payment/session proof.
import fc from 'fast-check'
import { requestSignal } from '../../../features/query/gatewayClient'

describe('A query never succeeds before payment/session proof exists', () => {
  it('never returns a 200 signal without a valid prior x402 challenge', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async businessName => {
        const result = await requestSignal(businessName)

        expect(result.status).not.toBe(200)
      }),
      { numRuns: 50 },
    )
  })
})