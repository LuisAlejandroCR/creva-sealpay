// regulatory-pending-never-crashes.invariant.spec.ts: two properties for GET /regulatory/pending
// no matter what the radar or subgraph do:
//  (a) it always answers 200 with a JSON body that has folios[] and matchingNorms[];
//  (b) the Creva service access token never appears anywhere in the response body.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import request from "supertest";

const SECRET_TOKEN = "super-secret-creva-access-token-value";

vi.mock("../../src/creva-auth.js", () => ({
  getCrevaAccessToken: vi.fn().mockResolvedValue(SECRET_TOKEN),
}));

const originalFetch = global.fetch;

beforeEach(() => {
  process.env.SUBGRAPH_URL = "https://subgraph.example/creva";
});
afterEach(() => {
  global.fetch = originalFetch;
});

describe("GET /regulatory/pending invariants", () => {
  it("always 200 + well-formed, never leaks the access token", async () => {
    const { app } = await import("../../src/index.js");
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant(200), fc.constant(500), fc.constant(503)),
        fc.oneof(fc.string(), fc.constant('{"data":{"alerts":"broken"}}'), fc.constant('not json')),
        fc.oneof(fc.string({ maxLength: 12 }), fc.integer({ min: 0 }).map(String)),
        async (status, upstreamBody, since) => {
          global.fetch = vi.fn(async () =>
            new Response(upstreamBody, { status, headers: { "content-type": "application/json" } }),
          ) as unknown as typeof fetch;

          const res = await request(app).get("/regulatory/pending").query({ since });
          expect(res.status).toBe(200);
          expect(Array.isArray(res.body.folios)).toBe(true);
          expect(Array.isArray(res.body.matchingNorms)).toBe(true);
          expect(JSON.stringify(res.body)).not.toContain(SECRET_TOKEN);
        },
      ),
      { numRuns: 120 },
    );
  });
});
