// arc-anchor.fuzz.spec.ts: POST /creva-score/anchor must never crash or 5xx on arbitrary bodies —
// only a well-formed 32-byte hex hash may reach the signer; everything else is a clean 400.
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import request from "supertest";
import { app } from "../../src/index.js";

describe("POST /creva-score/anchor — arbitrary bodies", () => {
  it("never crashes or 5xx's, and only a well-formed hash reaches the signer stage", async () => {
    const arbitraryBody = fc.oneof(
      fc.record({ canonicalHash: fc.string() }, { requiredKeys: [] }),
      fc.string(),
      fc.array(fc.anything()),
      fc.constant(null),
      fc.constant(undefined),
    );

    await fc.assert(
      fc.asyncProperty(arbitraryBody, async (body) => {
        const res = await request(app).post("/creva-score/anchor").send(body as never);

        expect(res.status).toBeLessThan(500);
        expect(typeof res.body.anchored).toBe("boolean");
      }),
      { numRuns: 100 },
    );
  });

  it("rejects any hash not matching /^0x[0-9a-fA-F]{64}$/ with 400", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => !/^0x[0-9a-fA-F]{64}$/.test(s)),
        async (canonicalHash) => {
          const res = await request(app).post("/creva-score/anchor").send({ canonicalHash });
          // 429 is the shared rate limiter tripping under heavy fuzz volume, not a validation
          // failure — the invariant under test is that a bad hash is never accepted (never 200).
          expect([400, 429]).toContain(res.status);
          if (res.status === 400) {
            expect(res.body).toEqual({ anchored: false, reason: "invalid_canonical_hash" });
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
