// hedera-signer.spec.ts: verifies the signed X-PAYMENT payload built from payment requirements,
// using a freshly generated test keypair — freezing and signing a transaction never hits the
// network, so this stays a fast unit test, not a live-testnet integration test.
import { PrivateKey } from "@hashgraph/sdk";
import { describe, expect, it } from "vitest";
import { config } from "../../src/config.js";
import { buildSignedPaymentHeader, readPayerCredentialsFromEnv } from "../../src/hedera-signer.js";
import type { HederaExactPaymentPayload, PaymentRequirements } from "../../src/types.js";

const requirements: PaymentRequirements = {
  scheme: "exact",
  network: "hedera:testnet",
  maxAmountRequired: "10000000",
  resource: "/creva-score/report",
  description: "Creva signal report",
  mimeType: "application/json",
  payTo: "0.0.7162784",
  maxTimeoutSeconds: 60,
  asset: "0.0.0",
};

describe("buildSignedPaymentHeader", () => {
  it("produces a decodable, correctly-shaped signed transfer payload", async () => {
    const credentials = {
      accountId: "0.0.1001",
      privateKey: PrivateKey.generateED25519().toStringDer(),
    };

    const header = await buildSignedPaymentHeader(requirements, credentials);
    const decoded = JSON.parse(
      Buffer.from(header, "base64url").toString("utf8"),
    ) as HederaExactPaymentPayload;

    expect(decoded.scheme).toBe("exact");
    expect(decoded.network).toBe(config.network);
    expect(typeof decoded.payload.transaction).toBe("string");
    expect(decoded.payload.transaction.length).toBeGreaterThan(0);
  });
});

describe("readPayerCredentialsFromEnv", () => {
  it("returns undefined when either env var is missing", () => {
    const original = { ...process.env };
    delete process.env.HEDERA_PAYER_ACCOUNT_ID;
    delete process.env.HEDERA_PAYER_PRIVATE_KEY;

    expect(readPayerCredentialsFromEnv()).toBeUndefined();

    process.env = original;
  });
});
