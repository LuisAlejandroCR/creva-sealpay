// creva-auth.ts: keeps the Bazantic service account's Creva access token fresh. The gateway holds
// only a long-lived refresh token (CREVA_SERVICE_REFRESH_TOKEN); this module exchanges it for a
// short-lived access token via POST /auth/refresh and caches the result in memory only — an access
// token is never written to disk, and a static JWT env var would just go stale the same way.
import { config } from "./config.js";

interface CachedToken {
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
}

let cache: CachedToken | null = null;

// Access tokens are JWTs; the exp claim (seconds since epoch) tells us when to refresh without
// needing the backend to also hand us a TTL. If it can't be read, treat the token as unusable
// rather than caching something we can't validate the lifetime of.
function decodeExpiryMs(jwt: string): number | null {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

const EXPIRY_BUFFER_MS = 30_000;

function isFresh(token: CachedToken, nowMs: number): boolean {
  return nowMs < token.expiresAtMs - EXPIRY_BUFFER_MS;
}

async function refresh(refreshToken: string): Promise<CachedToken> {
  const res = await fetch(`${config.crevaApiUrl}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error(`creva_refresh_failed:${res.status}`);
  }

  const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
  if (!data.accessToken || !data.refreshToken) {
    throw new Error("creva_refresh_malformed_response");
  }

  const expiresAtMs = decodeExpiryMs(data.accessToken);
  if (expiresAtMs === null) {
    throw new Error("creva_refresh_unreadable_expiry");
  }

  return { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAtMs };
}

// Returns a valid access token, refreshing first if there's no cached token or it's expired.
export async function getCrevaAccessToken(): Promise<string> {
  const nowMs = Date.now();
  if (cache && isFresh(cache, nowMs)) {
    return cache.accessToken;
  }

  const seedRefreshToken = cache?.refreshToken ?? config.crevaServiceRefreshToken;
  if (!seedRefreshToken) {
    throw new Error("creva_service_refresh_token_not_configured");
  }

  cache = await refresh(seedRefreshToken);
  return cache.accessToken;
}

// Test-only: clears the in-memory cache so each test starts from a known state.
export function resetCrevaAuthCacheForTests(): void {
  cache = null;
}
