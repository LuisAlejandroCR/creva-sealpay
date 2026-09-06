// personal.ts: the Clerk-gated personal routes. Every route here runs requireClerkAuth first, so
// req.auth.userId (the auth.users UUID) exists by the time the handler runs. Two backends:
//   - business-logic-client  → score, calculator, recommendations, collateral, declarations,
//     transactions (owned by the private creva-business-logic service; X-User-Id carries identity)
//   - creva-user-proxy       → cards, kyc, profiles, statements (still on the old core; the user's
//     own Clerk token is forwarded, never the service token)
// Nothing here uses service identity for personal data.
import { Router, type Request, type RequestHandler, type Response } from "express";
import { requireClerkAuth as defaultRequireClerkAuth } from "../auth/clerk-auth.js";
import { BusinessLogicClient, businessLogicClient } from "../business-logic-client.js";
import { proxyPersonalToCore } from "../creva-user-proxy.js";
import type { SourceResult } from "../core-safe/types/source-result.js";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

// Map a typed SourceResult onto an HTTP response without leaking upstream detail.
function sendResult(res: Response, result: SourceResult<unknown>): void {
  if (result.available) {
    res.status(200).json(result.data);
    return;
  }
  const httpMatch = /^http_(\d{3})$/.exec(result.error ?? "");
  if (httpMatch) {
    const status = Number(httpMatch[1]);
    // Pass client errors straight through; collapse upstream 5xx to 503.
    res.status(status >= 400 && status < 500 ? status : 503).json({ message: "core_unavailable", reason: result.error });
    return;
  }
  res.status(503).json({ message: "core_unavailable", reason: result.error });
}

// Forward one Clerk-authenticated request to the private service, preserving method / path / body
// / querystring. The path sent to the service is identical to the path the frontend calls.
function forwardToBusinessLogic(client: BusinessLogicClient, pathPrefix: string) {
  return async (req: Request, res: Response): Promise<void> => {
    const userId = req.auth?.userId ?? "";
    const suffix = req.path === "/" ? "" : req.path;
    const query = req.originalUrl.includes("?")
      ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
      : "";
    const targetPath = `${pathPrefix}${suffix}${query}`;
    const method = req.method as HttpMethod;
    const body =
      method === "GET" || method === "DELETE" ? undefined : (req.body as unknown);
    const result = await client.callForUser(userId, method, targetPath, body);
    sendResult(res, result);
  };
}

export interface PersonalRouterDeps {
  /** The Clerk auth middleware. Defaults to the config-backed singleton. */
  auth?: RequestHandler;
  /** The client to the private service. Defaults to the config-backed singleton. */
  client?: BusinessLogicClient;
}

export function personalRouter(deps: PersonalRouterDeps = {}): Router {
  const router = Router();
  const auth = deps.auth ?? defaultRequireClerkAuth;
  const client = deps.client ?? businessLogicClient();

  // ── Backed by the private creva-business-logic service ──────────────────────
  router.use("/score", auth, forwardToBusinessLogic(client, "/score"));
  router.use("/calculator", auth, forwardToBusinessLogic(client, "/calculator"));
  router.use("/recommendations", auth, forwardToBusinessLogic(client, "/recommendations"));
  router.use("/collateral", auth, forwardToBusinessLogic(client, "/collateral"));
  router.use("/declarations", auth, forwardToBusinessLogic(client, "/declarations"));
  router.use("/transactions", auth, forwardToBusinessLogic(client, "/transactions"));

  // ── Still on the old core — forward the user's own Clerk token ──────────────
  router.use("/profiles", auth, (req, res) =>
    proxyPersonalToCore(req, res, `/profiles${req.path === "/" ? "" : req.path}`),
  );
  router.use("/kyc", auth, (req, res) =>
    proxyPersonalToCore(req, res, `/kyc${req.path === "/" ? "" : req.path}`),
  );
  router.use("/cards", auth, (req, res) =>
    proxyPersonalToCore(req, res, `/cards${req.path === "/" ? "" : req.path}`),
  );
  router.use("/statements", auth, (req, res) =>
    proxyPersonalToCore(req, res, `/statements${req.path === "/" ? "" : req.path}`),
  );

  return router;
}
