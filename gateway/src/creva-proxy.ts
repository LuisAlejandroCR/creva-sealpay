// creva-proxy.ts: forwards a paid-for request to Creva's real API and relays its response unmodified.
// Authenticates as the Bazantic service account via getCrevaAccessToken() — never a static JWT.
import type { Request, Response } from "express";
import { config } from "./config.js";
import { getCrevaAccessToken } from "./creva-auth.js";

export async function proxyToCreva(req: Request, res: Response, path: string) {
  let accessToken: string;
  try {
    accessToken = await getCrevaAccessToken();
  } catch {
    // Never proxy without a valid Authorization header — a request Creva can't authenticate
    // is not a request worth sending it.
    res.status(502).json({ error: "creva_auth_unavailable" });
    return;
  }

  const upstream = await fetch(`${config.crevaApiUrl}${path}`, {
    method: req.method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: req.method === "GET" ? undefined : JSON.stringify(req.body),
  });

  const body = await upstream.text();
  res.status(upstream.status);
  res.setHeader("content-type", upstream.headers.get("content-type") ?? "application/json");
  res.send(body);
}
