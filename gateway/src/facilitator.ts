// facilitator.ts: HTTP client for a Hedera testnet x402 facilitator's /verify and /settle endpoints.
import { config } from "./config.js";
import type {
  FacilitatorSettleResult,
  FacilitatorVerifyResult,
  PaymentPayload,
  PaymentRequirements,
} from "./types.js";

function decodePaymentHeader(paymentHeader: string): PaymentPayload {
  try {
    return JSON.parse(Buffer.from(paymentHeader, "base64url").toString("utf8")) as PaymentPayload;
  } catch {
    try {
      return JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf8")) as PaymentPayload;
    } catch {
      return paymentHeader;
    }
  }
}

function facilitatorHeaders() {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.facilitatorAuthToken) {
    headers.authorization = `Bearer ${config.facilitatorAuthToken}`;
  }
  return headers;
}

export function toV2PaymentRequirements(requirements: PaymentRequirements) {
  return {
    scheme: requirements.scheme,
    network: requirements.network,
    amount: requirements.maxAmountRequired,
    asset: requirements.asset,
    payTo: requirements.payTo,
    maxTimeoutSeconds: requirements.maxTimeoutSeconds,
    extra: {
      ...requirements.extra,
      ...(config.facilitatorFeePayer ? { feePayer: config.facilitatorFeePayer } : {}),
    },
  };
}

function facilitatorRequirements(requirements: PaymentRequirements) {
  if (config.x402Version < 2) {
    return requirements;
  }

  return toV2PaymentRequirements(requirements);
}

function facilitatorBody(paymentHeader: string, requirements: PaymentRequirements) {
  return JSON.stringify({
    x402Version: config.x402Version,
    paymentPayload: decodePaymentHeader(paymentHeader),
    paymentRequirements: facilitatorRequirements(requirements),
  });
}

export async function verifyPayment(
  paymentHeader: string,
  requirements: PaymentRequirements,
): Promise<FacilitatorVerifyResult> {
  const res = await fetch(`${config.facilitatorUrl}/verify`, {
    method: "POST",
    headers: facilitatorHeaders(),
    body: facilitatorBody(paymentHeader, requirements),
  });

  if (!res.ok) {
    return { isValid: false, invalidReason: `facilitator_verify_http_${res.status}` };
  }

  return (await res.json()) as FacilitatorVerifyResult;
}

export async function settlePayment(
  paymentHeader: string,
  requirements: PaymentRequirements,
): Promise<FacilitatorSettleResult> {
  const res = await fetch(`${config.facilitatorUrl}/settle`, {
    method: "POST",
    headers: facilitatorHeaders(),
    body: facilitatorBody(paymentHeader, requirements),
  });

  if (!res.ok) {
    return { success: false, errorReason: `facilitator_settle_http_${res.status}` };
  }

  return (await res.json()) as FacilitatorSettleResult;
}
