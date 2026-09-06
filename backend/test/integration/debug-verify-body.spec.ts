// debug-verify-body.spec.ts: reconstructs the exact JSON body facilitator.ts sends to /verify,
// without making a real network call, to inspect why the live facilitator returns HTTP 500.
// Read-only diagnostic — safe to delete once the root cause is found.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect } from "vitest";
import request from "supertest";

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
process.env.NODE_ENV = "test";

const hasPayerCreds = Boolean(
  process.env.HEDERA_PAYER_ACCOUNT_ID && process.env.HEDERA_PAYER_PRIVATE_KEY,
);

describe.skipIf(!hasPayerCreds)("debug: reconstruct facilitator /verify body (no network call)", () => {
  it("prints the exact body facilitator.ts would send", async () => {
    const { app } = await import("../../src/index.js");
    const { buildSignedPaymentHeader, readPayerCredentialsFromEnv } = await import(
      "../../src/hedera-signer.js"
    );
    const { config } = await import("../../src/config.js");

    const challenge = await request(app).post("/creva-score/report").send({});
    expect(challenge.status).toBe(402);
    const requirements = challenge.body.accepts[0];

    const credentials = readPayerCredentialsFromEnv();
    if (!credentials) throw new Error("no payer credentials");

    const paymentHeader = await buildSignedPaymentHeader(requirements, credentials);

    // Replicate facilitator.ts's decodePaymentHeader + facilitatorRequirements + facilitatorBody
    // logic inline (those helpers aren't exported), redacting only the signed transaction bytes.
    let paymentPayload: unknown;
    try {
      paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64url").toString("utf8"));
    } catch {
      paymentPayload = paymentHeader;
    }

    let normalizedRequirements: Record<string, unknown> = requirements;
    if (config.x402Version >= 2) {
      const { maxAmountRequired, ...rest } = requirements;
      normalizedRequirements = {
        ...rest,
        amount: maxAmountRequired,
        extra: {
          ...requirements.extra,
          ...(config.facilitatorFeePayer ? { feePayer: config.facilitatorFeePayer } : {}),
        },
      };
    }

    const body = {
      x402Version: config.x402Version,
      paymentPayload,
      paymentRequirements: normalizedRequirements,
    };

    const redactedPayload =
      typeof paymentPayload === "object" && paymentPayload !== null && "payload" in paymentPayload
        ? {
            ...paymentPayload,
            payload: { transaction: `<base64, ${(paymentPayload as { payload: { transaction: string } }).payload.transaction.length} chars>` },
          }
        : paymentPayload;

    console.log("config values used:", {
      facilitatorUrl: config.facilitatorUrl,
      x402Version: config.x402Version,
      network: config.network,
      asset: config.asset,
      facilitatorFeePayer: config.facilitatorFeePayer,
      payToAddress: config.payToAddress,
    });
    console.log(
      "exact /verify request body (transaction bytes redacted, structure intact):",
      JSON.stringify({ ...body, paymentPayload: redactedPayload }, null, 2),
    );

    expect(body.x402Version).toBeDefined();
  });
});
