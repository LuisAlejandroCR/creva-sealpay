// key-ring.invariant.spec.ts: the three hard invariants of the Key Ring backend -
// (1) with KEY_RING_ENABLED unset/false the behavior is byte-identical to process.env;
// (2) a secret value is never written to a log or an error message;
// (3) a key absent in both backends fails explicitly, never as a silent "".
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  vi.restoreAllMocks();
});

const nameArb = fc
  .stringMatching(/^[A-Z][A-Z0-9_]{0,30}$/)
  .filter((s) => !s.startsWith("KEY_RING") && s !== "NODE_ENV" && s !== "PATH");

describe("invariant 1: disabled Key Ring == plain process.env", () => {
  it("resolveSecret mirrors process.env for present and absent keys", async () => {
    await fc.assert(
      fc.asyncProperty(nameArb, fc.option(fc.string(), { nil: undefined }), async (name, value) => {
        touched.add(name);
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;

        const expected =
          value !== undefined && value.trim() !== "" ? value : undefined;
        await expect(resolveSecret(name)).resolves.toBe(expected);
      }),
      { numRuns: 300 },
    );
  });
});

describe("invariant 2: no secret in logs or error messages", () => {
  it("resolving and requiring a secret never passes its value to console.*", async () => {
    const spies = [
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "info").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "error").mockImplementation(() => {}),
      vi.spyOn(console, "debug").mockImplementation(() => {}),
    ];
    const secret = "PRIVATE-KEY-0xabc123-do-not-log";
    setKeyRingBackendForTesting(async () => secret);

    await resolveSecret("ARC_SIGNER_PRIVATE_KEY");
    await requireSecret("ARC_SIGNER_PRIVATE_KEY");

    for (const spy of spies) {
      for (const call of spy.mock.calls) {
        expect(JSON.stringify(call)).not.toContain(secret);
      }
    }
  });

  it("a failing real backend surfaces a generic error, not ciphertext or paths", async () => {
    process.env.KEY_RING_ENABLED = "true";
    process.env.KEY_RING_CLI = "definitely-not-a-real-binary-xyz";
    touched.add("KEY_RING_ENABLED");
    touched.add("KEY_RING_CLI");
    touched.add("SOME_MISSING_SECRET");
    delete process.env.SOME_MISSING_SECRET;
    setKeyRingBackendForTesting(null);

    // env fallback is empty -> resolves undefined (no throw from the CLI failure)
    await expect(resolveSecret("SOME_MISSING_SECRET")).resolves.toBeUndefined();
    await expect(requireSecret("SOME_MISSING_SECRET")).rejects.toThrow(
      "missing required secret: SOME_MISSING_SECRET",
    );
  });
});

describe("invariant 3: absent in both backends fails explicitly", () => {
  it("resolveSecret -> undefined, requireSecret -> throws, never ''", async () => {
    setKeyRingBackendForTesting(async () => undefined);
    await expect(resolveSecret("NOWHERE_SECRET")).resolves.toBeUndefined();
    await expect(requireSecret("NOWHERE_SECRET")).rejects.toThrow("missing required secret");

    setKeyRingBackendForTesting(async () => "");
    process.env.EMPTY_BOTH = "";
    touched.add("EMPTY_BOTH");
    const got = await resolveSecret("EMPTY_BOTH");
    expect(got).toBeUndefined();
    expect(got).not.toBe("");
  });
});
