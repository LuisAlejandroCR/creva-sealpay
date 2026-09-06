// key-ring.spec.ts: unit coverage for resolveSecret/requireSecret - env fallback,
// Key Ring test backend, empty-string rejection, and name-only error messages.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  keyRingEnabled,
  requireSecret,
  resolveSecret,
  setKeyRingBackendForTesting,
} from "../../src/key-ring.js";

const NAME = "TEST_SECRET_ABC";

beforeEach(() => {
  delete process.env.KEY_RING_ENABLED;
  delete process.env[NAME];
  setKeyRingBackendForTesting(null);
});

afterEach(() => {
  delete process.env.KEY_RING_ENABLED;
  delete process.env[NAME];
  setKeyRingBackendForTesting(null);
});

describe("resolveSecret - env fallback (Key Ring disabled)", () => {
  it("returns the process.env value", async () => {
    process.env[NAME] = "0xdeadbeef";
    await expect(resolveSecret(NAME)).resolves.toBe("0xdeadbeef");
  });

  it("returns undefined - not '' - for an absent value", async () => {
    await expect(resolveSecret(NAME)).resolves.toBeUndefined();
  });

  it("treats an empty or whitespace-only env value as absent", async () => {
    process.env[NAME] = "   ";
    await expect(resolveSecret(NAME)).resolves.toBeUndefined();
  });

  it("keyRingEnabled tracks the flag", () => {
    expect(keyRingEnabled()).toBe(false);
    process.env.KEY_RING_ENABLED = "true";
    expect(keyRingEnabled()).toBe(true);
    process.env.KEY_RING_ENABLED = "1";
    expect(keyRingEnabled()).toBe(false);
  });
});

describe("resolveSecret - Key Ring backend", () => {
  it("prefers the backend value over env", async () => {
    process.env[NAME] = "from-env";
    setKeyRingBackendForTesting(async (n) => (n === NAME ? "from-ring" : undefined));
    await expect(resolveSecret(NAME)).resolves.toBe("from-ring");
  });

  it("returns undefined when the backend has no value and env is empty", async () => {
    setKeyRingBackendForTesting(async () => undefined);
    await expect(resolveSecret(NAME)).resolves.toBeUndefined();
  });

  it("never returns an empty string from the backend", async () => {
    setKeyRingBackendForTesting(async () => "");
    await expect(resolveSecret(NAME)).resolves.toBeUndefined();
  });
});

describe("requireSecret", () => {
  it("throws with the name only - never the value - when absent everywhere", async () => {
    await expect(requireSecret(NAME)).rejects.toThrow(`missing required secret: ${NAME}`);
  });

  it("returns the resolved value when present", async () => {
    setKeyRingBackendForTesting(async () => "s3cr3t-value");
    await expect(requireSecret(NAME)).resolves.toBe("s3cr3t-value");
  });

  it("falls back to env when the Key Ring CLI is unavailable", async () => {
    process.env[NAME] = "super-secret-key-material";
    setKeyRingBackendForTesting(null);
    process.env.KEY_RING_ENABLED = "true";
    process.env.KEY_RING_CLI = "gateway-no-such-binary-xyz";
    try {
      // CLI spawn fails fast (ENOENT); env fallback still wins, no throw.
      await expect(resolveSecret(NAME)).resolves.toBe("super-secret-key-material");
    } finally {
      delete process.env.KEY_RING_CLI;
    }
  });
});
