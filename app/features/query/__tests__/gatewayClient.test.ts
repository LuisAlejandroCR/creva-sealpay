import { requestSignal } from "../gatewayClient";

describe("requestSignal", () => {
  it("returns 402 without payment", async () => {
    const res = await requestSignal("Panaderia La Espiga");
    expect(res.status).toBe(402);
  });

  it("returns 200 with signal data once the 402 terms are paid", async () => {
    const challenge = await requestSignal("Panaderia La Espiga");
    if (challenge.status !== 402) throw new Error("expected 402");

    const paid = await requestSignal("Panaderia La Espiga", challenge);
    expect(paid.status).toBe(200);
    if (paid.status !== 200) throw new Error("expected 200");
    expect(paid.signal.businessName).toBe("Panaderia La Espiga");
    expect(challenge.accepts[0].asset).toBe("USDC");
    expect(paid.settlement.transaction).toMatch(/^0xmock/);
  });
});
