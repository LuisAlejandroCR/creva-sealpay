// personal-routes-clerk-gated.invariant.spec.ts
// Invariant: a personal route is never served without a valid Clerk identity, and the personal
// context sent downstream is the resolved auth.users UUID (X-User-Id) — never service identity.
import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import fc from "fast-check";
import { createClerkAuth } from "../../src/auth/clerk-auth.js";
import { InMemoryClerkIdentityStore } from "../../src/auth/identity-store.js";
import { BusinessLogicClient } from "../../src/business-logic-client.js";
import { personalRouter } from "../../src/routes/personal.js";

const PERSONAL_PATHS = [
  "/score",
  "/calculator",
  "/recommendations",
  "/collateral",
  "/declarations",
  "/transactions",
  "/creva-score/disclosure",
  "/creva-score/radar",
];

function buildApp(opts: { linkedSub?: string; userId?: string } = {}) {
  const store = new InMemoryClerkIdentityStore();
  if (opts.linkedSub) {
    store.seed({ clerkUserId: opts.linkedSub, userId: opts.userId ?? "uuid-1", email: "u@u.com" });
  }
  const verifier = {
    verify: async (token: string) => {
      if (token === "good") return { sub: opts.linkedSub ?? "sub_x", email: "u@u.com" };
      throw Object.assign(new Error("bad"), { name: "ClerkVerificationError", reason: "bad_signature" });
    },
  };
  const downstream = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }));
  const client = new BusinessLogicClient({
    baseUrl: "https://core.internal",
    serviceToken: "SERVICE-TOKEN",
    fetchImpl: downstream as never,
  });
  const auth = createClerkAuth({ verifier: verifier as never, identity: store });
  const app = express();
  app.use(express.json());
  app.use(personalRouter({ auth, client }));
  return { app, downstream };
}

describe("invariant: personal routes are Clerk-gated", () => {
  it("no token => never 200, for every personal path", async () => {
    const { app, downstream } = buildApp({ linkedSub: "sub_1" });
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...PERSONAL_PATHS), async (path) => {
        const res = await request(app).get(path);
        expect(res.status).not.toBe(200);
        expect([401, 403, 503]).toContain(res.status);
      }),
      { numRuns: 60 },
    );
    expect(downstream).not.toHaveBeenCalled();
  });

  it("invalid token => 401, never reaches the private service", async () => {
    const { app, downstream } = buildApp({ linkedSub: "sub_1" });
    await request(app).get("/score").set("Authorization", "Bearer nope").expect(401);
    expect(downstream).not.toHaveBeenCalled();
  });

  it("verified but unlinked Clerk session => 401, never reaches the private service", async () => {
    const { app, downstream } = buildApp(); // no seed => resolveClerkSub returns null
    await request(app).get("/score").set("Authorization", "Bearer good").expect(401);
    expect(downstream).not.toHaveBeenCalled();
  });

  it("valid linked token => forwards with X-User-Id = resolved UUID and Bearer = service token", async () => {
    const { app, downstream } = buildApp({ linkedSub: "sub_1", userId: "uuid-777" });
    await request(app).get("/score").set("Authorization", "Bearer good").expect(200);
    expect(downstream).toHaveBeenCalledTimes(1);
    const [, init] = downstream.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    // Personal context is the resolved UUID, carried in its own header.
    expect(headers["X-User-Id"]).toBe("uuid-777");
    // The service token only authenticates the hop; it is never the personal identity.
    expect(headers.Authorization).toBe("Bearer SERVICE-TOKEN");
    // The mobile app's Clerk token is not forwarded to the private service.
    expect(JSON.stringify(headers)).not.toContain("Bearer good");
  });

  it("GET /creva-score/disclosure forwards to the exact path (not a doubled prefix)", async () => {
    const { app, downstream } = buildApp({ linkedSub: "sub_1", userId: "uuid-9" });
    await request(app).get("/creva-score/disclosure").set("Authorization", "Bearer good").expect(200);
    const [url] = downstream.mock.calls[0] as unknown as [string];
    expect(url).toBe("https://core.internal/creva-score/disclosure");
  });

  it("the x402-gated POST /creva-score/report is NOT handled by the personal router (falls through)", async () => {
    const { app, downstream } = buildApp({ linkedSub: "sub_1" });
    // No handler mounted after personalRouter => a fall-through is Express's 404, not a 401/200
    // from the personal router, and the private service is never called.
    const res = await request(app).post("/creva-score/report").send({});
    expect(res.status).toBe(404);
    expect(downstream).not.toHaveBeenCalled();
    const res2 = await request(app).post("/creva-score/verify").send({});
    expect(res2.status).toBe(404);
    expect(downstream).not.toHaveBeenCalled();
  });
});
