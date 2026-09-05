// facilitator-failure-never-crashes.invariant.spec.ts: whatever the real facilitator does — refuses
// the connection, times out, or answers with garbage — a gated route must still resolve with a
// clean 402, never an unhandled rejection that takes the whole process down.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import request from "supertest";

const originalFetch = global.fetch;

describe("facilitator failure — never-crash invariant", () => {
  let app: typeof import("../../src/index.js")["app"];

  beforeEach(async () => {
    vi.resetModules();
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("any fetch failure or malformed body from the facilitator still yields 402, never a throw", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant({ kind: "reject" as const }),
          fc.record({ kind: fc.constant("bad-json" as const), body: fc.string() }),
        ),
        async (scenario) => {
          global.fetch =
            scenario.kind === "reject"
              ? (vi.fn().mockRejectedValue(new TypeError("fetch failed")) as unknown as typeof fetch)
              : (vi.fn().mockResolvedValue(
                  new Response(scenario.body, { status: 200, headers: { "content-type": "application/json" } }),
                ) as unknown as typeof fetch);

          vi.resetModules();
          process.env.NODE_ENV = "test";
          ({ app } = await import("../../src/index.js"));

          const res = await request(app)
            .post("/creva-score/report")
            .set("X-PAYMENT", "any-header")
            .send({});

          expect(res.status).toBe(402);
        },
      ),
      { numRuns: 25 },
    );
  });
});
