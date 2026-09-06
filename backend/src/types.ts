// types.ts: shared x402 payment protocol types used by the gate, facilitator client, and proxy.
export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, unknown>;
}

export interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentRequirements[];
  error?: string;
}

export interface PaymentRequirementsV2 {
  scheme: "exact";
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

// x402 v2 PaymentPayload shape (spec: PaymentPayloadV2Schema) — `accepted` is required, and
// there is no top-level scheme/network. A payload missing `accepted` fails the facilitator's
// zod validation for both v1 and v2 schemas at once (v1 needs x402Version===1; v2 needs
// `accepted`), which is why the malformed v1-shaped payload this used to build produced a 500.
export interface HederaExactPaymentPayload {
  x402Version: 2;
  accepted: PaymentRequirementsV2;
  payload: { transaction: string };
}

export type PaymentPayload = HederaExactPaymentPayload | Record<string, unknown> | string;

// On-chain trust layer added alongside (never replacing) the core's content/signature verdict.
// trustSignal is the one output only the subgraph-indexed attestation data can move.
export type OnchainTrustSignal = "unattested" | "attested" | "corroborated";

export interface OnchainAttestation {
  attestationCount: number;
  distinctAttesters: number;
  lastAttestedAt: string | null;
  trustSignal: OnchainTrustSignal;
}

export function trustSignalFor(distinctAttesters: number): OnchainTrustSignal {
  if (distinctAttesters >= 2) return "corroborated";
  if (distinctAttesters >= 1) return "attested";
  return "unattested";
}

export interface FacilitatorVerifyResult {
  isValid: boolean;
  invalidReason?: string;
}

export interface FacilitatorSettleResult {
  success: boolean;
  errorReason?: string;
  transaction?: string;
  network?: string;
}
