// no-paid-query-without-payment.invariant.spec.ts: enforces the query screen payment boundary.
// The network layer is mocked to always answer 402 (no X-PAYMENT header sent) — for any business
// name, the real gateway client must never surface a paid signal from that response.
import fc from 'fast-check'
import { requestSignal } from '../../../features/query/gatewayClient'

const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    status: 402,
    ok: false,
    headers: { get: () => null },
    json: () =>
      Promise.resolve({
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: 'hedera-testnet',
            maxAmountRequired: '300000',
            resource: '/creva-score/report',
            description: 'Creva signal report',
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

describe('A query never succeeds before payment/session proof exists', () => {
  it('never returns a 200 signal without a valid prior x402 challenge', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async businessName => {
        const result = await requestSignal({ businessName })

        expect(result.status).not.toBe(200)
      }),
      { numRuns: 50 },
    )
  })
})
