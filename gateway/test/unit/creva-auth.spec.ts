// creva-auth.spec.ts: covers the Bazantic service account's token-refresh cache — refresh fires
// exactly when there's no cached token or the cached one is expired, and never otherwise.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalFetch = global.fetch;

function fakeJwt(expSecondsFromNow: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow })).toString(
    "base64url",
  );
  return `header.${payload}.sig`;
}

describe("creva-auth", () => {
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

  it("refreshes when there is no cached token, using the configured seed refresh token", async () => {
    const issuedAccessToken = fakeJwt(3600);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ accessToken: issuedAccessToken, refreshToken: "next-refresh-token" }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ) as unknown as typeof fetch;

    const { getCrevaAccessToken } = await import("../../src/creva-auth.js");
    const token = await getCrevaAccessToken();

    expect(token).toBe(issuedAccessToken);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://creva.example.com/auth/refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "seed-refresh-token" }),
      }),
    );
  });

  it("reuses the cached access token without refreshing again while it is still fresh", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ accessToken: fakeJwt(3600), refreshToken: "next-refresh-token" }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ) as unknown as typeof fetch;

    const { getCrevaAccessToken } = await import("../../src/creva-auth.js");
    const first = await getCrevaAccessToken();
    const second = await getCrevaAccessToken();

    expect(second).toBe(first);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("refreshes again once the cached token is expired, using the rotated refresh token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ accessToken: fakeJwt(-10), refreshToken: "rotated-refresh-token" }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ accessToken: fakeJwt(3600), refreshToken: "final-refresh-token" }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { getCrevaAccessToken } = await import("../../src/creva-auth.js");
    await getCrevaAccessToken();
    await getCrevaAccessToken();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://creva.example.com/auth/refresh",
      expect.objectContaining({ body: JSON.stringify({ refreshToken: "rotated-refresh-token" }) }),
    );
  });

  it("throws when no refresh token is configured and nothing is cached", async () => {
    delete process.env.CREVA_SERVICE_REFRESH_TOKEN;
    global.fetch = vi.fn();

    const { getCrevaAccessToken } = await import("../../src/creva-auth.js");
    await expect(getCrevaAccessToken()).rejects.toThrow("creva_service_refresh_token_not_configured");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
