// backend-pending.spec.ts: the "signed in with Clerk but the core doesn't accept the token yet"
// state. A 401 on a request that carried a session token → ApiError.backendUnlinked → every
// core-backed screen shows BackendPendingState, never a raw 401 or an endless spinner. Any other
// failure (403, 500, a 401 with no token, a network error) keeps the normal error path.
import { readFileSync } from "fs";
import { join } from "path";
import { ApiError, isBackendUnlinked, score, setSessionSource } from "../../lib/api";

const read = (p: string) => readFileSync(join(__dirname, "../..", p), "utf-8");
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  setSessionSource(null);
});

describe("ApiError.backendUnlinked", () => {
  it("is true only for a 401 that carried a token", () => {
    expect(new ApiError("x", 401, {}, true).backendUnlinked).toBe(true);
    expect(new ApiError("x", 401, {}, false).backendUnlinked).toBe(false);
    expect(new ApiError("x", 403, {}, true).backendUnlinked).toBe(false);
    expect(new ApiError("x", 500, {}, true).backendUnlinked).toBe(false);
  });

  it("isBackendUnlinked only trips on an ApiError with the flag", () => {
    expect(isBackendUnlinked(new ApiError("x", 401, {}, true))).toBe(true);
    expect(isBackendUnlinked(new ApiError("x", 401, {}, false))).toBe(false);
    expect(isBackendUnlinked(new Error("network down"))).toBe(false);
    expect(isBackendUnlinked({ status: 401 })).toBe(false);
    expect(isBackendUnlinked(undefined)).toBe(false);
  });
});

describe("request() surfaces backendUnlinked", () => {
  function mock401() {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Invalid or expired token" }),
    }) as unknown as typeof fetch;
  }

  it("401 + a registered session token → backendUnlinked", async () => {
    setSessionSource({ getToken: () => Promise.resolve("clerk-token"), userId: "u1" });
    mock401();
    await score.get().then(
      () => {
        throw new Error("should have rejected");
      },
      (err) => {
        expect(isBackendUnlinked(err)).toBe(true);
      },
    );
  });

  it("401 with no session token → NOT backendUnlinked (a dead session, not a config gap)", async () => {
    setSessionSource(null);
    mock401();
    await score.get().then(
      () => {
        throw new Error("should have rejected");
      },
      (err) => {
        expect(err).toBeInstanceOf(ApiError);
        expect(isBackendUnlinked(err)).toBe(false);
      },
    );
  });
});

describe("BackendPendingState + screen wiring", () => {
  it("the component is one calm line, no error-red token", () => {
    const src = read("features/shared/BackendPendingState.tsx");
    expect(src).toContain("Estás dentro. Tu información de Creva se conecta pronto.");
    expect(src).not.toMatch(/text-crimson|text-danger|bg-crimson/);
  });

  for (const screen of [
    "features/dashboard/DashboardScreen.tsx",
    "features/score/ScoreScreen.tsx",
    "features/credit/CreditScreen.tsx",
    "features/card/CardScreen.tsx",
    "features/more/StatementsScreen.tsx",
  ]) {
    it(`${screen} branches to BackendPendingState on isBackendUnlinked and keeps its error path`, () => {
      const src = read(screen);
      expect(src).toMatch(/isBackendUnlinked\(/);
      expect(src).toMatch(/<BackendPendingState/);
      // the pre-existing error/empty branch is still there
      expect(src).toMatch(/error|Error|empty|Sin tarjetas|No pudimos/);
    });
  }
});
