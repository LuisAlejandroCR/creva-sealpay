// src/index.ts: gateway entry point, exposes the health check route.
import express from "express";

const app = express();
const port = process.env.PORT ?? 8787;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`gateway listening on port ${port}`);
});
