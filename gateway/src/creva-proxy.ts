// creva-proxy.ts: forwards a paid-for request to Creva's real API and relays its response unmodified.
import type { Request, Response } from "express";
import { config } from "./config.js";

export async function proxyToCreva(req: Request, res: Response, path: string) {
  const upstream = await fetch(`${config.crevaApiUrl}${path}`, {
    method: req.method,
    headers: { "content-type": "application/json" },
    body: req.method === "GET" ? undefined : JSON.stringify(req.body),
  });

  const body = await upstream.text();
  res.status(upstream.status);
  res.setHeader("content-type", upstream.headers.get("content-type") ?? "application/json");
  res.send(body);
}
