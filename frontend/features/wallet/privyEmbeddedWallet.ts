// privyEmbeddedWallet.ts: the ONLY place that touches the Privy SDK. It is loaded lazily and
// defensively: `@privy-io/expo` is deliberately NOT a hard dependency of this repo (adding it and
// its native peer set would put the frozen Hedera demo path at risk on every `npm install`). Until
// the human installs it (see docs/integrations/privy-hedera.md), loadPrivyExpo() returns null, so
// the Privy wallet mode simply never appears and the demo signer is untouched.
import type { PaymentRequirements } from '../query/gatewayClient'
import { hederaTestnet } from './privyChain'

// Assembled at runtime so Metro/jest never treat this as a static import of the frozen build.
const PRIVY_EXPO_MODULE = ['@privy', 'io/expo'].join('-')

export function loadPrivyExpo(): unknown | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    return require(PRIVY_EXPO_MODULE)
  } catch {
    return null
  }
}

export function isPrivySdkAvailable(): boolean {
  return loadPrivyExpo() !== null
}

/** The Hedera chain object to hand Privy's `PrivyProvider` via `supportedChains`. */
export const privySupportedChains = [hederaTestnet]

export interface PrivySignerHandle {
  address: string | null
  signPayment: (requirements: PaymentRequirements) => Promise<string>
}

/**
 * makePrivySigner: turns a connected Privy embedded wallet into the x402 header signer walletCore
 * expects. Kept as a thin adapter with an explicit BLOCKED marker for the parts that need a real
 * Privy account to validate end-to-end (embedded-wallet provisioning + EIP-1193 request wiring).
 */
export function makePrivySigner(_embeddedWallet: unknown): PrivySignerHandle {
  return {
    address: null,
    async signPayment(): Promise<string> {
      // BLOCKED until a real Privy account exists: provision/lookup the embedded wallet for chain
      // 296, build the same x402 "exact" payload shape as hederaPayment.ts, and sign it via the
      // wallet's EIP-1193 provider. Smoke path: docs/integrations/privy-hedera.md.
      throw new Error('privy_embedded_wallet_signing_not_wired: requires a real Privy account')
    },
  }
}
