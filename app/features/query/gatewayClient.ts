// gatewayClient.ts: typed mock of the x402-gated signal query endpoint.
// Response shapes mirror the real gateway (gateway/src/types.ts, gateway/src/x402-gate.ts):
// 402 body is PaymentRequiredResponse (x402Version/accepts/error), 200 body is whatever
// /creva-score/report proxies back from Creva verbatim, with settlement info carried in
// X-PAYMENT-RESPONSE — modeled here as `settlement` since this mock has no real header transport.
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

export type SignalResponse = {
  status: 200;
  signal: Record<string, unknown>;
  settlement: { success: true; transaction: string; network: string };
};

export type QueryResult = PaymentRequired | SignalResponse;

const MOCK_REQUIREMENTS: PaymentRequirements = {
  scheme: "exact",
  network: "hedera-testnet",
  maxAmountRequired: "300000",
  resource: "/creva-score/report",
  description: "Creva signal report",
  mimeType: "application/json",
  payTo: "0.0.mock-gateway-account",
  maxTimeoutSeconds: 60,
  asset: "USDC",
};

// requestSignal: first call always returns 402; pass the previous 402's requirements back in as
// `payment` to simulate settling it and receiving the paid response, matching the real x402
// challenge/retry flow (gateway/src/x402-gate.ts).
export async function requestSignal(
  businessName: string,
  payment?: PaymentRequired
): Promise<QueryResult> {
  if (!payment) {
    return { status: 402, x402Version: 1, accepts: [MOCK_REQUIREMENTS] };
  }

  return {
    status: 200,
    signal: { businessName, signalsFound: 3, sources: ["DOF", "CNBV", "SAT"] },
    settlement: {
      success: true,
      transaction: `0xmock${Date.now().toString(16)}`,
      network: "hedera-testnet",
    },
  };
}
