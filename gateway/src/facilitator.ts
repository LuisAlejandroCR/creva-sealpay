// facilitator.ts: HTTP client for a Hedera testnet x402 facilitator's /verify and /settle endpoints.
import { config } from "./config.js";
import type {
  FacilitatorSettleResult,
  FacilitatorVerifyResult,
  PaymentRequirements,
} from "./types.js";

export async function verifyPayment(
  paymentHeader: string,
  requirements: PaymentRequirements,
): Promise<FacilitatorVerifyResult> {
  const res = await fetch(`${config.facilitatorUrl}/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paymentHeader, paymentRequirements: requirements }),
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
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paymentHeader, paymentRequirements: requirements }),
  });

  if (!res.ok) {
    return { success: false, errorReason: `facilitator_settle_http_${res.status}` };
  }

  return (await res.json()) as FacilitatorSettleResult;
}
