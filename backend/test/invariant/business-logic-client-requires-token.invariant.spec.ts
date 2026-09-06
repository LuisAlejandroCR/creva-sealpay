// business-logic-client-requires-token.invariant.spec.ts
// Invariant 1: the client never issues a request without CORE_SERVICE_TOKEN.
// Invariant 2: a 5xx (or timeout, or network error) from the private service never throws.
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { BusinessLogicClient } from "../../src/business-logic-client.js";

describe("invariant: business-logic-client never calls without a service token", () => {
  it("no token => no fetch, for every method/path/user", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("GET", "POST", "PATCH", "PUT", "DELETE"),
        fc.string({ minLength: 1 }).map((s) => `/${s.replace(/\s/g, "")}`),
        fc.string(),
        async (method, path, userId) => {
          const spy = vi.fn();
          const client = new BusinessLogicClient({
            baseUrl: "https://core.internal",
            serviceToken: undefined,
            fetchImpl: spy as never,
          });
          const r = await client.callForUser(userId, method as never, path);
          expect(spy).not.toHaveBeenCalled();
          expect(r.available).toBe(false);
          expect(["core_service_token_not_configured", "missing_user_id"]).toContain(r.error);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("also never calls without a base URL", async () => {
    const spy = vi.fn();
    const client = new BusinessLogicClient({
      baseUrl: undefined,
      serviceToken: "present",
      fetchImpl: spy as never,
    });
    const r = await client.callForUser("uuid", "GET", "/score");
    expect(spy).not.toHaveBeenCalled();
    expect(r.available).toBe(false);
  });
});

describe("invariant: a failing private service never crashes backend", () => {
  it("any HTTP status or thrown fetch yields a typed unavailable result, never an exception", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer({ min: 400, max: 599 }).map((status) => ({ kind: "status" as const, status })),
          fc.constantFrom("TimeoutError", "AbortError", "TypeError", "Error").map((name) => ({
            kind: "throw" as const,
            name,
          })),
        ),
        async (scenario) => {
          const fetchImpl = vi.fn(async () => {
            if (scenario.kind === "throw") {
              const e = new Error("fail");
              e.name = scenario.name;
              throw e;
            }
            return { ok: false, status: scenario.status, json: async () => ({}) };
          });
          const client = new BusinessLogicClient({
            baseUrl: "https://core.internal",
            serviceToken: "svc",
            fetchImpl: fetchImpl as never,
          });
          const r = await client.callForUser("uuid", "GET", "/score");
          expect(r.available).toBe(false);
          expect(r.data).toBeNull();
          expect(typeof r.error).toBe("string");
        },
      ),
      { numRuns: 200 },
    );
  });
});
