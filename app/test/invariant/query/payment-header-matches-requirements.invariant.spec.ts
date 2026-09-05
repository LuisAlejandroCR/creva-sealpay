// payment-header-matches-requirements.invariant.spec.ts: the signed X-PAYMENT payload must
// always carry the exact scheme/network/payTo the gateway's 402 challenge asked for — the app
// must never sign a transfer to a different recipient or under a different scheme than what the
// gateway demanded, no matter what payTo string comes back in `accepts[0]`.
import fc from 'fast-check'
import { PrivateKey } from '@hashgraph/sdk'

import type { PaymentRequirements } from '../../../features/query/gatewayClient'
import { buildSignedPaymentHeader } from '../../../features/query/hederaPayment'

const credentials = { accountId: '0.0.1001', privateKey: PrivateKey.generateED25519().toStringDer() }

describe('buildSignedPaymentHeader — never pays a different party than requested', () => {
  it('accepted.payTo/network/scheme always mirror the requirements passed in', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^0\.0\.[0-9]{1,10}$/),
        fc.constantFrom('hedera:testnet', 'hedera:mainnet'),
        async (payTo, network) => {
          const requirements: PaymentRequirements = {
            scheme: 'exact',
            network,
            maxAmountRequired: '10000000',
            resource: '/creva-score/report',
            description: 'Creva signal report',
            mimeType: 'application/json',
            payTo,
            maxTimeoutSeconds: 60,
            asset: '0.0.0',
          }

          const header = await buildSignedPaymentHeader(requirements, credentials)
          const decoded = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as {
            accepted: { scheme: string; network: string; payTo: string }
          }

          expect(decoded.accepted.scheme).toBe('exact')
          expect(decoded.accepted.network).toBe(network)
          expect(decoded.accepted.payTo).toBe(payTo)
        },
      ),
      { numRuns: 30 },
    )
  })
})
