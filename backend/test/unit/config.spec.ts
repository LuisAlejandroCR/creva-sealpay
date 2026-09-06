// config.spec.ts: hydrateSecrets is a no-op when the Key Ring is disabled, and
// applies Key Ring values to both config and process.env when enabled.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SECRET_KEYS = [
  "CREVA_SERVICE_REFRESH_TOKEN",
  "FACILITATOR_AUTH_TOKEN",
  "HEDERA_PAYER_PRIVATE_KEY",
  "WORLD_API_KEY",
  "ARC_SIGNER_PRIVATE_KEY",
];

beforeEach(() => {
  vi.resetModules();
  delete process.env.KEY_RING_ENABLED;
  for (const k of SECRET_KEYS) delete process.env[k];
});

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  delete process.env.KEY_RING_ENABLED;
  for (const k of SECRET_KEYS) delete process.env[k];
});

describe("hydrateSecrets", () => {
  it("returns [] and does not change env when KEY_RING_ENABLED is unset", async () => {
    process.env.FACILITATOR_AUTH_TOKEN = "plain-env-token";
    const { hydrateSecrets, config } = await import("../../src/config.js");
    const changed = await hydrateSecrets();
    expect(changed).toEqual([]);
    expect(process.env.FACILITATOR_AUTH_TOKEN).toBe("plain-env-token");
    expect(config.facilitatorAuthToken).toBe("plain-env-token");
  });

  it("applies Key Ring values to config and process.env when enabled", async () => {
    process.env.KEY_RING_ENABLED = "true";
    vi.doMock("../../src/key-ring.js", () => ({
      keyRingEnabled: () => true,
      resolveSecret: async (name: string) =>
        name === "WORLD_API_KEY" ? "ring-world-key" : undefined,
    }));
    // config.js runs hydrateSecrets() at import time; a second call is idempotent.
    const { hydrateSecrets, config } = await import("../../src/config.js");
    await hydrateSecrets();
    expect(process.env.WORLD_API_KEY).toBe("ring-world-key");
    expect(config.worldApiKey).toBe("ring-world-key");
  });
});
