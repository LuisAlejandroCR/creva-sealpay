// key-ring.fuzz.spec.ts: for arbitrary secret names and values, resolveSecret must
// never throw, never return "", and requireSecret's error must never leak the value.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fc from "fast-check";
import { requireSecret, resolveSecret, setKeyRingBackendForTesting } from "../../src/key-ring.js";

const touched = new Set<string>();

beforeEach(() => {
  delete process.env.KEY_RING_ENABLED;
  setKeyRingBackendForTesting(null);
});

afterEach(() => {
  for (const k of touched) delete process.env[k];
  touched.clear();
  setKeyRingBackendForTesting(null);
});

const nameArb = fc
  .stringMatching(/^[A-Z][A-Z0-9_]{0,40}$/)
  .filter((s) => !s.startsWith("KEY_RING") && s !== "NODE_ENV" && s !== "PATH");

describe("resolveSecret - arbitrary env values", () => {
  it("returns the exact value or undefined, never '', never throws", async () => {
    await fc.assert(
      fc.asyncProperty(nameArb, fc.string(), async (name, value) => {
        touched.add(name);
        process.env[name] = value;
        const got = await resolveSecret(name);
        expect(got === undefined || got === value).toBe(true);
        expect(got).not.toBe("");
        if (value.trim() === "") expect(got).toBeUndefined();
      }),
      { numRuns: 300 },
    );
  });
});

describe("requireSecret - error never leaks the value", () => {
  it("a thrown message for a missing key contains only the name", async () => {
    await fc.assert(
      fc.asyncProperty(nameArb, async (name) => {
        setKeyRingBackendForTesting(async () => undefined);
        try {
          await requireSecret(name);
          throw new Error("should have thrown");
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // The message is exactly the template plus the name - nothing else.
          expect(msg).toBe(`missing required secret: ${name}`);
        }
      }),
      { numRuns: 200 },
    );
  });
});
