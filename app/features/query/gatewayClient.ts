// gatewayClient.ts: calls the real x402-gated /creva-score/report route on the gateway
// (gateway/src/index.ts:66-73), following the same feature-local "talk to the gateway directly"
// pattern as ../onboarding/world-verify-client.ts (EXPO_PUBLIC_GATEWAY_URL, no Clerk header — the
// gateway's own auth is the x402 payment challenge, not a session token).
// A request with no X-PAYMENT header always comes back 402 with the gateway's real payment
// requirements (gateway/src/x402-gate.ts:16-27); a paid retry needs a real X-PAYMENT header, which
// requires a Hedera-wallet payment signer this app does not have yet (see docs/plan.md). There is
// no mock report data anywhere in this file: a call that cannot be paid surfaces as an error, never
// as invented signal data.
import type { SealedReport } from "../../lib/api";

export type PaymentRequirements = {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
};

export type PaymentRequired = {
  status: 402;
  x402Version: number;
  accepts: PaymentRequirements[];
  error?: string;
};

export type Settlement = { transaction: string; network: string } | null;

export type SignalResponse = {
  status: 200;
  report: SealedReport;
  settlement: Settlement;
};

export type QueryResult = PaymentRequired | SignalResponse;

export interface RequestSignalInput {
  businessName?: string;
  stateCode?: number;
}

function gatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL ?? "http://localhost:8787";
}

function parseSettlement(header: string | null): Settlement {
  if (!header) return null;
  try {
    const parsed = JSON.parse(header) as { transaction?: string; network?: string };
    return parsed.transaction ? { transaction: parsed.transaction, network: parsed.network ?? "" } : null;
  } catch {
    return null;
  }
}

/**
 * requestSignal: first call always returns 402 unless `paymentHeader` already carries a settled
 * X-PAYMENT proof (see gateway/src/x402-gate.ts). Never falls back to fake data on a non-402
 * failure — it throws, and the screen renders that as an error state.
 */
export async function requestSignal(
  input: RequestSignalInput,
  paymentHeader?: string
): Promise<QueryResult> {
  const res = await fetch(`${gatewayUrl()}/creva-score/report`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(paymentHeader ? { "X-PAYMENT": paymentHeader } : {}),
    },
    body: JSON.stringify(input),
  });

  if (res.status === 402) {
    const body = (await res.json()) as { x402Version: number; accepts: PaymentRequirements[]; error?: string };
    return { status: 402, x402Version: body.x402Version, accepts: body.accepts, error: body.error };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error((body as { error?: string })?.error ?? "creva_report_failed"), {
      status: res.status,
    });
  }

  const report = (await res.json()) as SealedReport;
  const settlement = parseSettlement(res.headers.get("x-payment-response"));

  return { status: 200, report, settlement };
}
