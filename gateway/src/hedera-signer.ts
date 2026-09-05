// hedera-signer.ts: builds and signs a real Hedera HBAR transfer as an x402 X-PAYMENT payload.
// Reads the payer account/key from the environment at call time only — never logs or returns the
// key itself, only hands the raw string straight to the SDK's key parser.
import {
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  TransactionId,
  TransferTransaction,
} from "@hashgraph/sdk";
import { config } from "./config.js";
import type { HederaExactPaymentPayload, PaymentRequirements } from "./types.js";

export interface HederaPayerCredentials {
  accountId: string;
  privateKey: string;
}

export function readPayerCredentialsFromEnv(): HederaPayerCredentials | undefined {
  const accountId = process.env.HEDERA_PAYER_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PAYER_PRIVATE_KEY;
  if (!accountId || !privateKey) {
    return undefined;
  }
  return { accountId, privateKey };
}

function networkName(): "testnet" | "mainnet" | "previewnet" {
  const net = config.network.split(":").pop();
  return net === "mainnet" || net === "previewnet" ? net : "testnet";
}

function parsePrivateKey(raw: string): PrivateKey {
  for (const parser of [PrivateKey.fromStringECDSA, PrivateKey.fromStringED25519, PrivateKey.fromString]) {
    try {
      return parser(raw);
    } catch {
      continue;
    }
  }
  throw new Error("hedera_payer_private_key_unparseable");
}

export async function buildSignedPaymentHeader(
  requirements: PaymentRequirements,
  credentials: HederaPayerCredentials,
): Promise<string> {
  const payerId = AccountId.fromString(credentials.accountId);
  const payerKey = parsePrivateKey(credentials.privateKey);
  const payToId = AccountId.fromString(requirements.payTo);
  const amountTinybar = Number(requirements.maxAmountRequired);

  const client = Client.forName(networkName());
  client.setOperator(payerId, payerKey);

  const transaction = new TransferTransaction()
    .addHbarTransfer(payerId, Hbar.fromTinybars(-amountTinybar))
    .addHbarTransfer(payToId, Hbar.fromTinybars(amountTinybar));

  if (config.facilitatorFeePayer) {
    transaction.setTransactionId(
      TransactionId.generate(AccountId.fromString(config.facilitatorFeePayer)),
    );
  }

  const frozen = transaction.freezeWith(client);
  const signed = await frozen.sign(payerKey);

  const payload: HederaExactPaymentPayload = {
    x402Version: config.x402Version,
    scheme: "exact",
    network: config.network,
    payload: { transaction: Buffer.from(signed.toBytes()).toString("base64") },
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
