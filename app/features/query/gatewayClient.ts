// gatewayClient.ts: typed mock of the x402-gated signal query endpoint until the real gateway lands.
// Shape follows brainstorming.md §1 (Hedera x402) and §8: 402 with payment terms, then 200 with signal data.
export type PaymentRequired = {
  status: 402;
  amount: string;
  asset: "USDC";
  network: "hedera-testnet";
  facilitator: string;
  payTo: string;
};

export type SignalResponse = {
  status: 200;
  businessName: string;
  signalsFound: number;
  sources: string[];
  paidWith: { amount: string; asset: "USDC"; txHash: string };
};

export type QueryResult = PaymentRequired | SignalResponse;

const MOCK_PAYMENT_TERMS: Omit<PaymentRequired, "status"> = {
  amount: "0.30",
  asset: "USDC",
  network: "hedera-testnet",
  facilitator: "bazantic-mock-facilitator",
  payTo: "0.0.mock-gateway-account",
};

// requestSignal: first call always returns 402; pass the previous 402's terms back in as `payment`
// to simulate settling it and receiving the paid response, matching the real x402 challenge/retry flow.
export async function requestSignal(
  businessName: string,
  payment?: PaymentRequired
): Promise<QueryResult> {
  if (!payment) {
    return { status: 402, ...MOCK_PAYMENT_TERMS };
  }

  return {
    status: 200,
    businessName,
    signalsFound: 3,
    sources: ["DOF", "CNBV", "SAT"],
    paidWith: {
      amount: payment.amount,
      asset: payment.asset,
      txHash: `0xmock${Date.now().toString(16)}`,
    },
  };
}
