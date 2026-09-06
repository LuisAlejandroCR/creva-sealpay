// sealClient.ts: verifies a SealedReport's certificate against the real x402-gated
// /creva-score/verify route (gateway/src/index.ts:75-82). There is no folio-lookup endpoint
// anywhere in this stack — CertificateVerification (frontend/lib/api.ts:711-718) is only ever
// produced by POSTing the report+certificate you already hold back to the gateway, which
// recomputes the digest and checks the signature. Like /creva-score/report, this route is
// x402-gated (gateway/src/index.ts:43-53), so a real check first gets a 402; this app has no
// Hedera wallet signer yet to pay it (see docs/plan.md).
import type { CertificateVerification, SealedReport } from "../../lib/api";
import type { PaymentRequirements } from "../query/gatewayClient";
import { parseOnchain } from "./onchain";

export type { SealedReport } from "../../lib/api";

export type VerifyPaymentRequired = {
  status: 402;
  x402Version: number;
  accepts: PaymentRequirements[];
  error?: string;
};

export type VerifySuccess = {
  status: 200;
  verification: CertificateVerification;
};

export type VerifyResult = VerifyPaymentRequired | VerifySuccess;

function gatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL ?? "http://localhost:8787";
}

/**
 * verifySealedReport: never invents a verdict. A non-402 failure throws so the screen can render
 * a real error state instead of a fabricated verification result.
 */
export async function verifySealedReport(sealed: SealedReport, paymentHeader?: string): Promise<VerifyResult> {
  const res = await fetch(`${gatewayUrl()}/creva-score/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(paymentHeader ? { "X-PAYMENT": paymentHeader } : {}),
    },
    body: JSON.stringify(sealed),
  });

  if (res.status === 402) {
    const body = (await res.json()) as { x402Version: number; accepts: PaymentRequirements[]; error?: string };
    return { status: 402, x402Version: body.x402Version, accepts: body.accepts, error: body.error };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error((body as { error?: string })?.error ?? "creva_verify_failed"), {
      status: res.status,
    });
  }

  // The gateway's /creva-score/verify spreads an `onchain` block onto the core verdict
  // (gateway/src/creva-proxy.ts:84-85). Keep it, but normalise it so a malformed block can't
  // reach the screen — parseOnchain returns null for anything that isn't a valid attestation.
  const body = (await res.json()) as CertificateVerification & { onchain?: unknown };
  const verification: CertificateVerification = { ...body, onchain: parseOnchain(body.onchain) };
  return { status: 200, verification };
}
