// hederaPayment.ts: builds a signed x402 X-PAYMENT header client-side, mirroring
// gateway/src/hedera-signer.ts's buildSignedPaymentHeader but using a demo-scoped testnet
// keypair from EXPO_PUBLIC_* env vars instead of the gateway's own facilitator fee-payer.
// Freezing and signing a TransferTransaction never opens a network connection (only
// `.execute()` would) — the app never submits to Hedera itself, the facilitator does that via
// the gateway's existing /verify and /settle calls (gateway/src/facilitator.ts).
import { AccountId, Hbar, PrivateKey, TransactionId, TransferTransaction } from '@hashgraph/sdk'

import type { PaymentRequirements } from './gatewayClient'

export interface HederaDemoCredentials {
  accountId: string
  privateKey: string
}

export function readDemoCredentialsFromEnv(): HederaDemoCredentials | undefined {
  const accountId = process.env.EXPO_PUBLIC_HEDERA_DEMO_ACCOUNT_ID
  const privateKey = process.env.EXPO_PUBLIC_HEDERA_DEMO_PRIVATE_KEY
  if (!accountId || !privateKey) {
    return undefined
  }
  return { accountId, privateKey }
}

function parsePrivateKey(raw: string): PrivateKey {
  for (const parser of [PrivateKey.fromStringECDSA, PrivateKey.fromStringED25519, PrivateKey.fromString]) {
    try {
      return parser(raw)
    } catch {
      continue
    }
  }
  throw new Error('hedera_demo_private_key_unparseable')
}

/**
 * buildSignedPaymentHeader: freezes and signs a real HBAR TransferTransaction from the demo
 * payer to the requirement's payTo account, then wraps it as the x402 v2 "exact" payload the
 * gateway's facilitator expects (gateway/src/types.ts's HederaExactPaymentPayload). Never
 * touches the network — no client is connected, nothing is submitted from the device.
 */
export async function buildSignedPaymentHeader(
  requirements: PaymentRequirements,
  credentials: HederaDemoCredentials,
): Promise<string> {
  const payerId = AccountId.fromString(credentials.accountId)
  const payerKey = parsePrivateKey(credentials.privateKey)
  const payToId = AccountId.fromString(requirements.payTo)
  const amountTinybar = Number(requirements.maxAmountRequired)

  const transaction = new TransferTransaction()
    .addHbarTransfer(payerId, Hbar.fromTinybars(-amountTinybar))
    .addHbarTransfer(payToId, Hbar.fromTinybars(amountTinybar))
    .setTransactionId(TransactionId.generate(payerId))
    .setNodeAccountIds([new AccountId(3)])
    .freeze()

  const signed = await transaction.sign(payerKey)

  const payload = {
    x402Version: 2 as const,
    accepted: {
      scheme: requirements.scheme,
      network: requirements.network,
      amount: requirements.maxAmountRequired,
      asset: requirements.asset,
      payTo: requirements.payTo,
      maxTimeoutSeconds: requirements.maxTimeoutSeconds,
    },
    payload: { transaction: Buffer.from(signed.toBytes()).toString('base64') },
  }

  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}
