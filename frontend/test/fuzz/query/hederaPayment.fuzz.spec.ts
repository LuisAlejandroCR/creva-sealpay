// hederaPayment.fuzz.spec.ts: fuzzes the payment amount the signer is asked to encode — an
// arbitrary maxAmountRequired must always round-trip byte-for-byte into the signed payload's
// `accepted.amount`, never a truncated, rounded, or substituted figure (this is a real HBAR
// transfer amount; a mismatch here would be a silent over/under-charge).
import fc from 'fast-check'
import { PrivateKey } from '@hashgraph/sdk'

import type { PaymentRequirements } from '../../../features/query/gatewayClient'
import { buildSignedPaymentHeader } from '../../../features/query/hederaPayment'

const credentials = { accountId: '0.0.1001', privateKey: PrivateKey.generateED25519().toStringDer() }

function requirementsWithAmount(amountTinybar: number): PaymentRequirements {
  return {
    scheme: 'exact',
    network: 'hedera:testnet',
    maxAmountRequired: String(amountTinybar),
    resource: '/creva-score/report',
    description: 'Creva signal report',
    mimeType: 'application/json',
    payTo: '0.0.7162784',
    maxTimeoutSeconds: 60,
    asset: '0.0.0',
  }
}

describe('buildSignedPaymentHeader — amount fuzzing', () => {
  it('encodes any positive tinybar amount exactly, never a different figure', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 50_000_000_000 }), async amountTinybar => {
        const header = await buildSignedPaymentHeader(requirementsWithAmount(amountTinybar), credentials)
        const decoded = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as {
          accepted: { amount: string }
        }

        expect(decoded.accepted.amount).toBe(String(amountTinybar))
      }),
      { numRuns: 30 },
    )
  })
})
