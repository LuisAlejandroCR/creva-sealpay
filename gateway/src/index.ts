// src/index.ts: gateway entry point — health check, plus x402-gated Creva score routes.
import express from "express";
import { config } from "./config.js";
import { proxyToCreva } from "./creva-proxy.js";
import type { PaymentRequirements } from "./types.js";
import { createX402Gate } from "./x402-gate.js";

export const app = express();
app.use(express.json());

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

app.post("/creva-score/report", createX402Gate(reportRequirements), (req, res) => {
  void proxyToCreva(req, res, "/creva-score/report");
});

app.post("/creva-score/verify", createX402Gate(verifyRequirements), (req, res) => {
  void proxyToCreva(req, res, "/creva-score/verify");
});

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`gateway listening on port ${config.port}`);
  });
}
