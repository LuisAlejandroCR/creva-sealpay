// spendingPolicy.ts: the "B2B financial product" piece of the Privy track — a spending policy the
// business owner sets once (monthly cap + per-payment cap, in tinybar) so their agent can pay each
// x402 challenge without re-authorising. Pure and RN-free so it is fuzz/invariant testable. The
// demo signer path never consults this; only the Privy wallet mode does.
export interface SpendingPolicy {
  monthlyCapTinybar: bigint
  perPaymentCapTinybar: bigint
}

export interface SpendingLedgerEntry {
  atMs: number
  amountTinybar: bigint
}

export class SpendingPolicyError extends Error {
  constructor(
    public readonly reason: 'per_payment_cap_exceeded' | 'monthly_cap_exceeded' | 'amount_not_positive',
    message: string,
  ) {
    super(message)
    this.name = 'SpendingPolicyError'
  }
}

function parseCap(raw: string | undefined): bigint | null {
  if (!raw) return null
  if (!/^\d+$/.test(raw.trim())) return null
  try {
    const value = BigInt(raw.trim())
    return value > 0n ? value : null
  } catch {
    return null
  }
}

/**
 * readSpendingPolicyFromEnv: both caps must be present and positive integers, otherwise there is
 * no policy and (with no policy) the Privy wallet mode is not offered at all.
 */
export function readSpendingPolicyFromEnv(): SpendingPolicy | null {
  const monthlyCapTinybar = parseCap(process.env.EXPO_PUBLIC_PRIVY_MONTHLY_CAP_TINYBAR)
  const perPaymentCapTinybar = parseCap(process.env.EXPO_PUBLIC_PRIVY_PER_PAYMENT_CAP_TINYBAR)
  if (monthlyCapTinybar === null || perPaymentCapTinybar === null) return null
  return { monthlyCapTinybar, perPaymentCapTinybar }
}

function monthKey(atMs: number): string {
  const d = new Date(atMs)
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`
}

/** monthlySpentTinybar: sum of ledger entries that fall in the same UTC month as `nowMs`. */
export function monthlySpentTinybar(ledger: readonly SpendingLedgerEntry[], nowMs: number): bigint {
  const key = monthKey(nowMs)
  return ledger.reduce((sum, entry) => (monthKey(entry.atMs) === key ? sum + entry.amountTinybar : sum), 0n)
}

/**
 * assertWithinPolicy: throws SpendingPolicyError when a payment of `amountTinybar` would break the
 * per-payment cap or push this month's total past the monthly cap. Callers MUST run this before
 * building any X-PAYMENT header — see walletCore.buildPrivySignPayment.
 */
export function assertWithinPolicy(
  policy: SpendingPolicy,
  amountTinybar: bigint,
  alreadySpentThisMonthTinybar: bigint,
): void {
  if (amountTinybar <= 0n) {
    throw new SpendingPolicyError('amount_not_positive', `payment amount must be positive, got ${amountTinybar}`)
  }
  if (amountTinybar > policy.perPaymentCapTinybar) {
    throw new SpendingPolicyError(
      'per_payment_cap_exceeded',
      `payment ${amountTinybar} exceeds per-payment cap ${policy.perPaymentCapTinybar}`,
    )
  }
  if (alreadySpentThisMonthTinybar + amountTinybar > policy.monthlyCapTinybar) {
    throw new SpendingPolicyError(
      'monthly_cap_exceeded',
      `payment ${amountTinybar} would push month total ${alreadySpentThisMonthTinybar + amountTinybar} past monthly cap ${policy.monthlyCapTinybar}`,
    )
  }
}
