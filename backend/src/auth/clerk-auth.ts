// clerk-auth.ts: the Express request authenticator for the mobile app's Clerk session token.
// backend/ validates the Clerk JWT itself (via core-safe/clerk) and resolves the Clerk subject to
// the auth.users UUID against its own clerk_identities map, then attaches { userId } to the request.
// Downstream, business-logic-client sends that UUID as X-User-Id — the personal-data context — and
// the fixed CORE_SERVICE_TOKEN only authenticates the service-to-service call. A personal route is
// never reached with service identity alone.
import type { Request, Response, NextFunction, RequestHandler } from "express";
import {
  ClerkTokenVerifier,
  ClerkVerificationError,
  type ClerkVerifier,
} from "../core-safe/clerk/clerk-token-verifier.js";
import { UNLINKED_CLERK_ACCOUNT } from "../core-safe/clerk/unlinked-clerk-account.js";
import type { ClerkUserMapping } from "../core-safe/clerk/clerk-user-mapping.port.js";
import {
  SupabaseClerkIdentityStore,
  type ClerkIdentityStore,
} from "./identity-store.js";
import { config } from "../config.js";

export interface RequestIdentity {
  /** The auth.users UUID — the id every personal route keys on. Never the Clerk subject. */
  userId: string;
  email: string;
  clerkSub: string;
}

// Module augmentation so `req.auth` is typed everywhere without a cast.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: RequestIdentity;
    }
  }
}

export interface ClerkAuthDeps {
  verifier: ClerkVerifier;
  identity: ClerkUserMapping;
}

export class ClerkAuthNotConfiguredError extends Error {
  constructor() {
    super("clerk_auth_not_configured");
    this.name = "ClerkAuthNotConfiguredError";
  }
}

/** Builds the deps from config, or throws if CLERK_* / SUPABASE_* are missing. */
export function clerkAuthDepsFromConfig(): ClerkAuthDeps {
  if (!config.clerkJwksUrl && !config.clerkIssuer) {
    throw new ClerkAuthNotConfiguredError();
  }
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new ClerkAuthNotConfiguredError();
  }
  const verifier = new ClerkTokenVerifier({
    jwksUrl: config.clerkJwksUrl,
    issuer: config.clerkIssuer,
    authorizedParty: config.clerkAuthorizedParty,
  });
  const identity: ClerkIdentityStore = new SupabaseClerkIdentityStore();
  return { verifier, identity };
}

/**
 * Returns an Express middleware that requires a valid Clerk token linked to a Creva user.
 * On success it sets `req.auth`. On failure it answers and does not call next():
 *   401  missing/invalid token, or a verified session with no linked row (UNLINKED_CLERK_ACCOUNT)
 *   503  Clerk's JWKS is unreachable — nothing about the token is wrong, retrying is the fix
 */
export function createClerkAuth(deps: ClerkAuthDeps): RequestHandler {
  return function requireClerkAuth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ message: "Missing bearer token" });
      return;
    }
    const token = header.slice(7);

    void (async () => {
      let session: Awaited<ReturnType<ClerkVerifier["verify"]>>;
      try {
        session = await deps.verifier.verify(token);
      } catch (error) {
        if (error instanceof ClerkVerificationError && error.isTransient) {
          res.status(503).json({ message: "Clerk verification is temporarily unavailable" });
          return;
        }
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }

      let user: Awaited<ReturnType<ClerkUserMapping["resolveClerkSub"]>>;
      try {
        user = await deps.identity.resolveClerkSub(session.sub);
      } catch {
        res.status(500).json({ message: "Could not resolve the Clerk identity" });
        return;
      }
      if (!user) {
        res.status(401).json({ message: UNLINKED_CLERK_ACCOUNT });
        return;
      }

      req.auth = {
        userId: user.id,
        email: user.email || session.email || "",
        clerkSub: session.sub,
      };
      next();
    })();
  };
}

// Lazily-built singleton for the app wiring. A route file imports `requireClerkAuth`; the deps are
// resolved on first request so the process still boots with Clerk disabled (the middleware then
// answers 503 for every call it guards, never 200).
let cached: RequestHandler | null = null;

export const requireClerkAuth: RequestHandler = (req, res, next) => {
  if (!cached) {
    try {
      cached = createClerkAuth(clerkAuthDepsFromConfig());
    } catch {
      res.status(503).json({ message: "Clerk authentication is not configured" });
      return;
    }
  }
  cached(req, res, next);
};

/** Test-only: drop the cached middleware. */
export function resetClerkAuthForTests(): void {
  cached = null;
}
