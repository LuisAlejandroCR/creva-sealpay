// world-verify.fuzz.spec.ts: POST /onboarding/verify-world-id must never crash or 5xx on
// malformed/hostile proof payloads — it either 400s (bad shape) or 401s (rejected proof),
// always a well-formed JSON body.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import request from "supertest";

vi.mock("../../src/world-verify.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/world-verify.js")>(
    "../../src/world-verify.js",
  );
  return {
    ...actual,
    verifyWorldIdProof: vi.fn().mockResolvedValue({ verified: false, reason: "mocked_reject" }),
  };
});

describe("POST /onboarding/verify-world-id — arbitrary bodies", () => {
  let app: typeof import("../../src/index.js")["app"];

  beforeEach(async () => {
    vi.resetModules();
    process.env.NODE_ENV = "test";
    ({ app } = await import("../../src/index.js"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("never crashes or 5xx's on arbitrary JSON-ish bodies", async () => {
    const arbitraryBody = fc.oneof(
      fc.record(
        {
          merkle_root: fc.string(),
          nullifier_hash: fc.string(),
          proof: fc.string(),
          verification_level: fc.string(),
          action: fc.string(),
          signal: fc.string(),
        },
        { requiredKeys: [] },
      ),
      fc.string(),
      fc.array(fc.anything()),
      fc.constant(null),
    );

    await fc.assert(
      fc.asyncProperty(arbitraryBody, async (body) => {
        const res = await request(app)
          .post("/onboarding/verify-world-id")
          .send(body as never);

        expect([400, 401]).toContain(res.status);
        expect(typeof res.body.verified).toBe("boolean");
      }),
      { numRuns: 100 },
    );
  });
});
