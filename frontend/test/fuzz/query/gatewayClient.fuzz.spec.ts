// gatewayClient.fuzz.spec.ts: fuzzes the query screen's real gateway client boundary.
// The network layer is mocked to always answer 402 (the real gateway's own behavior for a request
// with no X-PAYMENT header, gateway/src/x402-gate.ts:16-27); arbitrary business names must still
// produce a well-formed challenge, never a paid signal response or an unhandled client error.
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

describe('Query input fuzzing', () => {
  it('returns a 402 challenge for arbitrary business names when no payment proof is present', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async businessName => {
        const result = await requestSignal({ businessName })

        expect(result.status).toBe(402)
        if (result.status !== 402) throw new Error('expected 402')
        expect(result.accepts).toHaveLength(1)
        expect(result.accepts[0].resource).toBe('/creva-score/report')
      }),
      { numRuns: 50 },
    )
  })
})
