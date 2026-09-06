// hederaPayment.spec.ts: verifies the app's demo-scoped signer produces a decodable, correctly
// shaped x402 v2 payload (mirrors gateway/test/unit/hedera-signer.spec.ts) — freezing and signing
// a TransferTransaction never touches the network, so this stays a fast unit test.
import { PrivateKey } from '@hashgraph/sdk'

import type { PaymentRequirements } from '../../../features/query/gatewayClient'
import { buildSignedPaymentHeader, readDemoCredentialsFromEnv } from '../../../features/query/hederaPayment'

const requirements: PaymentRequirements = {
  scheme: 'exact',
  network: 'hedera:testnet',
  maxAmountRequired: '10000000',
  resource: '/creva-score/report',
  description: 'Creva signal report',
  mimeType: 'application/json',
  payTo: '0.0.7162784',
  maxTimeoutSeconds: 60,
  asset: '0.0.0',
}

describe('buildSignedPaymentHeader', () => {
  it('produces a decodable, correctly-shaped signed transfer payload', async () => {
    const credentials = {
      accountId: '0.0.1001',
      privateKey: PrivateKey.generateED25519().toStringDer(),
    }

    const header = await buildSignedPaymentHeader(requirements, credentials)
    const decoded = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as {
      x402Version: number
      accepted: { scheme: string; amount: string; payTo: string }
      payload: { transaction: string }
    }

    expect(decoded.x402Version).toBe(2)
    expect(decoded.accepted.scheme).toBe('exact')
    expect(decoded.accepted.amount).toBe(requirements.maxAmountRequired)
    expect(decoded.accepted.payTo).toBe(requirements.payTo)
    expect(typeof decoded.payload.transaction).toBe('string')
    expect(decoded.payload.transaction.length).toBeGreaterThan(0)
  })

  it('rejects an unparseable private key instead of silently signing with garbage', async () => {
    const credentials = { accountId: '0.0.1001', privateKey: 'not-a-key' }
    await expect(buildSignedPaymentHeader(requirements, credentials)).rejects.toThrow(
      'hedera_demo_private_key_unparseable',
    )
  })
})

// Only the "missing" case is exercisable here: babel-preset-expo statically inlines
// process.env.EXPO_PUBLIC_* at transform time (before this test body runs), so a runtime
// process.env write in a test can't change what the already-transformed import sees — the
// "both values present" path is exercised for real by requestSignal's X-PAYMENT integration test
// in gatewayClient.spec.ts and by the live gateway test, not by mutating process.env here.
describe('readDemoCredentialsFromEnv', () => {
  it('returns undefined when either env var is missing (the real default, unset test config)', () => {
    expect(readDemoCredentialsFromEnv()).toBeUndefined()
  })
})
