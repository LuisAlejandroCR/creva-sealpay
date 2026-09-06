// x402-gate.ts: express middleware that gates a route behind HTTP 402 until a Hedera payment settles.
// Tracks settled X-PAYMENT headers in-process (see docs/memoria.md, replay-protection finding) so a
// proof that already paid for one call can't be replayed to buy a second one from this gateway.
import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { settlePayment, verifyPayment } from "./facilitator.js";
import type { PaymentRequirements } from "./types.js";

const usedPaymentHashes = new Set<string>();

function hashPaymentHeader(paymentHeader: string): string {
  return createHash("sha256").update(paymentHeader).digest("hex");
}

export function createX402Gate(buildRequirements: (req: Request) => PaymentRequirements) {
  return async function x402Gate(req: Request, res: Response, next: NextFunction) {
    const requirements = buildRequirements(req);
    const paymentHeader = req.header("X-PAYMENT");

    if (!paymentHeader) {
      res.status(402).json({
        x402Version: 1,
        accepts: [requirements],
        error: "payment_required",
      });
      return;
    }

    const paymentHash = hashPaymentHeader(paymentHeader);
    if (usedPaymentHashes.has(paymentHash)) {
      res.status(402).json({
        x402Version: 1,
        accepts: [requirements],
        error: "payment_already_used",
      });
      return;
    }

    const verification = await verifyPayment(paymentHeader, requirements);
    if (!verification.isValid) {
      res.status(402).json({
        x402Version: 1,
        accepts: [requirements],
        error: verification.invalidReason ?? "invalid_payment",
      });
      return;
    }

    const settlement = await settlePayment(paymentHeader, requirements);
    if (!settlement.success) {
      res.status(402).json({
        x402Version: 1,
        accepts: [requirements],
        error: settlement.errorReason ?? "settlement_failed",
      });
      return;
    }

    usedPaymentHashes.add(paymentHash);
    res.setHeader("X-PAYMENT-RESPONSE", JSON.stringify(settlement));
    next();
  };
}
