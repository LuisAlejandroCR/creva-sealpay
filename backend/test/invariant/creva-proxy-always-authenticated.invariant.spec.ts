// creva-proxy-always-authenticated.invariant.spec.ts: proxyToCreva must never call fetch against
// the Creva backend without a valid Authorization header — a broken or missing service token must
// short-circuit into a 502 response, never a silent unauthenticated forward.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";

vi.mock("../../src/creva-auth.js", () => ({
  getCrevaAccessToken: vi.fn(),
}));

import { getCrevaAccessToken } from "../../src/creva-auth.js";
import { proxyToCreva } from "../../src/creva-proxy.js";

function fakeReqRes(body: unknown) {
  const req = { method: "POST", body } as unknown as import("express").Request;
  const state = { statusCode: 0, headers: {} as Record<string, string>, sentBody: undefined as unknown };
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value;
    },
    send(payload: unknown) {
      state.sentBody = payload;
    },
    json(payload: unknown) {
      state.sentBody = payload;
    },
  } as unknown as import("express").Response;
  return { req, res, state };
}

describe("proxyToCreva — authentication invariant", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.mocked(getCrevaAccessToken).mockReset();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("never calls fetch when the access token cannot be obtained, for any failure reason", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.dictionary(fc.string(), fc.jsonValue()), async (failureReason, body) => {
        vi.mocked(getCrevaAccessToken).mockRejectedValueOnce(new Error(failureReason));
        vi.mocked(global.fetch).mockClear();

        const { req, res, state } = fakeReqRes(body);
        await proxyToCreva(req, res, "/creva-score/report");

        expect(global.fetch).not.toHaveBeenCalled();
        expect(state.statusCode).toBe(502);
      }),
      { numRuns: 50 },
    );
  });

  it("always attaches a non-empty Authorization bearer header when the token is obtained", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.dictionary(fc.string(), fc.jsonValue()),
        async (accessToken, body) => {
          vi.mocked(getCrevaAccessToken).mockResolvedValueOnce(accessToken);
          vi.mocked(global.fetch).mockResolvedValueOnce(
            new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
          );

          const { req, res } = fakeReqRes(body);
          await proxyToCreva(req, res, "/creva-score/report");

          const [, init] = vi.mocked(global.fetch).mock.calls.at(-1)!;
          const headers = (init as RequestInit).headers as Record<string, string>;
          expect(headers.authorization).toBe(`Bearer ${accessToken}`);
        },
      ),
      { numRuns: 50 },
    );
  });
});
