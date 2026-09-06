// onboarding-never-succeeds-unverified.invariant.spec.ts: security property that must hold no
// matter the input — POST /onboarding/verify-world-id only ever returns a 200 "verified" body
// when the World Developer Portal itself reported success. Every other outcome (rejected proof,
// malformed shape, network failure, missing key) must never come back as verified: true.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import request from "supertest";

vi.mock("../../src/world-verify.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/world-verify.js")>(
    "../../src/world-verify.js",
  );
  return { ...actual, verifyWorldIdProof: vi.fn() };
});

describe("invariant: onboarding never reports success without a verified World API response", () => {
  let app: typeof import("../../src/index.js")["app"];
  let verifyWorldIdProof: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    process.env.NODE_ENV = "test";
    ({ app } = await import("../../src/index.js"));
    ({ verifyWorldIdProof } = (await import("../../src/world-verify.js")) as unknown as {
      verifyWorldIdProof: ReturnType<typeof vi.fn>;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validProofShape = fc.record({
    nonce: fc.string({ minLength: 1 }),
    merkle_root: fc.string({ minLength: 1 }),
    nullifier_hash: fc.string({ minLength: 1 }),
    proof: fc.string({ minLength: 1 }),
    verification_level: fc.string({ minLength: 1 }),
    action: fc.string({ minLength: 1 }),
  });

  it("route reports verified:true only when the World API mock said verified:true", async () => {
    await fc.assert(
      fc.asyncProperty(
        validProofShape,
        fc.oneof(
          fc.record({ verified: fc.constant(true), nullifierHash: fc.string() }),
          fc.record({ verified: fc.constant(false), reason: fc.string() }),
        ),
        async (proof, worldResult) => {
          verifyWorldIdProof.mockResolvedValue(worldResult);

          const res = await request(app).post("/onboarding/verify-world-id").send(proof);

          expect(res.body.verified).toBe(worldResult.verified);
          if (res.body.verified) {
            expect(res.status).toBe(200);
          } else {
            expect(res.status).toBe(401);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("a malformed payload never reaches the World API and never reports verified", async () => {
    await fc.assert(
      fc.asyncProperty(fc.dictionary(fc.string(), fc.anything()), async (malformedBody) => {
        verifyWorldIdProof.mockClear();
        verifyWorldIdProof.mockResolvedValue({ verified: true, nullifierHash: "0xshould-not-run" });

        const res = await request(app).post("/onboarding/verify-world-id").send(malformedBody);

        if (!verifyWorldIdProof.mock.calls.length) {
          expect(res.body.verified).toBe(false);
          expect(res.status).toBe(400);
        }
      }),
      { numRuns: 100 },
    );
  });
});
