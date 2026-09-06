// walletCore.ts: pure wiring for the additive payment-wallet layer. Two modes:
//  - 'demo'  -> delegates verbatim to app/features/query/hederaPayment.ts (buildSignedPaymentHeader
//               + readDemoCredentialsFromEnv), which this file never imports statically and never
//               modifies. It is injected, so tests can prove byte-for-byte equivalence with today.
//  - 'privy' -> enforces the spending policy (spendingPolicy.ts) BEFORE producing any header, then
//               delegates the actual signing to an injected Privy-embedded-wallet signer.
// RN-free on purpose; PrivyWalletProvider.tsx supplies the real deps.
import type { PaymentRequirements } from '../query/gatewayClient'
import {
  assertWithinPolicy,
  monthlySpentTinybar,
  type SpendingLedgerEntry,
  type SpendingPolicy,
} from './spendingPolicy'

export type PaymentWalletMode = 'demo' | 'privy'

export interface PaymentWallet {
  mode: PaymentWalletMode
  address: string | null
  availableModes: PaymentWalletMode[]
  /** Returns a base64url X-PAYMENT header for the given 402 requirements, or throws. */
  signPayment(requirements: PaymentRequirements): Promise<string>
}

export interface DemoDeps {
  readDemoCredentials: () => { accountId: string; privateKey: string } | undefined
  buildSignedPaymentHeader: (
    requirements: PaymentRequirements,
    credentials: { accountId: string; privateKey: string },
  ) => Promise<string>
}

export interface PrivyDeps {
  address: string | null
  policy: SpendingPolicy
  /** Persisted history of this wallet's settled payments, used for the monthly-cap check. */
  ledger: readonly SpendingLedgerEntry[]
  now: () => number
  /** The real Privy embedded-wallet signer — builds + signs the x402 payload for `requirements`. */
  privySignPayment: (requirements: PaymentRequirements) => Promise<string>
}

export class WalletNotConfiguredError extends Error {
  constructor(mode: PaymentWalletMode) {
    super(`${mode}_wallet_not_configured`)
    this.name = 'WalletNotConfiguredError'
  }
}

/**
 * resolveAvailableModes: 'demo' is always present. 'privy' appears ONLY when Privy is configured
 * (app id) AND a spending policy exists AND the embedded-wallet signer loaded. With none of that,
 * the returned list is exactly ['demo'] and the flow is identical to today.
 */
export function resolveAvailableModes(opts: {
  privyConfigured: boolean
  policyConfigured: boolean
  privySignerAvailable: boolean
}): PaymentWalletMode[] {
  const modes: PaymentWalletMode[] = ['demo']
  if (opts.privyConfigured && opts.policyConfigured && opts.privySignerAvailable) {
    modes.push('privy')
  }
  return modes
}

export function buildDemoSignPayment(deps: DemoDeps) {
  return async function signPayment(requirements: PaymentRequirements): Promise<string> {
    const credentials = deps.readDemoCredentials()
    if (!credentials) throw new WalletNotConfiguredError('demo')
    return deps.buildSignedPaymentHeader(requirements, credentials)
  }
}

export function buildPrivySignPayment(deps: PrivyDeps) {
  return async function signPayment(requirements: PaymentRequirements): Promise<string> {
    const amountTinybar = BigInt(requirements.maxAmountRequired)
    const spent = monthlySpentTinybar(deps.ledger, deps.now())
    // Throws SpendingPolicyError before any header is built — invariant: no over-policy header.
    assertWithinPolicy(deps.policy, amountTinybar, spent)
    return deps.privySignPayment(requirements)
  }
}

export interface CreatePaymentWalletInput {
  mode: PaymentWalletMode
  availableModes: PaymentWalletMode[]
  demo: DemoDeps
  privy?: PrivyDeps
}

/** createPaymentWallet: assembles the PaymentWallet the screens consume. */
export function createPaymentWallet(input: CreatePaymentWalletInput): PaymentWallet {
  const wantsPrivy = input.mode === 'privy' && input.availableModes.includes('privy') && input.privy
  if (wantsPrivy && input.privy) {
    return {
      mode: 'privy',
      address: input.privy.address,
      availableModes: input.availableModes,
      signPayment: buildPrivySignPayment(input.privy),
    }
  }
  return {
    mode: 'demo',
    address: input.demo.readDemoCredentials()?.accountId ?? null,
    availableModes: input.availableModes,
    signPayment: buildDemoSignPayment(input.demo),
  }
}
