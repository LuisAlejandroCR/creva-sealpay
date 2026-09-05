// create-payto-account.spec.ts: one-off, run-once script that uses the existing funded payer
// account to create and fund a second, distinct Hedera testnet account, for use as
// PAY_TO_ADDRESS (self-pay is mathematically invalid against the facilitator's netToPayTo check).
// Prints only the new account id and the creation tx id — never any private key.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { AccountCreateTransaction, AccountId, Client, Hbar, PrivateKey } from "@hashgraph/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(here, "../../.env");

function loadEnvOnce() {
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

loadEnvOnce();

const hasPayerCreds = Boolean(
  process.env.HEDERA_PAYER_ACCOUNT_ID && process.env.HEDERA_PAYER_PRIVATE_KEY,
);

function parsePrivateKey(raw: string) {
  for (const parser of [PrivateKey.fromStringECDSA, PrivateKey.fromStringED25519, PrivateKey.fromString]) {
    try {
      return parser(raw);
    } catch {
      continue;
    }
  }
  throw new Error("payer private key unparseable");
}

describe.skipIf(!hasPayerCreds)("one-off: create a second Hedera testnet account for PAY_TO_ADDRESS", () => {
  it(
    "creates and funds a new account using the existing payer",
    async () => {
      const payerId = AccountId.fromString(process.env.HEDERA_PAYER_ACCOUNT_ID as string);
      const payerKey = parsePrivateKey(process.env.HEDERA_PAYER_PRIVATE_KEY as string);

      const client = Client.forTestnet();
      client.setOperator(payerId, payerKey);

      const newAccountKey = PrivateKey.generateECDSA();

      const tx = await new AccountCreateTransaction()
        .setKey(newAccountKey.publicKey)
        .setInitialBalance(new Hbar(1))
        .execute(client);

      const receipt = await tx.getReceipt(client);
      const newAccountId = receipt.accountId?.toString();

      console.log("creation tx id:", tx.transactionId.toString());
      console.log("new account id:", newAccountId);

      client.close();

      expect(newAccountId).toBeTruthy();
    },
    30_000,
  );
});
