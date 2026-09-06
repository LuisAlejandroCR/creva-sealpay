// clerk-auth.spec.ts: the requireClerkAuth Express middleware.
import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { createClerkAuth } from "../../src/auth/clerk-auth.js";
import { ClerkVerificationError } from "../../src/core-safe/clerk/clerk-token-verifier.js";
import { InMemoryClerkIdentityStore } from "../../src/auth/identity-store.js";

function appWith(verifier: { verify: (t: string) => Promise<{ sub: string; email: string | null }> }, store = new InMemoryClerkIdentityStore()) {
  const app = express();
  app.use(express.json());
  const mw = createClerkAuth({ verifier: verifier as never, identity: store });
  app.get("/thing", mw, (req, res) => res.json({ userId: req.auth?.userId, email: req.auth?.email }));
  return { app, store };
}

describe("requireClerkAuth", () => {
  it("401 when the Authorization header is missing", async () => {
    const { app } = appWith({ verify: async () => ({ sub: "s", email: null }) });
    await request(app).get("/thing").expect(401);
  });

  it("401 on an invalid token", async () => {
    const { app } = appWith({
      verify: async () => {
        throw new ClerkVerificationError("bad_signature");
      },
    });
    await request(app).get("/thing").set("Authorization", "Bearer x").expect(401);
  });

  it("503 when the JWKS is unreachable (token is fine, retry is the fix)", async () => {
    const { app } = appWith({
      verify: async () => {
        throw new ClerkVerificationError("jwks_unavailable");
      },
    });
    await request(app).get("/thing").set("Authorization", "Bearer x").expect(503);
  });

  it("401 when the Clerk session has no linked Creva user", async () => {
    const { app } = appWith({ verify: async () => ({ sub: "unlinked_sub", email: "n@o.com" }) });
    const res = await request(app).get("/thing").set("Authorization", "Bearer x").expect(401);
    expect(res.body.message).toMatch(/not linked/i);
  });

  it("200 and sets req.auth.userId to the auth.users UUID when linked", async () => {
    const store = new InMemoryClerkIdentityStore();
    store.seed({ clerkUserId: "sub_1", userId: "uuid-9", email: "u@u.com" });
    const app = express();
    app.get(
      "/thing",
      createClerkAuth({ verifier: { verify: async () => ({ sub: "sub_1", email: "u@u.com" }) } as never, identity: store }),
      (req, res) => res.json({ userId: req.auth?.userId }),
    );
    const res = await request(app).get("/thing").set("Authorization", "Bearer x").expect(200);
    expect(res.body.userId).toBe("uuid-9");
  });

  it("does not call the verifier with anything but the raw token", async () => {
    const verify = vi.fn(async () => ({ sub: "sub_1", email: null }));
    const store = new InMemoryClerkIdentityStore();
    store.seed({ clerkUserId: "sub_1", userId: "uuid-1", email: null });
    const app = express();
    app.get("/thing", createClerkAuth({ verifier: { verify } as never, identity: store }), (_req, res) => res.json({ ok: true }));
    await request(app).get("/thing").set("Authorization", "Bearer the-token-value").expect(200);
    expect(verify).toHaveBeenCalledWith("the-token-value");
  });
});
