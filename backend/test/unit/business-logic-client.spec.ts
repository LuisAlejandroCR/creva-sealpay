// business-logic-client.spec.ts: the HTTP client to the private creva-business-logic service.
import { describe, it, expect, vi } from "vitest";
import { BusinessLogicClient } from "../../src/business-logic-client.js";

const OPTS = { baseUrl: "https://core.internal", serviceToken: "svc-token-xyz" };

function okFetch(body: unknown, status = 200): typeof globalThis.fetch {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof globalThis.fetch;
}

describe("BusinessLogicClient", () => {
  it("returns the payload on a 200", async () => {
    const client = new BusinessLogicClient({ ...OPTS, fetchImpl: okFetch({ score: 1 }) });
    const r = await client.callForUser("uuid-1", "GET", "/score");
    expect(r.available).toBe(true);
    expect(r.data).toEqual({ score: 1 });
  });

  it("sends Authorization: Bearer <token> and X-User-Id, never the user id as identity token", async () => {
    const spy = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    const client = new BusinessLogicClient({ ...OPTS, fetchImpl: spy as never });
    await client.callForUser("uuid-42", "GET", "/collateral");
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer svc-token-xyz");
    expect(headers["X-User-Id"]).toBe("uuid-42");
  });

  it("degrades a 500 to a typed unavailable result (never throws)", async () => {
    const client = new BusinessLogicClient({ ...OPTS, fetchImpl: okFetch({ error: "boom" }, 500) });
    const r = await client.callForUser("uuid-1", "GET", "/recommendations");
    expect(r.available).toBe(false);
    expect(r.error).toBe("http_500");
    expect(r.data).toBeNull();
  });

  it("degrades a network error / timeout to a typed unavailable result", async () => {
    const boom = vi.fn(async () => {
      const e = new Error("timed out");
      e.name = "TimeoutError";
      throw e;
    });
    const client = new BusinessLogicClient({ ...OPTS, fetchImpl: boom as never });
    const r = await client.callForUser("uuid-1", "GET", "/score");
    expect(r.available).toBe(false);
    expect(r.error).toBe("request_failed:timeout");
  });

  it("refuses a call with a blank user id before any fetch", async () => {
    const spy = vi.fn();
    const client = new BusinessLogicClient({ ...OPTS, fetchImpl: spy as never });
    const r = await client.callForUser("", "GET", "/score");
    expect(r.available).toBe(false);
    expect(r.error).toBe("missing_user_id");
    expect(spy).not.toHaveBeenCalled();
  });
});
