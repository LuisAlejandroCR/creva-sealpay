// demo-flow-unchanged.invariant.spec.ts: the two load-bearing guarantees of this slice —
//  (1) with no Privy config, the privy mode never appears and the demo header is byte-for-byte
//      what buildSignedPaymentHeader produces directly;
//  (2) the frozen demo signer file (app/features/query/hederaPayment.ts) is not modified at all.
import { execFileSync } from 'child_process'
import fc from 'fast-check'
import { PrivateKey } from '@hashgraph/sdk'

import type { PaymentRequirements } from '../../../features/query/gatewayClient'
import { buildSignedPaymentHeader } from '../../../features/query/hederaPayment'
import { readPrivyConfigFromEnv } from '../../../features/wallet/privyConfig'
import { readSpendingPolicyFromEnv } from '../../../features/wallet/spendingPolicy'
import { createPaymentWallet, resolveAvailableModes } from '../../../features/wallet/walletCore'

const credentials = { accountId: '0.0.1001', privateKey: PrivateKey.generateED25519().toStringDer() }

function requirements(amount: string, payTo: string): PaymentRequirements {
  return {
    scheme: 'exact',
    network: 'hedera:testnet',
    maxAmountRequired: amount,
    resource: '/creva-score/report',
    description: 'Creva signal report',
    mimeType: 'application/json',
    payTo,
    maxTimeoutSeconds: 60,
    asset: '0.0.0',
  }
}

describe('demo flow is identical with Privy absent', () => {
  const saved = { ...process.env }
  afterEach(() => {
    process.env = { ...saved }
  })

  it('privy mode is never offered without config', () => {
    delete process.env.EXPO_PUBLIC_PRIVY_APP_ID
    delete process.env.EXPO_PUBLIC_PRIVY_MONTHLY_CAP_TINYBAR
    delete process.env.EXPO_PUBLIC_PRIVY_PER_PAYMENT_CAP_TINYBAR
    expect(readPrivyConfigFromEnv()).toBeNull()
    expect(readSpendingPolicyFromEnv()).toBeNull()
    expect(
      resolveAvailableModes({ privyConfigured: false, policyConfigured: false, privySignerAvailable: false }),
    ).toEqual(['demo'])
  })

  it('demo mode is a pure delegation: same fn, same args, same return, decoded payload matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5_000_000_000 }).map(String),
        fc.stringMatching(/^0\.0\.[0-9]{1,8}$/),
        async (amount, payTo) => {
          const reqs = requirements(amount, payTo)
          const spy = jest.fn(buildSignedPaymentHeader)
          const wallet = createPaymentWallet({
            mode: 'demo',
            availableModes: ['demo'],
            demo: { readDemoCredentials: () => credentials, buildSignedPaymentHeader: spy },
          })
          const viaWallet = await wallet.signPayment(reqs)

          expect(spy).toHaveBeenCalledTimes(1)
          expect(spy).toHaveBeenCalledWith(reqs, credentials)
          expect(viaWallet).toBe(await spy.mock.results[0].value)

          // The signed transaction bytes carry a fresh timestamp each call, but the x402
          // `accepted` envelope must mirror the requirements exactly (same as a direct call).
          const decode = (h: string) =>
            JSON.parse(Buffer.from(h, 'base64url').toString('utf8')).accepted
          const direct = await buildSignedPaymentHeader(reqs, credentials)
          expect(decode(viaWallet)).toEqual(decode(direct))
        },
      ),
      { numRuns: 20 },
    )
  })
})

describe('the frozen demo signer file is untouched', () => {
  it('git shows no diff for app/features/query/hederaPayment.ts vs origin/main', () => {
    const diff = execFileSync('git', ['diff', 'origin/main', '--', 'app/features/query/hederaPayment.ts'], {
      cwd: process.cwd().endsWith('app') ? `${process.cwd()}/..` : process.cwd(),
      encoding: 'utf8',
    })
    expect(diff.trim()).toBe('')
  })
})
