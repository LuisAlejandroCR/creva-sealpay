// spendingPolicy.fuzz.spec.ts: properties of the pure policy math — monthly aggregation is a
// partition sum, and assertWithinPolicy's verdict matches the plain arithmetic definition.
import fc from 'fast-check'

import {
  assertWithinPolicy,
  monthlySpentTinybar,
  SpendingPolicyError,
  type SpendingLedgerEntry,
} from '../../../features/wallet/spendingPolicy'

describe('spending policy — fuzz', () => {
  it('monthlySpentTinybar never exceeds the total of all entries and is order-independent', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            atMs: fc.integer({ min: Date.UTC(2025, 0, 1), max: Date.UTC(2027, 11, 31) }),
            amountTinybar: fc.bigInt({ min: 0n, max: 1_000_000n }),
          }),
          { maxLength: 40 },
        ),
        fc.integer({ min: Date.UTC(2025, 0, 1), max: Date.UTC(2027, 11, 31) }),
        (ledger: SpendingLedgerEntry[], now) => {
          const total = ledger.reduce((s, e) => s + e.amountTinybar, 0n)
          const inMonth = monthlySpentTinybar(ledger, now)
          const shuffled = [...ledger].reverse()
          expect(monthlySpentTinybar(shuffled, now)).toBe(inMonth)
          expect(inMonth).toBeLessThanOrEqual(total)
        },
      ),
      { numRuns: 50 },
    )
  })

  it('assertWithinPolicy throws iff the payment is non-positive, over per-payment, or over monthly', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 2_000n }),
        fc.bigInt({ min: 1n, max: 1_000n }),
        fc.bigInt({ min: 1n, max: 2_000n }),
        fc.bigInt({ min: 0n, max: 2_000n }),
        (amount, perPaymentCap, monthlyCap, spent) => {
          const shouldThrow = amount <= 0n || amount > perPaymentCap || spent + amount > monthlyCap
          const run = () =>
            assertWithinPolicy({ monthlyCapTinybar: monthlyCap, perPaymentCapTinybar: perPaymentCap }, amount, spent)
          if (shouldThrow) {
            expect(run).toThrow(SpendingPolicyError)
          } else {
            expect(run).not.toThrow()
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})
