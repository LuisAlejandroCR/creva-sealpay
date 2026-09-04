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
    expect(paid.businessName).toBe("Panaderia La Espiga");
    expect(paid.paidWith.amount).toBe(challenge.amount);
    expect(paid.paidWith.txHash).toMatch(/^0xmock/);
  });
});
