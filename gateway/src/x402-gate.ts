// x402-gate.ts: express middleware that gates a route behind HTTP 402 until a Hedera payment settles.
import type { NextFunction, Request, Response } from "express";
import { settlePayment, verifyPayment } from "./facilitator.js";
import type { PaymentRequirements } from "./types.js";

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

    res.setHeader("X-PAYMENT-RESPONSE", JSON.stringify(settlement));
    next();
  };
}
