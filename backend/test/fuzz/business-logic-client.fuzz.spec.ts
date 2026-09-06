// business-logic-client.fuzz.spec.ts: whatever the private service answers, the client returns a
// well-formed SourceResult and never throws.
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { BusinessLogicClient } from "../../src/business-logic-client.js";

const jsonValue = fc.jsonValue();

describe("fuzz: BusinessLogicClient.callForUser", () => {
  it("always resolves to a SourceResult shape", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 599 }),
        jsonValue,
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }).map((s) => `/x${s.replace(/[^a-zA-Z0-9/_-]/g, "")}`),
        async (status, body, userId, path) => {
          const fetchImpl = vi.fn(async () => ({
            ok: status >= 200 && status < 300,
            status,
            json: async () => body,
          }));
          const client = new BusinessLogicClient({
            baseUrl: "https://core.internal",
            serviceToken: "svc",
            fetchImpl: fetchImpl as never,
          });
          const r = await client.callForUser(userId, "GET", path);
          expect(r).toMatchObject({
            available: expect.any(Boolean),
            source: expect.stringContaining("business-logic:"),
          });
          if (r.available) {
            expect(status).toBeGreaterThanOrEqual(200);
            expect(status).toBeLessThan(300);
          } else {
            expect(r.data).toBeNull();
            expect(typeof r.error).toBe("string");
          }
        },
      ),
      { numRuns: 300 },
    );
  });

  it("never throws even when json() rejects", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 200, max: 299 }), async (status) => {
        const client = new BusinessLogicClient({
          baseUrl: "https://core.internal",
          serviceToken: "svc",
          fetchImpl: (async () => ({
            ok: true,
            status,
            json: async () => {
              throw new Error("not json");
            },
          })) as never,
        });
        const r = await client.callForUser("uuid", "POST", "/score", { a: 1 });
        expect(r.available).toBe(false);
        expect(r.error).toBe("empty_payload");
      }),
      { numRuns: 50 },
    );
  });
});
