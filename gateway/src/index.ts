// src/index.ts: gateway entry point — health check, plus x402-gated Creva score routes.
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { proxyToCreva } from "./creva-proxy.js";
import type { PaymentRequirements } from "./types.js";
import { createX402Gate } from "./x402-gate.js";

export const app = express();
app.use(helmet());
app.use(express.json({ limit: "100kb" }));

const gatedRouteLimiter = rateLimit({
  windowMs: 60_000,
  limit: Number(process.env.GATEWAY_RATE_LIMIT_PER_MINUTE ?? 120),
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const reportRequirements = (): PaymentRequirements => ({
  scheme: "exact",
  network: config.network,
  maxAmountRequired: config.reportPriceAtomic,
  resource: "/creva-score/report",
  description: "Creva signal report",
  mimeType: "application/json",
  payTo: config.payToAddress,
  maxTimeoutSeconds: 60,
  asset: config.asset,
});

const verifyRequirements = (): PaymentRequirements => ({
  scheme: "exact",
  network: config.network,
  maxAmountRequired: config.verifyPriceAtomic,
  resource: "/creva-score/verify",
  description: "Creva seal verification",
  mimeType: "application/json",
  payTo: config.payToAddress,
  maxTimeoutSeconds: 60,
  asset: config.asset,
});

app.post(
  "/creva-score/report",
  gatedRouteLimiter,
  createX402Gate(reportRequirements),
  (req, res) => {
    void proxyToCreva(req, res, "/creva-score/report");
  },
);

app.post(
  "/creva-score/verify",
  gatedRouteLimiter,
  createX402Gate(verifyRequirements),
  (req, res) => {
    void proxyToCreva(req, res, "/creva-score/verify");
  },
);

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`gateway listening on port ${config.port}`);
  });
}
