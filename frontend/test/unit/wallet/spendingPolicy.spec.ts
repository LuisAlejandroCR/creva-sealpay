// spendingPolicy.spec.ts: unit cover for the Privy B2B spending policy — env parsing, monthly
// aggregation by UTC month, and the three ways assertWithinPolicy rejects a payment.
import {
  assertWithinPolicy,
  monthlySpentTinybar,
  readSpendingPolicyFromEnv,
  SpendingPolicyError,
  type SpendingPolicy,
} from '../../../features/wallet/spendingPolicy'

const policy: SpendingPolicy = { monthlyCapTinybar: 1000n, perPaymentCapTinybar: 300n }

describe('readSpendingPolicyFromEnv', () => {
  const saved = { ...process.env }
  afterEach(() => {
    process.env = { ...saved }
  })

  it('returns null unless both caps are positive integers', () => {
    delete process.env.EXPO_PUBLIC_PRIVY_MONTHLY_CAP_TINYBAR
    delete process.env.EXPO_PUBLIC_PRIVY_PER_PAYMENT_CAP_TINYBAR
    expect(readSpendingPolicyFromEnv()).toBeNull()

    process.env.EXPO_PUBLIC_PRIVY_MONTHLY_CAP_TINYBAR = '1000'
    expect(readSpendingPolicyFromEnv()).toBeNull()

    process.env.EXPO_PUBLIC_PRIVY_PER_PAYMENT_CAP_TINYBAR = '-5'
    expect(readSpendingPolicyFromEnv()).toBeNull()

    process.env.EXPO_PUBLIC_PRIVY_PER_PAYMENT_CAP_TINYBAR = '300'
    expect(readSpendingPolicyFromEnv()).toEqual({ monthlyCapTinybar: 1000n, perPaymentCapTinybar: 300n })
  })
})

describe('monthlySpentTinybar', () => {
  it('only sums entries in the same UTC month as now', () => {
    const now = Date.UTC(2026, 8, 15)
    const ledger = [
      { atMs: Date.UTC(2026, 8, 1), amountTinybar: 100n },
      { atMs: Date.UTC(2026, 8, 20), amountTinybar: 50n },
      { atMs: Date.UTC(2026, 7, 28), amountTinybar: 999n },
    ]
    expect(monthlySpentTinybar(ledger, now)).toBe(150n)
  })
})

describe('assertWithinPolicy', () => {
  it('passes a payment inside both caps', () => {
    expect(() => assertWithinPolicy(policy, 200n, 100n)).not.toThrow()
  })

  it('rejects a non-positive amount', () => {
    expect(() => assertWithinPolicy(policy, 0n, 0n)).toThrow(SpendingPolicyError)
  })

  it('rejects a payment over the per-payment cap', () => {
    try {
      assertWithinPolicy(policy, 301n, 0n)
      throw new Error('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(SpendingPolicyError)
      expect((err as SpendingPolicyError).reason).toBe('per_payment_cap_exceeded')
    }
  })

  it('rejects a payment that pushes the month past the monthly cap', () => {
    try {
      assertWithinPolicy(policy, 200n, 900n)
      throw new Error('should have thrown')
    } catch (err) {
      expect((err as SpendingPolicyError).reason).toBe('monthly_cap_exceeded')
    }
  })
})
