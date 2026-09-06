// no-header-over-policy.invariant.spec.ts: signPayment in privy mode must NEVER hand back an
// X-PAYMENT header for an amount the configured spending policy forbids — the policy check runs
// first and, when it throws, the injected Privy signer is never even invoked.
import fc from 'fast-check'

import type { PaymentRequirements } from '../../../features/query/gatewayClient'
import { SpendingPolicyError } from '../../../features/wallet/spendingPolicy'
import { createPaymentWallet } from '../../../features/wallet/walletCore'

function requirements(amountTinybar: bigint): PaymentRequirements {
  return {
    scheme: 'exact',
    network: 'hedera:testnet',
    maxAmountRequired: amountTinybar.toString(),
    resource: '/creva-score/report',
    description: 'Creva signal report',
    mimeType: 'application/json',
    payTo: '0.0.7162784',
    maxTimeoutSeconds: 60,
    asset: '0.0.0',
  }
}

describe('privy signPayment never exceeds the spending policy', () => {
  it('over-cap amounts throw and produce no header; in-cap amounts sign exactly once', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 1n, max: 10_000_000_000n }),
        fc.bigInt({ min: 1n, max: 5_000_000_000n }),
        fc.bigInt({ min: 0n, max: 5_000_000_000n }),
        fc.bigInt({ min: 0n, max: 5_000_000_000n }),
        async (amount, perPaymentCap, monthlyHeadroom, alreadySpent) => {
          const monthlyCap = alreadySpent + monthlyHeadroom
          const privySignPayment = jest.fn().mockResolvedValue('PRIVY_HEADER')
          const wallet = createPaymentWallet({
            mode: 'privy',
            availableModes: ['demo', 'privy'],
            demo: { readDemoCredentials: () => undefined, buildSignedPaymentHeader: jest.fn() },
            privy: {
              address: '0xabc',
              policy: { monthlyCapTinybar: monthlyCap, perPaymentCapTinybar: perPaymentCap },
              ledger: alreadySpent > 0n ? [{ atMs: Date.now(), amountTinybar: alreadySpent }] : [],
              now: () => Date.now(),
              privySignPayment,
            },
          })

          const withinPolicy = amount <= perPaymentCap && alreadySpent + amount <= monthlyCap
          if (withinPolicy) {
            await expect(wallet.signPayment(requirements(amount))).resolves.toBe('PRIVY_HEADER')
            expect(privySignPayment).toHaveBeenCalledTimes(1)
          } else {
            await expect(wallet.signPayment(requirements(amount))).rejects.toBeInstanceOf(SpendingPolicyError)
            expect(privySignPayment).not.toHaveBeenCalled()
          }
        },
      ),
      { numRuns: 60 },
    )
  })
})
