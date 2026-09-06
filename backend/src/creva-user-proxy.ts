// creva-user-proxy.ts: forwards a Clerk-authenticated personal request to the OLD Creva core
// (creva_finance on Cloud Run) for the modules the private creva-business-logic service does not
// own yet — cards, kyc, profiles, statements. It forwards the END USER's own bearer token
// untouched, NOT the Bazantic service token: personal data is never fetched with service identity.
// The old core accepts the Clerk token directly when it runs AUTH_PROVIDER=both. creva-proxy.ts
// stays for the non-personal x402 report/verify flow, which is keyed on a business subject.
import type { Request, Response } from "express";
import { config } from "./config.js";

const FORWARDABLE_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export async function proxyPersonalToCore(
  req: Request,
  res: Response,
  targetPath: string,
): Promise<void> {
  if (!req.auth) {
    // Defensive: this proxy must only ever run behind requireClerkAuth.
    res.status(401).json({ message: "Missing bearer token" });
    return;
  }
  if (!FORWARDABLE_METHODS.has(req.method)) {
    res.status(405).json({ message: "method_not_allowed" });
    return;
  }

  const inboundAuth = req.headers.authorization;
  if (!inboundAuth) {
    res.status(401).json({ message: "Missing bearer token" });
    return;
  }

  const query = req.originalUrl.includes("?")
    ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
    : "";

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(`${config.crevaApiUrl}${targetPath}${query}`, {
      method: req.method,
      headers: {
        "content-type": "application/json",
        // The user's own token — the whole point of this file.
        authorization: inboundAuth,
      },
      body: req.method === "GET" || req.method === "DELETE" ? undefined : JSON.stringify(req.body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    // A core outage is a typed 502, never a crash.
    res.status(502).json({ message: "core_unavailable" });
    return;
  }

  const body = await upstream.text();
  res.status(upstream.status);
  res.setHeader("content-type", upstream.headers.get("content-type") ?? "application/json");
  res.send(body);
}
