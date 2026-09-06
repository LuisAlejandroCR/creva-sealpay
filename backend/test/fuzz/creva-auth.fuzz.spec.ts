// creva-auth.fuzz.spec.ts: getCrevaAccessToken() must never throw an unexpected error shape or
// hang when the Creva backend's /auth/refresh response is malformed, expired, or hostile — it
// either resolves a usable token or rejects, always cleanly.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";

const originalFetch = global.fetch;

describe("getCrevaAccessToken — hostile /auth/refresh responses", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.CREVA_API_URL = "https://creva.example.com";
    process.env.CREVA_SERVICE_REFRESH_TOKEN = "seed-refresh-token";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
    delete process.env.CREVA_API_URL;
    delete process.env.CREVA_SERVICE_REFRESH_TOKEN;
  });

  it("never throws anything but a plain Error, and never returns a non-string token", async () => {
    const hostileBody = fc.oneof(
      fc.record(
        { accessToken: fc.string(), refreshToken: fc.string() },
        { requiredKeys: [] },
      ),
      fc.string(),
      fc.array(fc.anything()),
      fc.constant(null),
      fc.constant(undefined),
    );
    const NULL_BODY_STATUSES = new Set([204, 205, 304]);
    const status = fc
      .integer({ min: 200, max: 599 })
      .filter((code) => !NULL_BODY_STATUSES.has(code));

    await fc.assert(
      fc.asyncProperty(hostileBody, status, async (body, statusCode) => {
        vi.resetModules();
        const raw = body === undefined ? "not json{{{" : JSON.stringify(body);
        global.fetch = vi.fn().mockResolvedValue(
          new Response(raw, { status: statusCode, headers: { "content-type": "application/json" } }),
        ) as unknown as typeof fetch;

        const { getCrevaAccessToken } = await import("../../src/creva-auth.js");

        try {
          const token = await getCrevaAccessToken();
          expect(typeof token).toBe("string");
          expect(token.length).toBeGreaterThan(0);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }),
      { numRuns: 50 },
    );
  });
});
